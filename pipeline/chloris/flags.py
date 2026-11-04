"""Data-quality and review flags per species -> work/species_flags.parquet (+ .csv for the science lead).

data_quality  (automatic, about the data link between WCVP and GBIF):
  gbif_synonym_match  GBIF treats the matched name as a synonym of another species, so occurrence records
                      belong to GBIF's accepted species and may not equal Kew's taxon concept.
  gbif_shared_key     two Chloris species resolve to the same GBIF species key. The records are attributed to
                      the species GBIF accepts; the other one gets no records (see `records_attributed`).
  gbif_no_match       no usable GBIF backbone key; the species has no occurrence data.
review  (for the science lead; nothing is changed automatically):
  name_only_match     the WCUPS medicinal flag was linked to WCVP by name, not by IPNI id.
  native_status_check from config/review_overrides.csv (e.g. Crocus sativus).
"""
from __future__ import annotations

import pandas as pd

from . import config

OUT = config.WORK_DIR / "species_flags.parquet"
OVERRIDES = config.CONFIG_DIR / "review_overrides.csv"

LEGEND = {
    "gbif_synonym_match": "GBIF treats the matched name as a synonym; records follow GBIF's accepted species.",
    "gbif_shared_key": "Shares its GBIF species key with another Chloris species; records go to the GBIF-accepted one.",
    "gbif_no_match": "No usable GBIF match; no occurrence data.",
    "name_only_match": "Medicinal flag matched to WCVP by name, not IPNI id; awaiting science-lead review.",
    "native_status_check": "Native status or inclusion needs a science-lead decision (see reason).",
}


def run() -> pd.DataFrame:
    med = pd.read_parquet(config.WORK_DIR / "medicinal_species.parquet")[["plant_name_id", "taxon_name", "match", "medicinal_source"]]
    keys = pd.read_parquet(config.WORK_DIR / "species_keys.parquet")[["plant_name_id", "status", "accepted_key", "match_type"]]
    df = med.merge(keys, on="plant_name_id", how="left")
    ov = pd.read_csv(OVERRIDES, dtype=str) if OVERRIDES.exists() else pd.DataFrame(columns=["scientific_name", "flag", "reason"])
    ov_map = ov.groupby(ov.scientific_name.str.lower()).apply(lambda g: list(zip(g.flag, g.reason)), include_groups=False).to_dict()

    shared = df.accepted_key.notna() & df.accepted_key.duplicated(keep=False)
    dq, rv, notes, attributed = [], [], [], []
    for r, sh in zip(df.itertuples(), shared):
        d, v, n = [], [], []
        if pd.isna(r.accepted_key):
            d.append("gbif_no_match")
        if r.status == "SYNONYM" and pd.notna(r.accepted_key):
            d.append("gbif_synonym_match")
        if sh:
            d.append("gbif_shared_key")
        if r.match == "name":
            v.append("name_only_match")
        for flag, reason in ov_map.get(r.taxon_name.lower(), []):
            v.append(flag)
            n.append(reason)
        dq.append(d); rv.append(v); notes.append(" ".join(n) or None)
        # shared key: only the GBIF-accepted species receives the records
        attributed.append(pd.notna(r.accepted_key) and (not sh or r.status == "ACCEPTED"))
    df["data_quality"], df["review"], df["review_note"], df["records_attributed"] = dq, rv, notes, attributed
    out = df[["plant_name_id", "taxon_name", "accepted_key", "data_quality", "review", "review_note", "records_attributed"]]
    out.to_parquet(OUT)
    flat = out.assign(data_quality=out.data_quality.map(";".join), review=out.review.map(";".join))
    flat[(flat.data_quality != "") | (flat.review != "")].to_csv(config.WORK_DIR / "species_flags.csv", index=False)
    print("data_quality:", pd.Series([x for l in dq for x in l]).value_counts().to_dict())
    print("review:", pd.Series([x for l in rv for x in l]).value_counts().to_dict())
    print("records not attributed (shared key, GBIF-synonym twin):", int((~out.records_attributed & out.accepted_key.notna()).sum()))
    return out


if __name__ == "__main__":
    run()
