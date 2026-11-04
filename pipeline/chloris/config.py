"""Paths and configuration. Weights and thresholds live in config/scoring.yaml (science lead's file)."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import yaml
from dotenv import load_dotenv

PIPELINE_DIR = Path(__file__).resolve().parent.parent
REPO_DIR = PIPELINE_DIR.parent
CONFIG_DIR = PIPELINE_DIR / "config"
RAW_DIR = PIPELINE_DIR / "raw"
WORK_DIR = PIPELINE_DIR / "work"
CACHE_DIR = WORK_DIR / "cache"
EXPORT_DIR = REPO_DIR / "web" / "public" / "data"

SCORING_YAML = CONFIG_DIR / "scoring.yaml"
FEATURED_CSV = CONFIG_DIR / "featured_species.csv"

# Greece bounding box used to clean occurrences and validate sightings.
GREECE_BBOX = {"lat_min": 34.5, "lat_max": 42.0, "lon_min": 19.0, "lon_max": 30.0}
# WGSRPD level-3 areas counted as Greece.
GREEK_AREAS = ("GRC", "KRI", "EAI")


@dataclass(frozen=True)
class Scoring:
    raw: dict

    @property
    def version(self) -> str:
        return self.raw["version"]

    @property
    def weights(self) -> dict:
        return self.raw["weights"]

    def __getitem__(self, key: str):
        return self.raw[key]


def load_scoring(path: Path = SCORING_YAML) -> Scoring:
    with open(path, encoding="utf-8") as f:
        raw = yaml.safe_load(f)
    total = sum(raw["weights"].values())
    if total != 100:
        raise ValueError(f"scoring.yaml weights must sum to 100, got {total}")
    return Scoring(raw)


def load_env() -> None:
    """Load GBIF credentials from pipeline/.env (never committed)."""
    load_dotenv(PIPELINE_DIR / ".env")


def ensure_dirs() -> None:
    for d in (RAW_DIR, WORK_DIR, CACHE_DIR, EXPORT_DIR):
        d.mkdir(parents=True, exist_ok=True)
