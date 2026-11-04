"""Steps 3-4: GBIF backbone keys, IUCN, vernacular names, and the occurrence download.

    python -m chloris.gbif keys       # backbone match -> work/species_keys.parquet
    python -m chloris.gbif request    # request ONE occurrence download for the matched keys (records the key/DOI)
    python -m chloris.gbif iucn       # IUCN category + Greek/English names -> work/species_gbif.parquet
    python -m chloris.gbif poll       # check / fetch the download

Every response is cached in work/cache/ and calls are limited to ~5 per second.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import pandas as pd
import requests

from . import config

API = "https://api.gbif.org/v1"
KEYS = config.WORK_DIR / "species_keys.parquet"
GBIF_OUT = config.WORK_DIR / "species_gbif.parquet"
DL_INFO = config.WORK_DIR / "gbif_download.json"

_lock = threading.Lock()
_last = [0.0]


def _throttle(min_gap: float = 0.2) -> None:
    with _lock:
        wait = _last[0] + min_gap - time.time()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.time()


def cached_get(url: str, params: dict | None = None) -> tuple[int, object]:
    """GET with an on-disk cache. Returns (status, json or None)."""
    config.ensure_dirs()
    key = hashlib.sha1((url + json.dumps(params or {}, sort_keys=True)).encode()).hexdigest()
    f = config.CACHE_DIR / f"{key}.json"
    if f.exists():
        d = json.loads(f.read_text())
        return d["status"], d["body"]
    for attempt in range(4):
        _throttle()
        try:
            r = requests.get(url, params=params, timeout=30)
        except requests.RequestException:
            time.sleep(2 ** attempt)
            continue
        if r.status_code in (429, 500, 502, 503):
            time.sleep(2 ** attempt)
            continue
        body = r.json() if r.status_code == 200 and r.text.strip() else None
        f.write_text(json.dumps({"status": r.status_code, "body": body}))
        return r.status_code, body
    raise RuntimeError(f"GBIF request failed repeatedly: {url}")


def _species() -> pd.DataFrame:
    return pd.read_parquet(config.WORK_DIR / "medicinal_species.parquet")


def match_keys() -> pd.DataFrame:
    sp = _species()

    def one(name: str) -> dict:
        _, r = cached_get(f"{API}/species/match", {"name": name, "kingdom": "Plantae", "rank": "species"})
        r = r or {}
        return {"match_type": r.get("matchType"), "confidence": r.get("confidence"), "rank": r.get("rank"),
                "status": r.get("status"), "gbif_name": r.get("scientificName"),
                "usage_key": r.get("usageKey"), "species_key": r.get("speciesKey")}

    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(one, sp.taxon_name))
    df = pd.concat([sp[["plant_name_id", "taxon_name"]].reset_index(drop=True), pd.DataFrame(res)], axis=1)
    # accept EXACT, or FUZZY with high confidence, at species rank
    ok = (df["rank"] == "SPECIES") & ((df.match_type == "EXACT") | ((df.match_type == "FUZZY") & (df.confidence >= 95)))
    df["accepted_key"] = df.species_key.where(ok)
    df.to_parquet(KEYS)
    print(f"species: {len(df)}; matched EXACT: {int((df.match_type == 'EXACT').sum())}; FUZZY: {int((df.match_type == 'FUZZY').sum())}; "
          f"HIGHERRANK/NONE: {int(df.match_type.isin(['HIGHERRANK', 'NONE']).sum())}; usable keys: {int(ok.sum())}; "
          f"synonym-status matches: {int((df.status == 'SYNONYM').sum())}; distinct keys: {df.accepted_key.nunique()}")
    df[~ok].to_csv(config.WORK_DIR / "gbif_unmatched.csv", index=False)
    return df


def request_download() -> str:
    config.load_env()
    user, pwd, email = os.environ["GBIF_USER"], os.environ["GBIF_PWD"], os.environ["GBIF_EMAIL"]
    if DL_INFO.exists():
        raise SystemExit(f"A download was already requested ({DL_INFO}); not requesting another one.")
    keys = sorted({int(k) for k in pd.read_parquet(KEYS).accepted_key.dropna()})
    body = {
        "creator": user, "notificationAddresses": [email], "sendNotification": True, "format": "SIMPLE_CSV",
        "predicate": {"type": "and", "predicates": [
            {"type": "equals", "key": "COUNTRY", "value": "GR"},
            {"type": "in", "key": "TAXON_KEY", "values": [str(k) for k in keys]},
            {"type": "equals", "key": "HAS_COORDINATE", "value": "true"},
            {"type": "equals", "key": "HAS_GEOSPATIAL_ISSUE", "value": "false"},
            {"type": "equals", "key": "OCCURRENCE_STATUS", "value": "PRESENT"},
        ]},
    }
    r = requests.post(f"{API}/occurrence/download/request", json=body, auth=(user, pwd), timeout=60)
    if r.status_code >= 300:
        raise SystemExit(f"GBIF download request failed: {r.status_code} {r.text[:300]}")
    dkey = r.text.strip().strip('"')
    DL_INFO.write_text(json.dumps({"download_key": dkey, "requested": time.strftime("%Y-%m-%d %H:%M:%S"), "n_taxon_keys": len(keys)}, indent=2))
    print(f"download requested: {dkey} for {len(keys)} taxon keys")
    return dkey


def poll() -> dict:
    info = json.loads(DL_INFO.read_text())
    r = requests.get(f"{API}/occurrence/download/{info['download_key']}", timeout=30).json()
    print({k: r.get(k) for k in ["key", "status", "doi", "totalRecords", "size", "downloadLink"]})
    if r.get("doi"):
        info.update(doi=r["doi"], status=r["status"], total_records=r.get("totalRecords"))
        DL_INFO.write_text(json.dumps(info, indent=2))
    return r


def iucn_and_names() -> pd.DataFrame:
    keys = pd.read_parquet(KEYS)
    keys = keys[keys.accepted_key.notna()]

    def one(k: float) -> dict:
        k = int(k)
        st, iu = cached_get(f"{API}/species/{k}/iucnRedListCategory")
        code = iu.get("code") if isinstance(iu, dict) else None  # 204/empty = not assessed
        _, vn = cached_get(f"{API}/species/{k}/vernacularNames", {"limit": 200})
        res = (vn or {}).get("results", []) if isinstance(vn, dict) else []

        def pick(langs: set[str]) -> str | None:
            names = [x["vernacularName"] for x in res if x.get("language") in langs and x.get("vernacularName")]
            return names[0] if names else None

        return {"accepted_key": k, "iucn": code or "NE", "name_el_gbif": pick({"ell", "gre", "el"}), "name_en_gbif": pick({"eng", "en"})}

    with ThreadPoolExecutor(4) as ex:
        res = list(ex.map(one, keys.accepted_key))
    # two species can share one GBIF key; look the key up once, then join (one row per species)
    df = keys.reset_index(drop=True).merge(pd.DataFrame(res).drop_duplicates("accepted_key"), on="accepted_key")
    df.to_parquet(GBIF_OUT)
    print("IUCN counts:\n", df.iucn.value_counts().to_string(), f"\nGreek name: {int(df.name_el_gbif.notna().sum())}; English name: {int(df.name_en_gbif.notna().sum())}")
    return df



OCC = config.WORK_DIR / "occurrences.parquet"
EFFORT = config.WORK_DIR / "effort.json"


def fetch_zip() -> "Path":
    """Download the finished GBIF zip into raw/gbif/ (git-ignored) and unzip it into work/ (git-ignored)."""
    import zipfile
    from pathlib import Path

    info = json.loads(DL_INFO.read_text())
    dest = config.RAW_DIR / "gbif" / f"{info['download_key']}.zip"
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        r = requests.get(f"{API}/occurrence/download/request/{info['download_key']}.zip", stream=True, timeout=120)
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(1 << 20):
                f.write(chunk)
    out = config.WORK_DIR / "gbif_csv"
    if not list(out.glob("*.csv")):
        zipfile.ZipFile(dest).extractall(out)
    return next(out.glob("*.csv"))


def clean_occurrences() -> pd.DataFrame:
    """Step 4: clean the download and map records to Chloris species. Logs every drop."""
    csv = fetch_zip()
    cols = ["gbifID", "speciesKey", "decimalLatitude", "decimalLongitude", "coordinateUncertaintyInMeters",
            "year", "eventDate", "basisOfRecord", "datasetKey"]
    df = pd.read_csv(csv, sep="\t", usecols=cols, dtype={"gbifID": "int64"}, low_memory=False, quoting=3)
    log = {"rows_in": len(df)}
    bb = config.GREECE_BBOX

    def drop(mask: pd.Series, why: str) -> None:
        nonlocal df
        log[why] = int(mask.sum())
        df = df[~mask]

    drop(df.coordinateUncertaintyInMeters > 10000, "dropped_uncertainty_gt_10km")
    drop(df.basisOfRecord == "FOSSIL_SPECIMEN", "dropped_fossil")
    drop(~df.decimalLatitude.between(bb["lat_min"], bb["lat_max"]) | ~df.decimalLongitude.between(bb["lon_min"], bb["lon_max"]), "dropped_outside_bbox")
    # exact duplicates: same species, coordinates and date
    drop(df.duplicated(["speciesKey", "decimalLatitude", "decimalLongitude", "eventDate"]), "dropped_duplicates")
    log["records_without_year_kept_for_maps"] = int(df.year.isna().sum())

    # map speciesKey -> Chloris species; shared keys go only to the species that GBIF accepts (flags.records_attributed)
    keys = pd.read_parquet(config.WORK_DIR / "species_keys.parquet")[["plant_name_id", "accepted_key"]].dropna()
    fl = pd.read_parquet(config.WORK_DIR / "species_flags.parquet")[["plant_name_id", "records_attributed"]]
    keys = keys.merge(fl, on="plant_name_id")
    keys = keys[keys.records_attributed][["plant_name_id", "accepted_key"]]
    keys["accepted_key"] = keys.accepted_key.astype("int64")
    df = df.dropna(subset=["speciesKey"]).astype({"speciesKey": "int64"})
    df = df.merge(keys, left_on="speciesKey", right_on="accepted_key", how="inner")
    log["rows_out"] = len(df)
    log["species_with_records"] = int(df.plant_name_id.nunique())
    df = df.drop(columns=["accepted_key", "eventDate", "basisOfRecord", "datasetKey", "coordinateUncertaintyInMeters"])
    df.to_parquet(OCC)
    print(json.dumps(log, indent=2))
    (config.WORK_DIR / "log_occurrences.json").write_text(json.dumps(log, indent=2))
    return df


def effort_totals() -> dict:
    """Total GBIF plant records in Greece per period (denominator for the sampling-effort-corrected decline)."""
    sc = config.load_scoring()
    out = {}
    for name in ("old", "new"):
        start, end = sc["periods"][name]
        yr = f"{start},{end}" if end else f"{start},{time.gmtime().tm_year}"
        _, r = cached_get(f"{API}/occurrence/search", {"country": "GR", "kingdomKey": 6, "year": yr, "hasCoordinate": "true", "limit": 0})
        out[f"N_{name}"] = r["count"]
        out[f"years_{name}"] = yr
    EFFORT.write_text(json.dumps(out, indent=2))
    print(out)
    return out


def run() -> None:
    match_keys()
    iucn_and_names()


if __name__ == "__main__":
    {"keys": match_keys, "request": request_download, "poll": poll, "iucn": iucn_and_names, "clean": clean_occurrences, "effort": effort_totals}[sys.argv[1]]()
