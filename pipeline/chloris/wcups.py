"""Step 2: medicinal filter from the World Checklist of Useful Plant Species (WCUPS, Kew 2020).

The KNB package only ships a PDF (689 pages), so this module extracts the rows from the PDF text.
Entry layout in the PDF text:

    <Scientific name with authors>   (may wrap onto 2+ lines; genus/family headings are mixed in)
     <IPNI id> | <use codes, space separated> | [<source numbers>]

Everything that cannot be parsed is counted and written to work/wcups_parse_issues.csv, never dropped silently.
Outputs: work/wcups_rows.parquet (all rows), work/medicinal_species.parquet (Greek natives with ME).
"""
from __future__ import annotations

import json
import re

import pandas as pd
from pypdf import PdfReader

from . import config

PDF = config.RAW_DIR / "wcups" / "data" / "World_Checklist_of_Useful_Plant_Species_2020.pdf"
TEXT = config.WORK_DIR / "wcups_text.txt"
ROWS = config.WORK_DIR / "wcups_rows.parquet"
ISSUES = config.WORK_DIR / "wcups_parse_issues.csv"
OUT = config.WORK_DIR / "medicinal_species.parquet"

# Legend from PDF page 4 ("Description"): ME = MEDICINES (human and veterinary).
CODES = {"AF", "EU", "FU", "GS", "HF", "IF", "MA", "ME", "PO", "SU"}
MEDICINE = "ME"

# ids are IPNI LSIDs ("358741-1"); ~53 names have no IPNI id and show "(in Tropicos)" / "(in AlgaeBase)" instead
ID_LINE = re.compile(r"^\s*(\d+-\d+|\(in (?:Tropicos|AlgaeBase)\))\s*\|(.*)$")
# wrapped fragments of a previous entry's code/source list, e.g. "CWR | [1, 3]" or "| [1, 4, 5]" or "8]"
FRAGMENT = re.compile(r"^\s*(CWR\s*)?\|?\s*\[?[\d,\s]*\]\s*$|^\s*\|\s*\[|^\s*CWR\s*\|")
NOISE = re.compile(r"World Checklist of Useful Plant Species \(2020\)|diazgranados@kew\.org|^Page \d+ of \d+|^=====PAGE")


def extract_text() -> None:
    if TEXT.exists():
        return
    reader = PdfReader(str(PDF))
    with open(TEXT, "w", encoding="utf-8") as f:
        for i, p in enumerate(reader.pages):
            f.write(f"\n=====PAGE {i + 1}\n{p.extract_text() or ''}")


def parse() -> tuple[pd.DataFrame, pd.DataFrame]:
    extract_text()
    lines = [l.rstrip("\n") for l in open(TEXT, encoding="utf-8")]
    rows, issues = [], []
    chunk: list[str] = []
    started = False  # skip front matter before the first entry
    i = 0
    while i < len(lines):
        line = lines[i]
        i += 1
        if not line.strip() or NOISE.search(line) or "Database developed by RBG Kew" in line:
            continue
        m = ID_LINE.match(line)
        if not m and FRAGMENT.match(line):
            continue
        if not m:
            chunk.append(line.strip())
            continue
        ipni, rest = m.group(1), m.group(2)
        if ipni.startswith("("):
            ipni = None  # no IPNI id: matched by name only
        parts = rest.split("|")
        code_txt = parts[0].strip()
        refs = "|".join(parts[1:]).strip()
        # refs may wrap onto following lines: "[1, 3, 4," + "9]"
        if "[" in refs and "]" not in refs:
            while i < len(lines) and "]" not in refs:
                refs += " " + lines[i].strip()
                i += 1
        codes = code_txt.split()
        bad = [c for c in codes if c not in CODES]
        # names: drop leading single-word headings (family / genus) when something follows
        name_lines = chunk
        while len(name_lines) > 1 and re.fullmatch(r"[A-Z][A-Za-z×\-]+", name_lines[0]):
            name_lines = name_lines[1:]
        name = " ".join(name_lines).strip()
        chunk = []
        problems = []
        if not name or not started and not re.match(r"^[A-Z×]", name):
            problems.append("no_name")
        if bad:
            problems.append("unknown_code:" + ",".join(bad))
        if not codes:
            problems.append("no_codes")
        if len(parts) < 2:
            problems.append("truncated_no_refs")  # codes may be incomplete
        started = True
        row = {"ipni_id": ipni, "name_raw": name, "codes": codes, "medicinal": MEDICINE in codes,
               "truncated": len(parts) < 2}
        rows.append(row)
        if problems:
            issues.append({"ipni_id": ipni, "name_raw": name, "codes": " ".join(codes), "problems": ";".join(problems)})
    return pd.DataFrame(rows), pd.DataFrame(issues)


def binomial(name: str) -> str | None:
    """Genus + epithet from a name with authors (species level only)."""
    toks = name.replace("×", " ").split()
    if len(toks) < 2 or not re.fullmatch(r"[a-z\-]+", toks[1]):
        return None
    return f"{toks[0]} {toks[1]}".lower()


def run() -> pd.DataFrame:
    config.ensure_dirs()
    rows, issues = parse()
    rows["binomial"] = rows.name_raw.map(binomial)
    rows.to_parquet(ROWS)
    issues.to_csv(ISSUES, index=False)
    print(f"WCUPS rows parsed: {len(rows):,} (dataset describes ~40,292); with ME: {int(rows.medicinal.sum()):,} "
          f"(dataset says 26,662); duplicate IPNI ids: {int(rows.ipni_id.duplicated().sum())}")
    print(f"rows with problems: {len(issues):,} -> {ISSUES.name}\n{issues.problems.str.split(';').explode().str.split(':').str[0].value_counts().to_string() if len(issues) else ''}")

    greek = pd.read_parquet(config.WORK_DIR / "greek_species.parquet")
    names = pd.read_csv(config.RAW_DIR / "wcvp" / "wcvp_names.csv", sep="|", dtype=str, low_memory=False,
                        usecols=["plant_name_id", "ipni_id", "taxon_rank", "taxon_status", "taxon_name", "accepted_plant_name_id", "parent_plant_name_id"])

    # --- all WCUPS rows vs. all WCVP (for the match-rate report) ---
    wcvp_ipni = set(names.ipni_id.dropna())
    by_ipni_all = rows.ipni_id.isin(wcvp_ipni)
    wcvp_binom = set(names[names.taxon_rank == "Species"].taxon_name.str.lower())
    by_name_all = ~by_ipni_all & rows.binomial.isin(wcvp_binom)
    print(f"all WCUPS rows -> WCVP: by IPNI id {int(by_ipni_all.sum()):,}; name only {int(by_name_all.sum()):,}; "
          f"unmatched {int((~by_ipni_all & ~by_name_all).sum()):,}")

    # --- map every WCVP name (accepted or synonym) to a Greek species ---
    species_ids = set(greek.plant_name_id)
    infra_parent = names[names.parent_plant_name_id.isin(species_ids) & names.taxon_rank.isin(["Subspecies", "Variety", "Form"])]\
        .set_index("plant_name_id").parent_plant_name_id
    target = {**{s: s for s in species_ids}, **infra_parent.to_dict()}
    n = names.assign(species_id=names.accepted_plant_name_id.map(target)).dropna(subset=["species_id"])
    # a name that IS a species keeps its own id
    n.loc[n.plant_name_id.isin(species_ids), "species_id"] = n.plant_name_id
    ipni_to_species = n.dropna(subset=["ipni_id"]).drop_duplicates("ipni_id").set_index("ipni_id").species_id
    gk = greek.set_index("plant_name_id")
    binom_to_species = {}
    for sid, tn in zip(greek.plant_name_id, greek.taxon_name):
        binom_to_species[tn.lower()] = sid
    for sid, syns in zip(greek.plant_name_id, greek.synonyms):
        for s in syns:
            b = binomial(s)
            if b and b not in binom_to_species and len(s.split()) == 2:
                binom_to_species[b] = sid

    rows["species_id"] = rows.ipni_id.map(ipni_to_species)
    rows["match"] = rows.species_id.map(lambda x: "ipni" if isinstance(x, str) else None)
    miss = rows.species_id.isna()
    by_name = rows.loc[miss, "binomial"].map(binom_to_species)
    rows.loc[miss, "species_id"] = by_name
    rows.loc[miss & by_name.notna(), "match"] = "name"
    hit = rows.dropna(subset=["species_id"])
    print(f"WCUPS rows hitting a Greek native: by IPNI id {int((hit.match == 'ipni').sum())}, name only {int((hit.match == 'name').sum())}")

    # a species is medicinal if any matched WCUPS row has ME
    med = hit[hit.medicinal].groupby("species_id").agg(match=("match", lambda s: "ipni" if (s == "ipni").any() else "name"),
                                                        wcups_ipni=("ipni_id", "first"))
    allmatched = hit.groupby("species_id").size()
    out = greek.set_index("plant_name_id").loc[med.index].join(med).reset_index()
    out["medicinal_source"] = "wcups"

    # curated species (featured_species.csv) count as medicinal even if WCUPS misses them
    feat = pd.read_csv(config.FEATURED_CSV, dtype=str)
    feat_names = set(feat.scientific_name.str.strip().str.lower())
    in_greek = greek[greek.taxon_name.str.lower().isin(feat_names)]
    not_greek = sorted(feat_names - set(greek.taxon_name.str.lower()))
    add = in_greek[~in_greek.plant_name_id.isin(out.plant_name_id)].assign(medicinal_source="curated", match="curated")
    out = pd.concat([out, add], ignore_index=True)
    print(f"featured species: {len(feat_names)}; Greek natives in WCVP: {len(in_greek)}; added as curated (WCUPS missed): {len(add)}; "
          f"featured names NOT a Greek native in WCVP (check spelling/synonym): {not_greek}")
    out.to_parquet(OUT)
    log = {"wcups_rows": len(rows), "wcups_with_ME": int(rows.medicinal.sum()), "greek_natives": len(greek),
           "greek_with_any_wcups_row": int(len(allmatched)), "greek_medicinal": len(out),
           "medicinal_by_ipni": int((out.match == "ipni").sum()), "medicinal_by_name_only": int((out.match == "name").sum()),
           "parse_issue_rows": len(issues), "curated_added": int(len(add)), "medicinal_final": len(out)}
    (config.WORK_DIR / "log_wcups.json").write_text(json.dumps(log, indent=2))
    print(json.dumps(log, indent=2))
    return out


if __name__ == "__main__":
    run()
