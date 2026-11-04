"""Step 6: Natura 2000 join -> work/species_protected.parquet, work/cell_protected.parquet, work/natura_simplified.geojson

Needs the EEA Natura 2000 spatial data in raw/natura2000/ (GeoPackage, Shapefile or GeoJSON). Column names are
printed and detected, never assumed silently. If the data is missing the step stops with instructions.
"""
from __future__ import annotations

import json

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.geometry import box

from . import config
from .cells import cell_ids

RAW = config.RAW_DIR / "natura2000"
COUNTRY_COLS = ["MS", "COUNTRY_CODE", "COUNTRY", "country", "ms"]
COUNTRY_VALUES = {"GR", "EL", "GRC"}


def _find(cols: list[str], options: list[str]) -> str | None:
    lower = {c.lower(): c for c in cols}
    return next((lower[o.lower()] for o in options if o.lower() in lower), None)


def load_natura(path=RAW) -> gpd.GeoDataFrame:
    files = [f for ext in ("*.gpkg", "*.shp", "*.geojson") for f in sorted(path.rglob(ext))]
    if not files:
        raise SystemExit(f"No Natura 2000 data in {path}. Download the EEA 'Natura 2000 spatial data' "
                         "(GeoPackage or Shapefile) into pipeline/raw/natura2000/ and rerun.")
    f = files[0]
    kwargs = {}
    if f.suffix == ".gpkg":
        import pyogrio

        layers = [n for n, _ in pyogrio.list_layers(f)]
        poly = [n for n in layers if "polygon" in n.lower()] or layers[:1]
        print(f"{f.name}: layers {layers}; using '{poly[0]}'")
        kwargs = {"layer": poly[0]}
        fields = list(pyogrio.read_info(f, layer=poly[0])["fields"])
        ms_col = _find(fields, COUNTRY_COLS)
        if ms_col:  # filter inside the query: the file covers all of Europe (1+ GB)
            kwargs["where"] = f"{ms_col} IN ('GR','EL')"
    gdf = gpd.read_file(f, **kwargs)
    print(f"Natura file: {f.name}; rows {len(gdf):,}; CRS {gdf.crs}; columns {list(gdf.columns)}")
    ms = _find(list(gdf.columns), COUNTRY_COLS)
    if ms:
        gdf = gdf[gdf[ms].astype(str).str.upper().isin(COUNTRY_VALUES)]
        print(f"Greek sites via column '{ms}': {len(gdf):,}")
    else:
        code = _find(list(gdf.columns), ["SITECODE", "site_code"])
        if not code:
            raise SystemExit("Cannot find a country or SITECODE column; inspect the file and adjust protected.py")
        gdf = gdf[gdf[code].astype(str).str.upper().str.startswith("GR")]
        print(f"No country column; filtered by SITECODE prefix 'GR': {len(gdf):,}")
    if gdf.empty:
        raise SystemExit("No Greek Natura 2000 sites found after filtering.")
    return gdf.to_crs(4326)


def run() -> None:
    config.ensure_dirs()
    sc = config.load_scoring()
    size = sc["cell_size_deg"]
    nat = load_natura()
    code, name, typ = (_find(list(nat.columns), [c]) for c in ("SITECODE", "SITENAME", "SITETYPE"))
    nat = nat[nat.geometry.notna() & ~nat.geometry.is_empty].copy()
    nat["geometry"] = nat.geometry.make_valid()

    # --- per record: inside any site? ---
    occ = pd.read_parquet(config.WORK_DIR / "occurrences.parquet")
    pts = gpd.GeoDataFrame(occ[["plant_name_id"]], geometry=gpd.points_from_xy(occ.decimalLongitude, occ.decimalLatitude), crs=4326)
    inside = gpd.sjoin(pts, nat[["geometry"]], predicate="within", how="left")
    inside = inside[~inside.index.duplicated()]
    occ["inside"] = inside.index_right.notna().reindex(occ.index).fillna(False).to_numpy()
    sp = occ.groupby("plant_name_id").inside.mean().rename("protected_share").reset_index()
    sp.to_parquet(config.WORK_DIR / "species_protected.parquet")

    # --- per occupied cell: fraction of area inside Natura 2000 (equal-area CRS EPSG:2100) ---
    cells = pd.read_parquet(config.WORK_DIR / "cells.parquet")
    ij = cells.cell.str.split("_", expand=True).astype(int)
    boxes = [box(j * size, i * size, (j + 1) * size, (i + 1) * size) for i, j in zip(ij[0], ij[1])]
    cg = gpd.GeoDataFrame(cells[["cell"]], geometry=boxes, crs=4326).to_crs(2100)
    union = nat.to_crs(2100).geometry.union_all()
    cg["protected_fraction"] = [min(g.intersection(union).area / g.area, 1.0) for g in cg.geometry]
    cg[["cell", "protected_fraction"]].to_parquet(config.WORK_DIR / "cell_protected.parquet")

    # --- simplified polygons for the map ---
    simp = nat[[c for c in (code, name, typ) if c] + ["geometry"]].copy()
    simp.columns = [{code: "code", name: "name", typ: "type"}.get(c, c) for c in simp.columns]
    simp["geometry"] = simp.geometry.simplify(0.001, preserve_topology=True)
    simp.to_file(config.WORK_DIR / "natura_simplified.geojson", driver="GeoJSON", COORDINATE_PRECISION=4)

    log = {"greek_sites": len(nat), "records_inside_share": float(occ.inside.mean()),
           "species_fully_unprotected": int((sp.protected_share == 0).sum()),
           "cells_over_half_protected": int((cg.protected_fraction >= 0.5).sum()),
           "natura_geojson_mb": round((config.WORK_DIR / "natura_simplified.geojson").stat().st_size / 1e6, 2)}
    (config.WORK_DIR / "log_protected.json").write_text(json.dumps(log, indent=2))
    print(json.dumps(log, indent=2))


if __name__ == "__main__":
    run()
