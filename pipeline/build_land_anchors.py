"""Place public 0.1-degree cell symbols on land without using observation coordinates.

Run from the repo root with the pipeline virtualenv:
  pipeline/.venv/bin/python pipeline/build_land_anchors.py

The pinned geoBoundaries Greece ADM0 boundary is CC BY 4.0. Its SHA-256 is checked
before use. The output contains only one representative land point per occupied
public cell, derived from the boundary, never from a species record.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

from shapely.geometry import box, shape
from shapely.ops import polylabel


ROOT = Path(__file__).resolve().parents[1]
BOUNDARY_URL = (
    "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/"
    "releaseData/gbOpen/GRC/ADM0/geoBoundaries-GRC-ADM0.geojson"
)
BOUNDARY_SHA256 = "b365300a1ee06f0e13230a48c2cd3d95ec384f4521f427a23d72c046a852cadf"


def land_point(land, cell):
    cut = land.intersection(cell)
    if cut.is_empty:
        return None
    if land.covers(cell.centroid):
        return [round(cell.centroid.x, 6), round(cell.centroid.y, 6)]
    polygons = [p for p in getattr(cut, "geoms", [cut]) if p.geom_type == "Polygon" and p.area > 0]
    if not polygons:
        return None
    # Where the original cell centre is at sea, use the largest mapped land
    # piece. polylabel keeps the flower base away from the coast where possible.
    point = polylabel(max(polygons, key=lambda p: p.area), tolerance=0.0001)
    return [round(point.x, 6), round(point.y, 6)]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--boundary", type=Path, help="Cached copy of the pinned geoBoundaries GeoJSON")
    args = parser.parse_args()
    content = args.boundary.read_bytes() if args.boundary else urlopen(BOUNDARY_URL, timeout=30).read()
    digest = hashlib.sha256(content).hexdigest()
    if digest != BOUNDARY_SHA256:
        raise ValueError(f"Boundary checksum mismatch: {digest}")

    boundary = json.loads(content)
    land = shape(boundary["features"][0]["geometry"])
    data = ROOT / "web" / "public" / "data"
    cells = json.loads((data / "cells.json").read_text())
    size = cells["size"]
    anchors = {}
    for entry in cells["cells"]:
        i, j = map(int, entry["id"].split("_"))
        cell = box(j * size, i * size, (j + 1) * size, (i + 1) * size)
        point = land_point(land, cell)
        if point is not None:
            anchors[entry["id"]] = point

    dest = data / "land-anchors.json"
    dest.write_text(json.dumps(anchors, separators=(",", ":")) + "\n")
    print(f"Wrote {len(anchors)} land anchors for {len(cells['cells'])} occupied cells to {dest}")


if __name__ == "__main__":
    main()
