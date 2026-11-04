"""Step 1: native Greek species from WCVP -> work/greek_species.parquet"""
from __future__ import annotations

import json

import pandas as pd

from . import config

NAMES = config.RAW_DIR / "wcvp" / "wcvp_names.csv"
DIST = config.RAW_DIR / "wcvp" / "wcvp_distribution.csv"
OUT = config.WORK_DIR / "greek_species.parquet"


def run() -> pd.DataFrame:
    config.ensure_dirs()
    names = pd.read_csv(NAMES, sep="|", dtype=str, low_memory=False,
                        usecols=["plant_name_id", "ipni_id", "taxon_rank", "taxon_status", "family", "genus",
                                 "taxon_name", "taxon_authors", "accepted_plant_name_id", "parent_plant_name_id", "powo_id"])
    dist = pd.read_csv(DIST, sep="|", dtype=str, keep_default_na=False, usecols=["plant_name_id", "area_code_l3", "introduced", "extinct", "location_doubtful"])
    print(f"names: {len(names):,} rows; distribution: {len(dist):,} rows")
    print("columns:", list(names.columns), list(dist.columns))

    accepted = names[names.taxon_status == "Accepted"]
    species = accepted[accepted.taxon_rank == "Species"].set_index("plant_name_id")
    infra = accepted[accepted.taxon_rank.isin(["Subspecies", "Variety", "Form"])]
    # map accepted infraspecific taxa to their parent species
    infra_parent = infra.set_index("plant_name_id")["parent_plant_name_id"]
    infra_parent = infra_parent[infra_parent.isin(species.index)]
    print(f"accepted species: {len(species):,}; accepted infraspecific mapped to a species: {len(infra_parent):,}")

    # native, non-extinct, non-doubtful records only
    native = dist[(dist.introduced == "0") & (dist.extinct == "0") & (dist.location_doubtful == "0")].copy()
    native["species_id"] = native.plant_name_id.map(lambda i: i if i in species.index else infra_parent.get(i))
    native = native.dropna(subset=["species_id"])
    areas = native.groupby("species_id")["area_code_l3"].agg(lambda s: sorted(set(s)))
    greek = areas[areas.map(lambda a: any(x in config.GREEK_AREAS for x in a))]
    endemic = greek.map(lambda a: all(x in config.GREEK_AREAS for x in a))
    print(f"Greek native species: {len(greek):,}; endemic to Greece: {int(endemic.sum()):,}")

    # synonyms: names pointing to the species or to its infraspecific taxa
    members = pd.concat([pd.Series(greek.index, index=greek.index), infra_parent[infra_parent.isin(greek.index)]])
    # WCVP statuses seen: Synonym, Orthographic, Illegitimate, Invalid, Misapplied...; misapplied names are excluded
    syn = names[names.taxon_status.isin(["Synonym", "Orthographic", "Illegitimate", "Invalid"]) | (names.taxon_status == "Accepted")]
    syn = syn[syn.accepted_plant_name_id.isin(members.index)]
    syn = syn.assign(species_id=syn.accepted_plant_name_id.map(members))
    syn = syn[syn.taxon_name != syn.species_id.map(species["taxon_name"])]
    synonyms = syn.groupby("species_id")["taxon_name"].agg(lambda s: sorted(set(s)))

    out = species.loc[greek.index, ["ipni_id", "powo_id", "taxon_name", "taxon_authors", "family", "genus"]].copy()
    out["greek_areas"] = [[a for a in areas[i] if a in config.GREEK_AREAS] for i in out.index]
    out["endemic_gr"] = endemic
    out["synonyms"] = [synonyms.get(i, []) for i in out.index]
    out = out.reset_index()
    out.to_parquet(OUT)
    log = {"greek_native_species": len(out), "endemic_gr": int(out.endemic_gr.sum()),
           "wcvp_names_rows": len(names), "wcvp_download_date": "2026-11-04"}
    (config.WORK_DIR / "log_wcvp.json").write_text(json.dumps(log, indent=2))
    print(out.head(5).to_string())
    return out


if __name__ == "__main__":
    run()
