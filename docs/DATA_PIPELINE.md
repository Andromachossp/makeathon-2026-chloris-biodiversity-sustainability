# Data pipeline

Python 3.11+. Package in `pipeline/chloris/`, one module per step. Each step reads the previous step's output from `pipeline/work/` and writes its own, so any step can be rerun alone. `python -m chloris.run --step <name|all>` runs steps; `chloris_pipeline.ipynb` calls the same functions with visible outputs, tables and small maps (judges value this).

**Rules for every step**
- Never invent data. If a source can't be downloaded, stop and report what is missing and where to get it.
- Inspect a downloaded file's columns and delimiter before using it; print them. Don't assume column names from this doc; they are the expected ones, verify them.
- Log counts at every step (rows in, rows out, why rows were dropped) and write them to `work/log.json`, which feeds `meta.json` and the README.
- Cache network calls on disk (`work/cache/`) so reruns are fast and polite to APIs. Respect rate limits (≤ 5 requests/s to GBIF).

## Step 0 — Raw downloads (`raw/`)

| File | Where | How |
| --- | --- | --- |
| WCVP | `https://sftp.kew.org/pub/data-repositories/WCVP/wcvp.zip` (data behind POWO) | Scripted download. Contains `wcvp_names.csv` and `wcvp_distribution.csv`, usually pipe-separated (`|`); detect the delimiter. Record the version/date. |
| WCUPS | Knowledge Network for Biocomplexity (KNB): search "World Checklist of Useful Plant Species" (Diazgranados et al. 2020, CC BY 4.0) | **Manual** if the site blocks scripts: Andro downloads it into `raw/wcups/`. Inspect columns: expect a name, an IPNI ID (LSID) and one column or flag per use category including **Medicines**. |
| Natura 2000 | EEA "Natura 2000 – spatial data" (GeoPackage or Shapefile) | Manual or scripted into `raw/natura2000/`. Keep Greek sites (member-state field, often `MS` = `GR`; verify). |
| Burnt areas (P1) | EFFIS burnt-area polygons, or NASA FIRMS / Global Forest Watch for Greece | Manual into `raw/fire/`. Skip the fire step if not available by Thursday noon. |
| GBIF occurrences | GBIF download API (needs a free GBIF account) | Scripted in Step 4. Credentials in `pipeline/.env`: `GBIF_USER`, `GBIF_PWD`, `GBIF_EMAIL`. |

## Step 1 — Greek native species from WCVP (`wcvp.py` → `work/greek_species.parquet`)

1. Load names and distribution.
2. Keep accepted names (`taxon_status == "Accepted"`) at rank **Species**. Map accepted infraspecific taxa to their parent species (so *Origanum vulgare* subsp. *hirtum* counts as *Origanum vulgare*; keep the infraspecific names as synonyms for matching).
3. Greek areas = WGSRPD level-3 codes **GRC** (Greece), **KRI** (Crete), **EAI** (East Aegean Is.). Keep species with a **native** record (`introduced == 0`, `extinct == 0`, `location_doubtful == 0`) in any of them.
4. `endemic_gr = True` when all native, non-doubtful areas of the species are within {GRC, KRI, EAI}.
5. Collect synonyms: every name whose `accepted_plant_name_id` points to the species (or to its infraspecific taxa).
6. Keep: `plant_name_id`, `ipni_id`, `powo_id`, `taxon_name`, `taxon_authors`, `family`, `genus`, `endemic_gr`, `greek_areas`, `synonyms`.
7. Print: total Greek natives, endemics.

## Step 2 — Medicinal filter (`wcups.py` → `work/medicinal_species.parquet`)

1. Load WCUPS, keep rows flagged **Medicines**.
2. Join to Step 1 by IPNI ID first (strip the LSID prefix `urn:lsid:ipni.org:names:`), then by normalised name for the rest (lowercase, single spaces, authors removed), then by synonyms.
3. Also include every species in `config/featured_species.csv` even if WCUPS misses it (flag `medicinal_source = "curated"`).
4. Print: matched by ID / by name / by synonym / unmatched; final count.
5. **Fallback** if WCUPS can't be obtained: keep all Greek natives, set `medicinal_source = "curated"` only for the featured list, and show only featured species as "medicinal" in the app. Report this clearly.

## Step 3 — GBIF keys, IUCN and Greek names (`gbif.py` → `work/species_gbif.parquet`)

For each species:
1. Match name to the GBIF backbone (`pygbif.species.name_backbone(name, kingdom="Plantae", strict=True)` or the current GBIF species-match endpoint). Keep `usageKey` only for `EXACT` or high-confidence `FUZZY` matches at species rank; log the rest.
2. IUCN: `GET https://api.gbif.org/v1/species/{key}/iucnRedListCategory`. A 204 or empty body means not assessed → `NE`. Store the code (`CR`, `EN`, `VU`, `NT`, `LC`, `DD`, `NE`).
3. Greek vernacular names: `GET /v1/species/{key}/vernacularNames`, pick language `ell`/`gre`/`el`; English likewise. `featured_species.csv` overrides both.
4. Cache every response in `work/cache/`.

## Step 4 — GBIF occurrence download (`gbif.py` → `raw/gbif/<key>.zip` → `work/occurrences.parquet`)

1. Request **one** download with the GBIF download API (POST `https://api.gbif.org/v1/occurrence/download/request`, basic auth), format `SIMPLE_CSV`, predicate:
   - `country = GR`
   - `taxonKey in [all species keys]`
   - `hasCoordinate = true`, `hasGeospatialIssue = false`
   - `occurrenceStatus = PRESENT`
2. Poll until `SUCCEEDED`, download the zip, **record the DOI** (it goes in README and `meta.json`).
3. Clean: drop `coordinateUncertaintyInMeters > 10000`, drop missing `year` for decline (keep for maps), drop exact duplicates (same species, coordinates, date), drop `basisOfRecord == FOSSIL_SPECIMEN`, drop points outside Greece's bounding box (lat 34.5–42.0, lon 19.0–30.0).
4. Map each record's `taxonKey`/`speciesKey` back to the Chloris species.
5. Effort totals for the decline correction, one call per period: `GET /v1/occurrence/search?country=GR&kingdomKey=6&year=<from>,<to>&hasCoordinate=true&limit=0` → `count`. Store `N_old`, `N_new`.

## Step 5 — Grid cells (`cells.py` → `work/species_cells.parquet`, `work/cells.parquet`)

- Cell size from `scoring.yaml` (default 0.1°). Cell id: `f"{floor(lat/size)}_{floor(lon/size)}"`; the client rebuilds the square from the id.
- Per species × cell: `n`, `first_year`, `last_year`, `n_old`, `n_new`.
- Per species: `n_records`, `n_cells`, `n_old`, `n_new`.

## Step 6 — Protected areas (`protected.py`)

- Spatial join of cleaned **records** (not cells) with Greek Natura 2000 polygons (EPSG:4326, `predicate="within"`).
- Per species: `protected_share` = records inside / all records.
- Per cell: `protected_fraction` = area of cell covered by Natura 2000 (for the hotspot logic and map shading).
- Export simplified polygons: `natura.geojson`, topology-preserving simplification, aim for < 3 MB; keep `SITECODE`, `SITENAME`, `SITETYPE` (verify field names).

## Step 7 — Fire exposure (`fire.py`, P1)

- Burnt-area polygons for Greece, years per `scoring.yaml` (default last 10 years).
- Per species: `fire_share` = records inside burnt polygons.
- Export simplified `fires.geojson` (< 2 MB) with year.
- If skipped, `fire_share = null` and the weight is redistributed proportionally (log it).

## Step 8 — Risk score (`score.py`)

All numbers come from `config/scoring.yaml`. Each component is a fraction 0–1 times its weight; total 0–100.

- **IUCN:** `iucn_fraction[code]`.
- **Endemic:** 1 if `endemic_gr` else 0.
- **Rarity:** `1 - min(log(n_cells) / log(rarity_cells_cap), 1)`; 1 cell → 1.
- **Decline:** ratio `r = (n_new / N_new) / (n_old / N_old)`. If `n_old < min_old_records` → `null` (not enough data). Fraction: `r >= 1` → 0; `r <= decline_full_at` → 1; between → `log(r) / log(decline_full_at)`.
- **Unprotected:** `1 - protected_share`.
- **Fire:** `fire_share` (null if unavailable).
- Null components are excluded and the remaining weights are rescaled to 100; store which were missing.
- **At risk** = IUCN in `at_risk.iucn` OR `score >= at_risk.score_threshold` OR curated `harvest == "do-not-harvest"`.
- Level labels: Low < 25 ≤ Moderate < 45 ≤ High < 65 ≤ Critical (thresholds in YAML).
- Sanity checks printed in the notebook: score histogram, top 20 species, correlation between components, and a check that well-known threatened species (e.g. *Origanum dictamnus*) rank high. If they don't, say so; don't tweak weights silently. Weight changes are the science lead's call.

## Step 9 — Curation merge and export (`export.py` → `web/public/data/`)

1. Merge `featured_species.csv` (uses, EMA status/link, harvest, substitutes, names). Validate: unknown slugs in `substitutes`, invalid enums → error.
2. Slug: `genus-species` lowercase ASCII (`origanum-dictamnus`). Catalogue number: `CHL-0001`… ordered by family, then name.
3. Photos (P1, featured only): one CC0/CC BY image per species from GBIF occurrence media (`mediaType=StillImage`, licence filter); store URL, creator, licence, source link. Never use unlicensed images.
4. Write the files described in `docs/DATA_MODEL.md`. Round floats (scores to integers, shares to 2 decimals). Minify JSON.
5. Print file sizes; fail if `species.json` > 2 MB raw or any `occ/*.json` > 200 KB.
6. Write `meta.json` with source versions, GBIF DOI, download dates, counts, weights and missing-data notes.
