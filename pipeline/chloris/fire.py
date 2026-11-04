"""Step 7 (P1): burnt-area exposure. Skips cleanly when there is no data in raw/fire/ (fire_share = null, weight rescaled)."""
from __future__ import annotations

from . import config


def run() -> None:
    raw = config.RAW_DIR / "fire"
    files = [f for f in raw.rglob("*") if f.suffix.lower() in {".gpkg", ".shp", ".geojson"}] if raw.exists() else []
    if not files:
        print("fire: no data in raw/fire/ -> step skipped. fire_share stays null and its weight is rescaled (noted in meta.json).")
        return
    raise NotImplementedError(
        f"Found {[f.name for f in files]}. Inspect the columns (burn year, geometry) and implement the join in fire.py; "
        "the source format is not known yet and is not guessed.")


if __name__ == "__main__":
    run()
