"""Step 9: merge curation and export everything to web/public/data/ (see docs/DATA_MODEL.md)."""
from __future__ import annotations

import json
import math
import re
import shutil
import time
import unicodedata

import pandas as pd

from . import config, flags as flags_mod
from .cells import cell_ids  # noqa: F401  (cell ids are produced in cells.py)

HARVEST = {"safe", "careful", "do-not-harvest", "unknown"}
EMA = {"well-established", "traditional", "none", "unknown"}
MAX_SPECIES_BYTES = 2_000_000
MAX_OCC_BYTES = 200_000


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name.replace("×", " ")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def norm_name(name: str) -> str:
    return re.sub(r"\s+", " ", name.replace("×", " ").lower()).strip()


def blank(v) -> str | None:
    return None if v is None or (isinstance(v, float) and math.isnan(v)) or str(v).strip() == "" else str(v).strip()


def dump(obj, path) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return path.stat().st_size


def load_featured(slug_by_name: dict[str, str]) -> dict[str, dict]:
    df = pd.read_csv(config.FEATURED_CSV, dtype=str).fillna("")
    errors, out = [], {}
    for r in df.itertuples():
        sci = r.scientific_name.strip().lower()
        if sci not in slug_by_name:
            errors.append(f"featured species not in catalogue: {r.scientific_name}")
            continue
        if r.harvest not in HARVEST:
            errors.append(f"{r.scientific_name}: invalid harvest '{r.harvest}'")
        if r.ema_status not in EMA:
            errors.append(f"{r.scientific_name}: invalid ema_status '{r.ema_status}'")
        subs = [s.strip() for s in r.substitutes.split(";") if s.strip()]
        out[slug_by_name[sci]] = {"row": r, "subs": subs}
    for slug, d in out.items():
        for s in d["subs"]:
            if s not in set(slug_by_name.values()):
                errors.append(f"{slug}: unknown substitute slug '{s}'")
    if errors:
        raise SystemExit("featured_species.csv errors:\n  " + "\n  ".join(errors))
    return out


# ---- evidence cards (featured species only; config/evidence.csv is edited by the science lead) ----
EVIDENCE_CSV = config.CONFIG_DIR / "evidence.csv"
EVIDENCE_META = config.CONFIG_DIR / "evidence_meta.yaml"
EVIDENCE_COLUMNS = ["slug", "kind", "title", "finding", "limitations", "plant_part", "preparation", "design", "source_type",
                    "source_id", "source_url", "verified_at", "verification", "specialist_review", "safety_note"]
EVIDENCE_KINDS = {"traditional_use", "human_research", "animal_or_lab", "review", "regulatory_monograph"}
EVIDENCE_SOURCES = {"pubmed", "doi", "ema_monograph", "other"}
VERIFIED = "checked against linked source"
VERIFICATIONS = {VERIFIED, "unverified"}
# no dosing anywhere: quantities with units, "daily dose", "times daily", "posology"
DOSING = re.compile(r"\b\d+(?:[.,]\d+)?\s*(?:mg|g|kg|ml|mcg|µg|iu)\b|\b(?:daily dose|single dose|dosage|dosing|posology)\b|\b(?:once|twice|\d+\s*times)\s+(?:a\s+|per\s+)?(?:day|daily)\b", re.I)


def sentences(text: str) -> int:
    return len([x for x in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", text.strip()) if x])


def load_evidence(featured_slugs: set[str]) -> tuple[str, dict[str, list[dict]]]:
    """Read and validate evidence.csv. Any problem stops the export: evidence must never be silently wrong."""
    import yaml

    version = yaml.safe_load(EVIDENCE_META.read_text(encoding="utf-8"))["version"]
    if not EVIDENCE_CSV.exists():
        return version, {}
    df = pd.read_csv(EVIDENCE_CSV, dtype=str, keep_default_na=False)
    errors: list[str] = []
    if list(df.columns) != EVIDENCE_COLUMNS:
        raise SystemExit(f"evidence.csv columns must be exactly: {EVIDENCE_COLUMNS}")
    out: dict[str, list[dict]] = {}
    for n, r in enumerate(df.to_dict("records"), start=2):
        where = f"evidence.csv line {n} ({r['slug']})"
        if r["slug"] not in featured_slugs:
            errors.append(f"{where}: only featured species may have evidence")
        if r["kind"] not in EVIDENCE_KINDS:
            errors.append(f"{where}: invalid kind '{r['kind']}'")
        if r["source_type"] not in EVIDENCE_SOURCES:
            errors.append(f"{where}: invalid source_type '{r['source_type']}'")
        if r["verification"] not in VERIFICATIONS:
            errors.append(f"{where}: verification must be '{VERIFIED}' or 'unverified'")
        for col in EVIDENCE_COLUMNS:
            if col != "safety_note" and r[col].strip() == "":
                errors.append(f"{where}: '{col}' is empty (write 'unknown' if the source does not state it)")
        if r["verification"] == VERIFIED:
            if not r["source_url"].startswith("http"):
                errors.append(f"{where}: verification '{VERIFIED}' needs a source_url")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["verified_at"]):
                errors.append(f"{where}: verified_at must be a date (YYYY-MM-DD) when verified")
        for col in ("finding", "limitations"):
            if sentences(r[col]) > 2:
                errors.append(f"{where}: '{col}' has more than 2 sentences")
        for col in EVIDENCE_COLUMNS:
            if DOSING.search(r[col]):
                errors.append(f"{where}: '{col}' looks like dosing information, which Chloris never shows")
        out.setdefault(r["slug"], []).append({
            "kind": r["kind"], "title": r["title"], "finding": r["finding"], "limitations": r["limitations"],
            "plantPart": r["plant_part"], "preparation": r["preparation"], "design": r["design"],
            "sourceType": r["source_type"], "sourceId": r["source_id"], "sourceUrl": r["source_url"],
            "verifiedAt": r["verified_at"], "verification": r["verification"], "specialistReview": r["specialist_review"],
            "safetyNote": r["safety_note"].strip() or None,
        })
    for slug, entries in out.items():
        if len(entries) > 2:
            errors.append(f"evidence.csv: {slug} has {len(entries)} entries (maximum 2)")
    if errors:
        raise SystemExit("evidence.csv errors:\n  " + "\n  ".join(errors))
    return version, out


def run() -> None:
    sc = config.load_scoring()
    W = config.WORK_DIR
    out_dir = config.EXPORT_DIR
    med = pd.read_parquet(W / "medicinal_species.parquet")
    keys = pd.read_parquet(W / "species_keys.parquet")[["plant_name_id", "accepted_key"]]
    gb = pd.read_parquet(W / "species_gbif.parquet")[["plant_name_id", "iucn", "name_el_gbif", "name_en_gbif"]]
    fl = pd.read_parquet(W / "species_flags.parquet")[["plant_name_id", "data_quality", "review", "review_note", "records_attributed"]]
    sco = pd.read_parquet(W / "scores.parquet")[["plant_name_id", "score", "level", "parts", "at_risk_rule"]]
    stats = pd.read_parquet(W / "species_stats.parquet")
    eff = json.loads((W / "effort.json").read_text())
    prot = pd.read_parquet(W / "species_protected.parquet") if (W / "species_protected.parquet").exists() else None
    cprot = pd.read_parquet(W / "cell_protected.parquet") if (W / "cell_protected.parquet").exists() else None
    fire = pd.read_parquet(W / "species_fire.parquet") if (W / "species_fire.parquet").exists() else None

    df = (med.merge(keys, on="plant_name_id", how="left").merge(gb, on="plant_name_id", how="left")
             .merge(fl, on="plant_name_id", how="left").merge(sco, on="plant_name_id", how="left")
             .merge(stats, on="plant_name_id", how="left"))
    if prot is not None:
        df = df.merge(prot, on="plant_name_id", how="left")
    if fire is not None:
        df = df.merge(fire[["plant_name_id", "fire_share"]], on="plant_name_id", how="left")
    df["iucn"] = df.iucn.fillna("NE")

    # slug + catalogue numbers (by family, then name)
    df["slug"] = df.taxon_name.map(slugify)
    dups = df[df.slug.duplicated(keep=False)]
    if len(dups):
        raise SystemExit(f"slug collisions: {dups.taxon_name.tolist()}")
    df = df.sort_values(["family", "taxon_name"]).reset_index(drop=True)
    df["cat"] = [f"CHL-{i + 1:04d}" for i in range(len(df))]
    slug_by_name = dict(zip(df.taxon_name.str.lower(), df.slug))
    featured = load_featured(slug_by_name)
    evidence_version, evidence = load_evidence(set(featured))
    index_of = {s: i for i, s in enumerate(df.slug)}

    species = []
    for r in df.itertuples():
        f = featured.get(r.slug)
        has_rec = pd.notna(r.n_records)
        n_old, n_new = (int(r.n_old), int(r.n_new)) if has_rec else (0, 0)
        decline = None
        if has_rec and n_old >= sc["min_old_records"]:
            decline = round((n_new / eff["N_new"]) / (n_old / eff["N_old"]), 2)
        at_risk = bool(r.at_risk_rule) or (f is not None and f["row"].harvest == "do-not-harvest")
        sp = {
            "slug": r.slug, "cat": r.cat, "name": r.taxon_name, "authors": r.taxon_authors if blank(r.taxon_authors) else "",
            "family": r.family,
            "nameEl": blank(f["row"].name_el) if f else None, "nameEn": blank(f["row"].name_en) if f else None,
            "powoId": blank(r.powo_id), "gbifKey": int(r.accepted_key) if pd.notna(r.accepted_key) else None,
            "endemic": bool(r.endemic_gr), "iucn": r.iucn, "iucnLabel": config.IUCN_LABELS[r.iucn],
            "dataQuality": list(r.data_quality), "review": list(r.review), "reviewNote": blank(r.review_note),
            "medicinalSource": r.medicinal_source,
            "risk": {"score": int(r.score), "level": r.level, "atRisk": at_risk, "parts": dict(r.parts)},
            "stats": {
                "records": int(r.n_records) if has_rec else 0, "cells": int(r.n_cells) if has_rec else 0,
                "recordsOld": n_old, "recordsNew": n_new, "declineRatio": decline,
                "protectedShare": round(float(r.protected_share), 2) if getattr(r, "protected_share", None) is not None and pd.notna(r.protected_share) else None,
                "fireShare": round(float(r.fire_share), 2) if getattr(r, "fire_share", None) is not None and pd.notna(r.fire_share) else None,
                "firstYear": int(r.first_year) if has_rec and pd.notna(r.first_year) else None,
                "lastYear": int(r.last_year) if has_rec and pd.notna(r.last_year) else None,
            },
            "featured": f is not None,
        }
        # GBIF vernacular names fill gaps only; curated names win
        if sp["nameEl"] is None and blank(r.name_el_gbif):
            sp["nameEl"] = blank(r.name_el_gbif)
        if sp["nameEn"] is None and blank(r.name_en_gbif):
            sp["nameEn"] = blank(r.name_en_gbif)
        if f:
            row = f["row"]
            sp["curated"] = {"usesEn": row.uses_en, "usesEl": row.uses_el, "ema": row.ema_status,
                             "emaUrl": blank(row.ema_url), "harvest": row.harvest, "substitutes": f["subs"],
                             "reviewedBy": blank(row.reviewed_by)}
        species.append(sp)

    # ---- files ----
    sizes = {"species.json": dump(species, out_dir / "species.json")}
    if sizes["species.json"] > MAX_SPECIES_BYTES:
        raise SystemExit(f"species.json is {sizes['species.json']:,} bytes (> {MAX_SPECIES_BYTES:,})")

    # names.json: accepted names always win; a synonym shared by several species is ambiguous and left out
    by_name, by_powo, by_gbif = {}, {}, {}
    for r in df.itertuples():
        by_name[norm_name(r.taxon_name)] = r.slug
    syn_targets: dict[str, set[str]] = {}
    for r in df.itertuples():
        for s_ in r.synonyms:
            syn_targets.setdefault(norm_name(s_), set()).add(r.slug)
        if blank(r.powo_id):
            by_powo[r.powo_id] = r.slug
        if pd.notna(r.accepted_key) and r.records_attributed:
            by_gbif[str(int(r.accepted_key))] = r.slug
    collisions = 0
    for k, targets in syn_targets.items():
        if k in by_name:
            continue
        if len(targets) == 1:
            by_name[k] = next(iter(targets))
        else:
            collisions += 1
    sizes["names.json"] = dump({"byName": by_name, "byPowo": by_powo, "byGbif": by_gbif}, out_dir / "names.json")

    # occ/<slug>.json
    sc_tab = pd.read_parquet(W / "species_cells.parquet")
    slug_by_id = dict(zip(df.plant_name_id, df.slug))
    occ_dir = out_dir / "occ"
    if occ_dir.exists():
        shutil.rmtree(occ_dir)
    biggest = 0
    for pid, g in sc_tab.groupby("plant_name_id"):
        recs = [{"c": c.cell, "n": int(c.n), "f": None if pd.isna(c.first_year) else int(c.first_year),
                 "l": None if pd.isna(c.last_year) else int(c.last_year), "o": int(c.n_old), "w": int(c.n_new)}
                for c in g.itertuples()]
        size = dump(recs, occ_dir / f"{slug_by_id[pid]}.json")
        biggest = max(biggest, size)
        if size > MAX_OCC_BYTES:
            raise SystemExit(f"occ/{slug_by_id[pid]}.json is {size:,} bytes (> {MAX_OCC_BYTES:,})")
    sizes["occ/*.json (largest)"] = biggest

    # cells.json
    at_risk = {s["slug"] for s in species if s["risk"]["atRisk"]}
    endemic = {s["slug"] for s in species if s["endemic"]}
    prot_by_cell = dict(zip(cprot.cell, cprot.protected_fraction)) if cprot is not None else {}
    cells_out = []
    sc_tab["slug"] = sc_tab.plant_name_id.map(slug_by_id)
    risk_by_slug = {s["slug"]: s["risk"]["score"] for s in species}
    for cell, g in sc_tab.groupby("cell"):
        slugs = sorted(g.slug, key=lambda s: -risk_by_slug[s])
        p = round(float(prot_by_cell[cell]), 2) if cell in prot_by_cell else None
        n_risk = sum(s in at_risk for s in slugs)
        cells_out.append({"id": cell, "s": [index_of[s] for s in slugs], "nAtRisk": n_risk,
                          "nEndemic": sum(s in endemic for s in slugs), "protected": p,
                          "hotspot": None if p is None else bool(n_risk >= 1 and p < sc["hotspot"]["max_protected_fraction"])})
    sizes["cells.json"] = dump({"size": sc["cell_size_deg"], "cells": cells_out}, out_dir / "cells.json")

    # evidence cards: one lazy-loaded file per species with entries (not part of species.json)
    ev_dir = out_dir / "evidence"
    if ev_dir.exists():
        shutil.rmtree(ev_dir)
    for slug, entries in evidence.items():
        dump({"version": evidence_version, "slug": slug, "entries": entries}, ev_dir / f"{slug}.json")
    sizes["evidence/*.json"] = sum(f.stat().st_size for f in ev_dir.glob("*.json")) if evidence else 0

    notes = []
    if (W / "natura_simplified.geojson").exists():
        shutil.copy(W / "natura_simplified.geojson", out_dir / "natura.geojson")
        sizes["natura.geojson"] = (out_dir / "natura.geojson").stat().st_size
    else:
        notes.append("Natura 2000 not joined: protected share and hotspots are null; the unprotected weight was rescaled away.")
    if fire is None:
        notes.append("Fire layer skipped: no burnt-area data; fire weight rescaled away.")
    notes.append("Species whose GBIF match is a synonym or shares a key are flagged in dataQuality; see flagLegend.")
    notes.append("IUCN 'Not assessed' (NE) means no assessment exists; it is not a low-risk category.")

    log = {f.stem.replace("log_", ""): json.loads(f.read_text()) for f in W.glob("log_*.json")}
    dl = json.loads((W / "gbif_download.json").read_text())
    meta = {
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sources": [
            {"name": "WCVP (World Checklist of Vascular Plants), Kew", "version": "files dated 2026-06-04, downloaded 2026-11-04",
             "url": "https://sftp.kew.org/pub/data-repositories/WCVP/", "licence": "CC BY 3.0"},
            {"name": "World Checklist of Useful Plant Species 2020 (Diazgranados et al.), Kew", "version": "2020 (PDF extraction)",
             "url": "https://doi.org/10.5063/F1CV4G34", "licence": "CC BY 4.0", "doi": "10.5063/F1CV4G34"},
            {"name": "GBIF occurrence download (Greece, medicinal species)", "version": dl["requested"][:10],
             "url": f"https://doi.org/{dl['doi']}", "licence": "per-record licences (CC0 / CC BY / CC BY-NC)", "doi": dl["doi"]},
            {"name": "GBIF backbone taxonomy and IUCN Red List categories via GBIF", "version": "API, 2026-11",
             "url": "https://www.gbif.org/developer/species", "licence": "CC BY 4.0"},
        ],
        "counts": {"greekNatives": log.get("wcvp", {}).get("greek_native_species", 0), "medicinal": len(species),
                   "featured": len(featured), "records": int(sum(s["stats"]["records"] for s in species)),
                   "cells": len(cells_out), "atRisk": len(at_risk)},
        "scoring": sc.raw,
        "verdicts": config.load_verdicts(),
        "effort": eff,
        "notes": notes,
        "evidenceSlugs": sorted(evidence),
        # how many cards / distinct safety notes each file has, so the page can show a skeleton of the right size
        "evidenceCounts": {slug: {"entries": len(e), "safetyNotes": len({x["safetyNote"] for x in e if x["safetyNote"]})} for slug, e in evidence.items()},
        "evidenceVersion": evidence_version,
        "flagLegend": flags_mod.LEGEND,
        "iucnLabels": config.IUCN_LABELS,
    }
    sizes["meta.json"] = dump(meta, out_dir / "meta.json")
    print("ambiguous synonyms left out of names.json (point to >1 species):", collisions)
    for k, v in sizes.items():
        print(f"{k:24} {v / 1024:9.1f} KB")
    print("counts:", meta["counts"])


if __name__ == "__main__":
    run()
