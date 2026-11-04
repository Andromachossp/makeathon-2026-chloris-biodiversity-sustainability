# Architecture

Chloris is two halves joined by static files:

```
 Open data ──► Python pipeline ──► web/public/data/*.json ──► Next.js PWA (Vercel) ──► phone
 (WCVP, WCUPS,   (pipeline/chloris)   (versioned, committed)     │            │
  GBIF, IUCN,                                                    │            ├─► /api/identify ──► Pl@ntNet API
  Natura, fire)                                                  │            └─► Firestore (user sightings, offline cache)
                                                                 └─► Service worker (Serwist): app shell + data + tiles cached
```

- The **pipeline** runs on a laptop, not on the server. It downloads open data, computes everything, and writes static JSON/GeoJSON into `web/public/data/`. Those files are committed, so the deployed app and its numbers are reproducible.
- The **web app** only reads static files, plus two runtime services: Pl@ntNet (through a server route, to keep the key secret) and Firestore (user sightings).
- The **service worker** makes the app installable and offline-capable.

## Repository layout

```
chloris/
  CLAUDE.md                    # rules Claude Code always follows
  MASTER_PROMPT.md             # the one prompt that builds everything
  PRD.md
  README.md                    # the hackathon README (filled in on Saturday)
  docs/
    ARCHITECTURE.md  DATA_PIPELINE.md  DATA_MODEL.md  WEB_APP.md
    DESIGN.md  TASKS.md  SUBMISSION.md  FLUTTER_PHASE2.md
  pipeline/
    requirements.txt
    .env.example               # GBIF credentials
    config/
      scoring.yaml             # weights + thresholds (science lead edits)
      featured_species.csv     # curated uses/harvest/substitutes (science lead edits)
    raw/                       # downloads, git-ignored except .gitkeep
    work/                      # intermediate parquet files, git-ignored
    chloris/                   # Python package: one module per step
      __init__.py  config.py  wcvp.py  wcups.py  gbif.py  cells.py
      protected.py  fire.py  score.py  export.py  run.py
    chloris_pipeline.ipynb     # calls the package step by step, outputs visible
  web/
    .env.example
    app/  components/  lib/  public/  (see docs/WEB_APP.md)
```

## Key decisions

| Decision | Why |
| --- | --- |
| Catalogue built from WCVP + WCUPS, not a hand list | "All Greek medicinal plants" from authoritative Kew data, reproducible, citable |
| 0.1° grid cells (~10 km) for everything public | Fast maps, small files, and protects locations of threatened species |
| Static JSON, no backend database for catalogue | Works offline, free hosting, reproducible |
| Firestore only for sightings | Offline write queue built in, real-time map layer |
| Pl@ntNet behind `/api/identify` | Secret key stays on the server; one place to handle errors and quota |
| Next.js PWA first, Flutter later | One link for judges on any phone; Flutter reuses the same data and API route |
| Three.js only on the landing route | Cinematic first impression without slowing the field app |
