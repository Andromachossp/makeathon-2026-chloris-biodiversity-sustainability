"""Step 8: transparent risk score -> work/scores.parquet

All weights and thresholds come from config/scoring.yaml (the science lead's file). Each component is a fraction
0-1 times its weight. A component with no data is null, is excluded, and the remaining weights are rescaled to 100;
the missing ones are recorded per species. Nothing here changes weights.
"""
from __future__ import annotations

import json
import math

import pandas as pd

from . import config

OUT = config.WORK_DIR / "scores.parquet"
PROTECTED = config.WORK_DIR / "species_protected.parquet"   # from protected.py (optional until Natura 2000 is in raw/)
FIRE = config.WORK_DIR / "species_fire.parquet"             # from fire.py (optional, P1)


def decline_fraction(n_old: int, n_new: int, n_old_total: int, n_new_total: int, sc: config.Scoring) -> float | None:
    if n_old < sc["min_old_records"]:
        return None
    r = (n_new / n_new_total) / (n_old / n_old_total)
    if r >= 1:
        return 0.0
    if r <= sc["decline_full_at"]:
        return 1.0
    return math.log(r) / math.log(sc["decline_full_at"])


def level(score: float, sc: config.Scoring) -> str:
    lv = sc["levels"]
    return "critical" if score >= lv["critical"] else "high" if score >= lv["high"] else "moderate" if score >= lv["moderate"] else "low"


def run() -> pd.DataFrame:
    sc = config.load_scoring()
    w = sc.weights
    med = pd.read_parquet(config.WORK_DIR / "medicinal_species.parquet")[["plant_name_id", "taxon_name", "endemic_gr"]]
    g = pd.read_parquet(config.WORK_DIR / "species_gbif.parquet")[["plant_name_id", "iucn"]]
    st = pd.read_parquet(config.WORK_DIR / "species_stats.parquet")
    eff = json.loads((config.WORK_DIR / "effort.json").read_text())
    df = med.merge(g, on="plant_name_id", how="left").merge(st, on="plant_name_id", how="left")
    df["iucn"] = df.iucn.fillna("NE")   # no GBIF key / no assessment = not assessed
    for tab, col in ((PROTECTED, "protected_share"), (FIRE, "fire_share")):
        df = df.merge(pd.read_parquet(tab)[["plant_name_id", col]], on="plant_name_id", how="left") if tab.exists() else df.assign(**{col: None})
    missing_sources = [n for n, p in (("protected", PROTECTED), ("fire", FIRE)) if not p.exists()]

    rows = []
    for r in df.itertuples():
        has_rec = pd.notna(r.n_cells) and r.n_cells > 0
        frac = {
            "iucn": sc["iucn_fraction"][r.iucn],
            "endemic": 1.0 if r.endemic_gr else 0.0,
            "rarity": (1 - min(math.log(r.n_cells) / math.log(sc["rarity_cells_cap"]), 1)) if has_rec else None,
            "decline": decline_fraction(int(r.n_old), int(r.n_new), eff["N_old"], eff["N_new"], sc) if has_rec else None,
            "unprotected": (1 - r.protected_share) if has_rec and pd.notna(r.protected_share) else None,
            "fire": r.fire_share if has_rec and pd.notna(r.fire_share) else None,
        }
        avail = {k: v for k, v in frac.items() if v is not None}
        wsum = sum(w[k] for k in avail)
        score = sum(v * w[k] for k, v in avail.items()) / wsum * 100
        parts = {k: (round(v * w[k] / wsum * 100, 1) if v is not None else None) for k, v in frac.items()}
        rows.append({"plant_name_id": r.plant_name_id, "taxon_name": r.taxon_name, "iucn": r.iucn, "score": int(round(score)),
                     "level": level(score, sc), "parts": parts, "missing": [k for k, v in frac.items() if v is None],
                     "weight_available": wsum,
                     "at_risk_rule": r.iucn in sc["at_risk"]["iucn"] or score >= sc["at_risk"]["score_threshold"]})
    out = pd.DataFrame(rows)
    out.to_parquet(OUT)

    log = {"scoring_version": sc.version, "sources_missing_at_scoring_time": missing_sources,
           "level_counts": out.level.value_counts().to_dict(), "at_risk_by_rule": int(out.at_risk_rule.sum()),
           "species_missing_component": pd.Series([m for l in out.missing for m in l]).value_counts().to_dict()}
    (config.WORK_DIR / "log_score.json").write_text(json.dumps(log, indent=2))
    print(json.dumps(log, indent=2))
    return out


if __name__ == "__main__":
    run()
