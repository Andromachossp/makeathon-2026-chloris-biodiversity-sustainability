"""Step 5: 0.1 degree grid cells (~10 km) -> work/species_cells.parquet, work/cells.parquet, work/species_stats.parquet"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from . import config


def cell_ids(lat: pd.Series, lon: pd.Series, size: float) -> pd.Series:
    """'382_237' = lat 38.2-38.3, lon 23.7-23.8. Rounding first avoids float errors such as 0.3/0.1 = 2.9999999999999996."""
    i = np.floor(np.round(lat / size, 6)).astype(int)
    j = np.floor(np.round(lon / size, 6)).astype(int)
    return i.astype(str) + "_" + j.astype(str)


def run() -> None:
    sc = config.load_scoring()
    size = sc["cell_size_deg"]
    old_from, old_to = sc["periods"]["old"]
    new_from, new_to = sc["periods"]["new"]
    occ = pd.read_parquet(config.WORK_DIR / "occurrences.parquet")
    occ["cell"] = cell_ids(occ.decimalLatitude, occ.decimalLongitude, size)
    y = occ.year
    occ["old"] = y.between(old_from, old_to)
    occ["new"] = (y >= new_from) & (y <= new_to if new_to else True)

    sc_tab = occ.groupby(["plant_name_id", "cell"]).agg(
        n=("gbifID", "size"), first_year=("year", "min"), last_year=("year", "max"),
        n_old=("old", "sum"), n_new=("new", "sum")).reset_index()
    sc_tab.to_parquet(config.WORK_DIR / "species_cells.parquet")

    stats = sc_tab.groupby("plant_name_id").agg(
        n_records=("n", "sum"), n_cells=("cell", "nunique"), n_old=("n_old", "sum"), n_new=("n_new", "sum"),
        first_year=("first_year", "min"), last_year=("last_year", "max")).reset_index()
    stats.to_parquet(config.WORK_DIR / "species_stats.parquet")

    cells = sc_tab.groupby("cell").agg(n_species=("plant_name_id", "nunique"), n_records=("n", "sum")).reset_index()
    cells.to_parquet(config.WORK_DIR / "cells.parquet")

    log = {"cell_size_deg": size, "occupied_cells": len(cells), "species_with_records": len(stats),
           "median_cells_per_species": float(stats.n_cells.median()), "species_with_1_cell": int((stats.n_cells == 1).sum()),
           "max_species_in_a_cell": int(cells.n_species.max()), "records_with_year": int(occ.year.notna().sum())}
    (config.WORK_DIR / "log_cells.json").write_text(json.dumps(log, indent=2))
    print(json.dumps(log, indent=2))


if __name__ == "__main__":
    run()
