# MASTER PROMPT — Build Chloris with Claude Code

Paste everything below into Claude Code, opened in the `chloris/` folder. This prompt is self-contained; the same content also lives in this folder as separate files (`CLAUDE.md`, `PRD.md`, `docs/`, `pipeline/config/`), which are the source of truth if they differ.

---

You are the lead engineer for **Chloris**, our EthnoHack 2026 project (Track 3: Biodiversity & Sustainability). I'm Andro, the developer on a team with a PhD environmental-science lead and teammates handling the pitch. Build the complete, working prototype described below.

## Your mission
1. Build the **data pipeline** that creates a catalogue of **all native Greek vascular plants with a recorded medicinal use** (Kew WCVP — the data behind Plants of the World Online — joined with Kew's World Checklist of Useful Plant Species), maps their GBIF records to 10 km cells, and computes a transparent risk score.
2. Build the **Next.js PWA**: map, species cards, priorities, search, plant scan via Pl@ntNet, offline sightings, install from QR, cinematic WebGL landing, skeleton screens everywhere.
3. Produce a **submission-ready repo**: reproducible notebook, complete README, deployed demo.

## How to work
- **Start** by reading this whole prompt, then confirm the plan in 10 lines or less and list everything I must do by hand (accounts, keys, downloads), so I can start those in parallel.
- **Work phase by phase** following "docs/TASKS.md" below. At each checkpoint: run it, show me the evidence (counts, file sizes, a screenshot or URL), commit, tick the boxes in `docs/TASKS.md`, and give a short report. Then continue to the next phase unless something needs my decision.
- **Use subagents/parallel work where it's safe** (e.g. web shell while the GBIF download runs), but never let two agents edit the same files.
- **Verify, don't assume:** check current docs for Next.js, Serwist, react-map-gl/MapLibre, OpenFreeMap, Pl@ntNet, GBIF and Firebase APIs before relying on details here; inspect every downloaded dataset's columns before coding against it.
- **Stop and ask** only for: missing credentials or manual downloads, science decisions (weights, curated uses, harvest rules), or anything irreversible. Otherwise make the sensible call, note it in your report and keep going.
- **Time box:** we must submit Saturday 7 November night (absolute last minute Sunday 8 November 11:00 Greek time). If we fall behind, cut P2, then P1 features, using the priorities in the PRD. Never cut the risk score, map, species cards or scan.
- **Hard rules** are in CLAUDE.md below. The most important: never invent data; not medical advice; protect threatened plant locations; secrets stay server-side; skeleton screens instead of spinners; Three.js only on the landing page.

Today is Wednesday 4 November 2026, evening. Begin with Phase 0.

---


# ==== FILE: CLAUDE.md ====
## CLAUDE.md — Chloris

Chloris is our EthnoHack 2026 (Track 3: Biodiversity & Sustainability) project: an installable phone app (Next.js PWA) that maps where Greece's medicinal plants grow, scores which are at risk, identifies plants from a photo and tells people whether to harvest or what to use instead.

**Deadline: submit Saturday 7 November night. Absolute last minute: Sunday 8 November, 11:00 Greek time.**

### Read before working
`PRD.md` → `docs/TASKS.md` (current phase) → the doc for the area you touch:
`docs/ARCHITECTURE.md` · `docs/DATA_PIPELINE.md` · `docs/DATA_MODEL.md` · `docs/WEB_APP.md` · `docs/DESIGN.md` · `docs/SUBMISSION.md` · `docs/FLUTTER_PHASE2.md`

### How to work
- Follow `docs/TASKS.md` phase by phase. Finish a phase's checkpoint, commit, report, then continue.
- Prefer working software over polish: P0 before P1 before P2. If time is short, cut using the priorities in PRD.md, never the risk score, the map or the scan flow.
- Small, focused commits with clear messages. Never commit secrets, `raw/` data or `.env` files.
- When a fact about an external API or library might have changed (Next.js, Serwist, MapLibre, react-map-gl, Pl@ntNet, GBIF), check the current docs before coding instead of guessing.
- When something needs a human (accounts, keys, manual downloads, phone tests, science decisions), say exactly what Andro needs to do and continue with whatever doesn't depend on it.

### Hard rules
- **Never invent data.** No made-up species, uses, IUCN categories, coordinates, counts or citations. If data is missing, show "not enough data" / "not reviewed yet" and log it.
- **Not medical advice.** Uses are documented information with an evidence level; every uses section shows the notice. No dosing.
- **Protect threatened plants.** Public data is aggregated to 0.1° cells. At-risk sightings are rounded to 0.1° before saving.
- **Science decisions belong to the science lead.** Weights and thresholds live in `pipeline/config/scoring.yaml`; curated uses, harvest rules and substitutes live in `pipeline/config/featured_species.csv`. Don't change them silently; propose changes in your report.
- **Licences and attribution** for every dataset, API, image and library (README + `/about`).
- **Secrets:** `PLANTNET_API_KEY` only on the server (`/api/identify`). GBIF credentials only in `pipeline/.env`.
- **Performance:** Three.js, GSAP and Lenis load only on `/`. App routes stay light. Every data-loading view has a skeleton screen matching its final layout; no spinner-only loading states.
- **Accessibility:** risk and harvest states always have icon + text, never colour alone; respect `prefers-reduced-motion`.
- **Bilingual:** every UI string goes through the i18n dictionaries (Greek and English).

### Commands (fill in as they are created)
- Pipeline: `cd pipeline && source .venv/bin/activate && python -m chloris.run --step all`
- Web dev: `cd web && npm run dev`
- Web build: `cd web && npm run build`
- Firestore rules: `cd web && firebase deploy --only firestore:rules`

### Copyright
Code © 2026 Andromachossp and the Chloris team.

# ==== FILE: PRD.md ====
## Chloris — Product Requirements Document

**Event:** EthnoHack 2026 · Track 3: Biodiversity & Sustainability
**Version:** 1.0 · 4 November 2026
**Owner (code):** Andro (Andromachossp) · **Science lead:** PhD teammate (environmental education) · **Pitch:** whole team
**Hard deadline:** Sunday 8 November 2026. The rules say 11:00 CET; Devpost says 11:00 EET. Treat **Sunday 11:00 Greek time** as the last minute and **submit Saturday night**.

---

### 1. One-line summary

Chloris is an installable phone app that shows where Greece's medicinal plants grow, which ones are at risk and why, identifies plants from a photo, and tells people whether a plant is safe to harvest or what to use instead.

It answers the Track 3 question in the track lead's own words: *"Where do medicinal plants grow, which are at risk, and how do we keep them?"*

### 2. Problem

- Greece has one of the richest floras in Europe and many endemic medicinal plants (mountain tea, Cretan dittany, oregano, sage, salep orchids).
- Overharvesting, illegal trade, wildfires and habitat loss threaten many of them.
- The data to see this exists (GBIF sightings, Kew's World Checklist, IUCN, Natura 2000, fire data) but it is scattered, technical and not usable by a forager, a hiker, a teacher or a local authority.
- People who pick wild herbs have no simple way to know: *is this plant threatened here, and what can I use instead?*

### 3. Users

| User | Need | What Chloris gives them |
| --- | --- | --- |
| Hiker / forager / herb collector | Know if a plant is safe to pick | Scan → species card → harvest rule + substitute |
| Teacher / environmental educator | Teach local flora and conservation | Atlas, species cards, hotspots for their region |
| Researcher / conservation body | See priorities and gaps | Ranked priorities, hotspots outside Natura 2000, decline signal, open data export |
| Local authority / park manager | Know where to act | Hotspot map, fire exposure, user sightings in their area |
| Hackathon judges | Try it in seconds | QR → installed app; public repo; reproducible notebook |

### 4. Goals and non-goals

**Goals (hackathon prototype)**
1. Catalogue **all native Greek vascular plants with a recorded medicinal use**, built automatically from Kew's WCVP (the data behind Plants of the World Online) + Kew's World Checklist of Useful Plant Species.
2. Compute a transparent, reproducible **risk score** for every species, with its breakdown shown to users.
3. Map **diversity hotspots** and **risk hotspots** (threatened medicinal plants outside protected areas).
4. **Identify plants from a photo** and route the user to a species card with a clear harvest decision.
5. Let users **record sightings offline**, including plants not yet in Chloris; they sync when the phone is back online.
6. Install on any phone from a **QR code** (PWA), work **offline in the field** for everything except instant identification.
7. Look and feel like an award-level site, without hurting speed: cinematic landing, **skeleton screens** everywhere data loads.

**Non-goals (this week)**
- Medical advice or dosing. Uses are shown as documented information with evidence level and a "not medical advice" notice.
- Sensors, cameras, sprinklers, 24/7 monitoring hardware (future slide).
- Training our own identification model (we use the Pl@ntNet API).
- A native app (Flutter is Phase 2, only if time remains after submission-ready).
- Exact public coordinates for threatened species (always generalised).

### 5. Scope: features and requirements

Priorities: **P0** = must ship for the demo · **P1** = should ship · **P2** = stretch.

#### 5.1 Species catalogue (the "database") — P0
- Built by the pipeline from WCVP + WCUPS: species **native to Greece** (WGSRPD level-3 areas GRC Greece, KRI Crete, EAI East Aegean Is.) **and** flagged with a medicinal use.
- Each species has: accepted name, synonyms, family, Greek and English names (where known), endemic-to-Greece flag, IUCN category, risk score + breakdown, decline ratio, record counts, protected share, fire share, map cells, photo (if licence allows), POWO link.
- **Featured species** (curated by the science lead, ~10–30): also uses summary, EMA monograph status and link, harvest rule (`safe | careful | do-not-harvest`), substitutes, reviewer.
- Non-featured species show automatic data and "Uses and harvest guidance not reviewed yet".
- Search by Greek, English or scientific name (accent-insensitive, typo-tolerant).

#### 5.2 Risk score — P0
- Weighted sum of components, each 0–max, total 0–100. Weights live in `pipeline/config/scoring.yaml` so the science lead can change them without touching code.
- Components: IUCN category, Greek endemism, rarity (occupied 10 km cells), decline (sampling-effort corrected), share outside Natura 2000, share in burnt areas (P1).
- Missing data is shown as missing, never as zero ("Not enough historical records").
- Every card shows the breakdown, so the score is explainable.

#### 5.3 Map — P0
- Base map of Greece (OpenFreeMap vector tiles).
- Layers (toggle): Medicinal diversity (species per cell), Risk hotspots, Natura 2000, Burnt areas (P1), Selected species cells, User sightings (unverified).
- Tap a cell → bottom sheet listing species there, sorted by risk.
- Threatened species are only ever shown at ~10 km cell resolution.

#### 5.4 Priorities — P0
- Ranked list of species by risk score, filterable (endemic only, featured only, family, harvest rule). Each row links to the card.

#### 5.5 Scan (camera) — P0
- Photo from camera (`capture="environment"`) or gallery, resized client-side to ~1000 px.
- Server route sends it to Pl@ntNet; the key never reaches the browser.
- Confidence ≥ 0.3 and name in Chloris → open species card with a big harvest decision banner (threatened → "Do not harvest" + substitute).
- Confidence < 0.3 → ask for a flower or leaf photo; show the top 3 candidates.
- Not in Chloris → "Not in Chloris yet — add it as a new plant?" → saves a sighting with the Pl@ntNet name.
- **Offline:** photo + GPS are queued on the device and identified automatically when back online.

#### 5.6 Sightings — P1
- Save a sighting (species or "unknown" + optional note) with GPS. Threatened species are rounded to 0.1° before saving.
- Works offline (Firestore persistent cache + IndexedDB photo queue); syncs automatically.
- Shown on the map as an "unverified" layer; `verified` is set by a reviewer (manually in Firestore for the hackathon).
- No photos stored on the server (privacy, quota).

#### 5.7 Install and offline — P0
- PWA manifest, icons, service worker (Serwist).
- Desktop landing shows a QR code to open on the phone; Android gets the install prompt; iPhone gets an "Add to Home Screen" hint.
- Offline: app shell, species catalogue, search, cards, priorities, previously viewed map areas, sighting queue.

#### 5.8 Landing and visual design — P1
- Cinematic landing page with a Three.js particle scene (particles form a leaf, then morph into the real hotspot cells over Greece), loading counter, huge condensed title, numbered navigation.
- Herbarium-specimen design language for cards (catalogue numbers, specimen labels).
- **Skeleton screens** for every view that loads data (map, cards, lists, scan result). No blank screens and no spinners as the main loading state.
- Respects `prefers-reduced-motion`; the 3D scene never loads on the app screens.
- Full design spec: `docs/DESIGN.md`.

#### 5.9 Languages — P1
- Greek and English UI, switchable, Greek default when the phone is in Greek.

### 6. Data sources

| Source | Use | Licence / attribution |
| --- | --- | --- |
| WCVP (Kew, data behind POWO) | Native Greek species, synonyms, families, endemism | CC BY; cite WCVP version |
| World Checklist of Useful Plant Species (Kew, KNB) | Medicinal-use flag | CC BY 4.0; cite Diazgranados et al. 2020 |
| GBIF occurrences (incl. iNaturalist research grade) | Where plants were recorded, when | Per-record licences; cite the download DOI |
| GBIF species API | Backbone keys, IUCN category per species | Cite GBIF / IUCN Red List |
| Natura 2000 (EEA) | Protected areas | EEA reuse with attribution |
| EFFIS / NASA FIRMS / Global Forest Watch | Burnt areas | Cite chosen source |
| EMA herbal monographs (HMPC) | Evidence level for featured species | Cite each monograph |
| Pl@ntNet API | Photo identification | API terms; attribution in app |
| OpenFreeMap / OpenStreetMap | Base map | © OpenStreetMap contributors |

Most are on the Track 3 slide's suggested list (GBIF, POWO/WFO, iNaturalist, IUCN, Global Forest Watch). Say so in the pitch.

### 7. Non-functional requirements

- **Performance:** app screens interactive in < 3 s on a mid-range phone over 4G. `species.json` gzipped < 1 MB. Per-species cell files loaded on demand. Three.js only on the landing route, dynamically imported.
- **Offline:** everything except identification works with no signal after first open.
- **Privacy:** no accounts (anonymous auth), no photos stored, threatened species locations generalised.
- **Accessibility:** WCAG AA contrast, keyboard and screen-reader labels, reduced-motion support, risk never shown by colour alone.
- **Reproducibility:** one notebook regenerates every data file from raw downloads; versions and DOIs recorded.
- **Honesty:** limitations visible in-app ("About the data") and in the README.

### 8. Success criteria (demo day)

1. A judge scans the QR and has Chloris installed in under 30 seconds.
2. The map shows real hotspots for Greece, and tapping one lists real species.
3. Scanning a real plant (e.g. oregano or sage) lands on its card with a harvest decision.
4. Airplane mode: the app still opens, search and cards work, a sighting is queued.
5. The notebook runs top to bottom and reproduces `web/public/data/`.
6. README covers sources, licences, method, limitations, what we built vs. reused, and AI use.

### 9. Risks

| Risk | Mitigation |
| --- | --- |
| Full-Greece list is large (hundreds to thousands of species) | GBIF **bulk download** instead of paging; aggregate to 10 km cells; per-species files on demand |
| Sampling bias makes raw counts misleading | Share-of-all-plant-records ratio; minimum record thresholds; state the limitation |
| Synonyms split records | Resolve via WCVP + GBIF backbone before fetching |
| Most species have no IUCN assessment | Treat NE/DD as "unknown" with a small weight; add endemism and rarity |
| WCUPS download unavailable | Fallback: featured list + GBIF/WCVP for Greek natives, flag "medicinal" only for curated species |
| Pl@ntNet quota or downtime during demo | Server route only; record the demo early; graceful offline queue |
| Wrong identification | Show confidence and top-3; harvest banner only above threshold |
| Health-claims rule | Evidence level + "not medical advice" on every uses section |
| Over-ambitious visuals | Landing visuals are P1; app screens ship first with skeletons |

### 10. Timeline (remaining days)

| Day | Focus | Checkpoint |
| --- | --- | --- |
| Wed 4 Nov (night) | Repo, accounts, pipeline stages 1–3 | Greek medicinal species list exists |
| Thu 5 Nov | GBIF download, cells, decline, Natura, scores, export; app shell + map | Map shows real hotspots on the deployed URL |
| Fri 6 Nov | Cards, search, priorities, scan, sightings, offline, skeletons | Scan a real plant on a phone → card |
| Sat 7 Nov | Landing visuals, polish, README, slides, video, **submit** | Devpost submission confirmed |
| Sun 8 Nov | Buffer only (deadline 11:00 Greek time at the latest) | — |

Flutter (Phase 2) starts only after the Saturday submission is safe.

### 11. Future (slides only)

Native offline app with on-device identification · sensor network for real-time monitoring and fire prevention · expert verification workflow · climate-driven range-shift models · heritage-site plant networks · illegal-trade signals from market and customs data.

# ==== FILE: docs/TASKS.md ====
## Build tasks

Work through the phases in order. Each phase ends with a **checkpoint**: run it, show the result, commit, then stop and report before starting the next phase. Tick boxes in this file as you go.

Andro does the manual steps marked 👤 (accounts, downloads, phone tests). Ask for them early; don't wait until they block you.

### Phase 0 — Setup (Wed night)

- [ ] 👤 GitHub repo `chloris` (public), Vercel project linked to `web/`, Firebase project (Firestore + Anonymous Auth), Pl@ntNet API key, GBIF account
- [ ] Create the monorepo layout from ARCHITECTURE.md, `.gitignore`, `pipeline/.env.example`, `web/.env.example`
- [ ] `pipeline/`: virtualenv + `requirements.txt`; package skeleton `chloris/` with `config.py` reading `config/scoring.yaml`
- [ ] `web/`: create the Next.js app (TypeScript, Tailwind, App Router, ESLint), add design tokens, fonts, app shell with tab bar, i18n scaffold, `<Skeleton>` primitive, placeholder pages for every route
- [ ] Deploy the empty app to Vercel
- **Checkpoint:** deployed URL opens on a phone with the tab bar and skeletons on every route.

### Phase 1 — Species catalogue (Wed night → Thu morning)

- [ ] Step 0 downloads: WCVP scripted; 👤 WCUPS, Natura 2000 (and fire data if possible) into `raw/`
- [ ] Step 1 `wcvp.py`: Greek natives + endemism + synonyms
- [ ] Step 2 `wcups.py`: medicinal filter (+ fallback path)
- [ ] Step 3 `gbif.py`: backbone keys, IUCN, vernacular names (cached)
- [ ] Notebook cells 1–3 with printed counts and a table of the first 20 species
- **Checkpoint:** report the number of Greek native species, endemic species, medicinal species, and match rates. Science lead sanity-checks a sample.

### Phase 2 — Occurrences, cells, scores, export (Thu)

- [ ] Step 4: GBIF download request, poll, fetch, clean; effort totals; record DOI
- [ ] Step 5: cells
- [ ] Step 6: Natura 2000 join + simplified `natura.geojson`
- [ ] Step 7: fire (P1; skip cleanly if no data)
- [ ] Step 8: scores with sanity checks (histogram, top 20, known threatened species)
- [ ] Step 9: merge `featured_species.csv`, export all files to `web/public/data/`, size checks, `meta.json`
- [ ] `web/lib/types.ts` matches DATA_MODEL.md; a tiny script validates the JSON against the types (zod)
- **Checkpoint:** file sizes, counts, top-20 table; commit the data files.

### Phase 3 — Map and catalogue screens (Thu → Fri morning)

- [ ] Data store `lib/data.ts` (fetch once, cache in memory)
- [ ] `/map`: base map, diversity layer, hotspots, Natura 2000, cell bottom sheet, species layer with Then/Now, locate me
- [ ] `/species/[slug]`: full specimen card + skeleton
- [ ] `/priorities` with filters, `/search` with accent-insensitive Greek/English/scientific search
- [ ] `/about` from `meta.json` (sources, DOI, weights, limitations, not medical advice)
- **Checkpoint:** on the deployed URL, tap a hotspot → species → card, on a phone.

### Phase 4 — Scan, sightings, offline, install (Fri)

- [ ] `/api/identify` with error handling and rate limit
- [ ] `/scan`: portal viewfinder, resize, GPS, result states (found / unsure / not in Chloris), portal transition to card with harvest banner
- [ ] Offline scan queue (IndexedDB) processed on reconnect
- [ ] Sightings: save with generalisation rules, Firestore offline cache, live layer on map, `/sightings` page
- [ ] `firestore.rules` deployed
- [ ] Serwist: precache, runtime caching, offline fallback, manifest, icons, install button, iOS hint, QR on `/about`
- **Checkpoint (👤 on real phones):** install from QR on Android and iPhone; scan a real plant → card; airplane mode → app opens, search and cards work, sighting queued, then syncs.

### Phase 5 — Landing and polish (Sat morning)

- [ ] Intro loader, WebGL particle story (leaf → Greece → risk), numbered menu, sideways panels, install section
- [ ] Reduced-motion / no-WebGL poster fallback
- [ ] Lighthouse pass on `/map` and `/`; fix CLS, contrast, labels
- [ ] Greek translation pass on every UI string
- [ ] P2 only if time: ASCII footer, species photos for all featured, fire layer polish
- **Checkpoint:** landing runs smoothly on a mid-range phone; app routes don't load Three.js (check the bundle).

### Phase 6 — Submission (Sat afternoon/evening)

- [ ] README complete (see SUBMISSION.md)
- [ ] Notebook rerun top to bottom with outputs saved
- [ ] Screenshots + screen recording for the video
- [ ] 👤 Devpost page, video, slides; submit Saturday night
- **Checkpoint:** Devpost shows "Submitted"; repo and demo open in a private window.

### Phase 7 — Flutter (only after submission is safe)

See FLUTTER_PHASE2.md.

# ==== FILE: docs/ARCHITECTURE.md ====
## Architecture

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

### Repository layout

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

### Key decisions

| Decision | Why |
| --- | --- |
| Catalogue built from WCVP + WCUPS, not a hand list | "All Greek medicinal plants" from authoritative Kew data, reproducible, citable |
| 0.1° grid cells (~10 km) for everything public | Fast maps, small files, and protects locations of threatened species |
| Static JSON, no backend database for catalogue | Works offline, free hosting, reproducible |
| Firestore only for sightings | Offline write queue built in, real-time map layer |
| Pl@ntNet behind `/api/identify` | Secret key stays on the server; one place to handle errors and quota |
| Next.js PWA first, Flutter later | One link for judges on any phone; Flutter reuses the same data and API route |
| Three.js only on the landing route | Cinematic first impression without slowing the field app |

# ==== FILE: docs/DATA_PIPELINE.md ====
## Data pipeline

Python 3.11+. Package in `pipeline/chloris/`, one module per step. Each step reads the previous step's output from `pipeline/work/` and writes its own, so any step can be rerun alone. `python -m chloris.run --step <name|all>` runs steps; `chloris_pipeline.ipynb` calls the same functions with visible outputs, tables and small maps (judges value this).

**Rules for every step**
- Never invent data. If a source can't be downloaded, stop and report what is missing and where to get it.
- Inspect a downloaded file's columns and delimiter before using it; print them. Don't assume column names from this doc; they are the expected ones, verify them.
- Log counts at every step (rows in, rows out, why rows were dropped) and write them to `work/log.json`, which feeds `meta.json` and the README.
- Cache network calls on disk (`work/cache/`) so reruns are fast and polite to APIs. Respect rate limits (≤ 5 requests/s to GBIF).

### Step 0 — Raw downloads (`raw/`)

| File | Where | How |
| --- | --- | --- |
| WCVP | `https://sftp.kew.org/pub/data-repositories/WCVP/wcvp.zip` (data behind POWO) | Scripted download. Contains `wcvp_names.csv` and `wcvp_distribution.csv`, usually pipe-separated (`|`); detect the delimiter. Record the version/date. |
| WCUPS | Knowledge Network for Biocomplexity (KNB): search "World Checklist of Useful Plant Species" (Diazgranados et al. 2020, CC BY 4.0) | **Manual** if the site blocks scripts: Andro downloads it into `raw/wcups/`. Inspect columns: expect a name, an IPNI ID (LSID) and one column or flag per use category including **Medicines**. |
| Natura 2000 | EEA "Natura 2000 – spatial data" (GeoPackage or Shapefile) | Manual or scripted into `raw/natura2000/`. Keep Greek sites (member-state field, often `MS` = `GR`; verify). |
| Burnt areas (P1) | EFFIS burnt-area polygons, or NASA FIRMS / Global Forest Watch for Greece | Manual into `raw/fire/`. Skip the fire step if not available by Thursday noon. |
| GBIF occurrences | GBIF download API (needs a free GBIF account) | Scripted in Step 4. Credentials in `pipeline/.env`: `GBIF_USER`, `GBIF_PWD`, `GBIF_EMAIL`. |

### Step 1 — Greek native species from WCVP (`wcvp.py` → `work/greek_species.parquet`)

1. Load names and distribution.
2. Keep accepted names (`taxon_status == "Accepted"`) at rank **Species**. Map accepted infraspecific taxa to their parent species (so *Origanum vulgare* subsp. *hirtum* counts as *Origanum vulgare*; keep the infraspecific names as synonyms for matching).
3. Greek areas = WGSRPD level-3 codes **GRC** (Greece), **KRI** (Crete), **EAI** (East Aegean Is.). Keep species with a **native** record (`introduced == 0`, `extinct == 0`, `location_doubtful == 0`) in any of them.
4. `endemic_gr = True` when all native, non-doubtful areas of the species are within {GRC, KRI, EAI}.
5. Collect synonyms: every name whose `accepted_plant_name_id` points to the species (or to its infraspecific taxa).
6. Keep: `plant_name_id`, `ipni_id`, `powo_id`, `taxon_name`, `taxon_authors`, `family`, `genus`, `endemic_gr`, `greek_areas`, `synonyms`.
7. Print: total Greek natives, endemics.

### Step 2 — Medicinal filter (`wcups.py` → `work/medicinal_species.parquet`)

1. Load WCUPS, keep rows flagged **Medicines**.
2. Join to Step 1 by IPNI ID first (strip the LSID prefix `urn:lsid:ipni.org:names:`), then by normalised name for the rest (lowercase, single spaces, authors removed), then by synonyms.
3. Also include every species in `config/featured_species.csv` even if WCUPS misses it (flag `medicinal_source = "curated"`).
4. Print: matched by ID / by name / by synonym / unmatched; final count.
5. **Fallback** if WCUPS can't be obtained: keep all Greek natives, set `medicinal_source = "curated"` only for the featured list, and show only featured species as "medicinal" in the app. Report this clearly.

### Step 3 — GBIF keys, IUCN and Greek names (`gbif.py` → `work/species_gbif.parquet`)

For each species:
1. Match name to the GBIF backbone (`pygbif.species.name_backbone(name, kingdom="Plantae", strict=True)` or the current GBIF species-match endpoint). Keep `usageKey` only for `EXACT` or high-confidence `FUZZY` matches at species rank; log the rest.
2. IUCN: `GET https://api.gbif.org/v1/species/{key}/iucnRedListCategory`. A 204 or empty body means not assessed → `NE`. Store the code (`CR`, `EN`, `VU`, `NT`, `LC`, `DD`, `NE`).
3. Greek vernacular names: `GET /v1/species/{key}/vernacularNames`, pick language `ell`/`gre`/`el`; English likewise. `featured_species.csv` overrides both.
4. Cache every response in `work/cache/`.

### Step 4 — GBIF occurrence download (`gbif.py` → `raw/gbif/<key>.zip` → `work/occurrences.parquet`)

1. Request **one** download with the GBIF download API (POST `https://api.gbif.org/v1/occurrence/download/request`, basic auth), format `SIMPLE_CSV`, predicate:
   - `country = GR`
   - `taxonKey in [all species keys]`
   - `hasCoordinate = true`, `hasGeospatialIssue = false`
   - `occurrenceStatus = PRESENT`
2. Poll until `SUCCEEDED`, download the zip, **record the DOI** (it goes in README and `meta.json`).
3. Clean: drop `coordinateUncertaintyInMeters > 10000`, drop missing `year` for decline (keep for maps), drop exact duplicates (same species, coordinates, date), drop `basisOfRecord == FOSSIL_SPECIMEN`, drop points outside Greece's bounding box (lat 34.5–42.0, lon 19.0–30.0).
4. Map each record's `taxonKey`/`speciesKey` back to the Chloris species.
5. Effort totals for the decline correction, one call per period: `GET /v1/occurrence/search?country=GR&kingdomKey=6&year=<from>,<to>&hasCoordinate=true&limit=0` → `count`. Store `N_old`, `N_new`.

### Step 5 — Grid cells (`cells.py` → `work/species_cells.parquet`, `work/cells.parquet`)

- Cell size from `scoring.yaml` (default 0.1°). Cell id: `f"{floor(lat/size)}_{floor(lon/size)}"`; the client rebuilds the square from the id.
- Per species × cell: `n`, `first_year`, `last_year`, `n_old`, `n_new`.
- Per species: `n_records`, `n_cells`, `n_old`, `n_new`.

### Step 6 — Protected areas (`protected.py`)

- Spatial join of cleaned **records** (not cells) with Greek Natura 2000 polygons (EPSG:4326, `predicate="within"`).
- Per species: `protected_share` = records inside / all records.
- Per cell: `protected_fraction` = area of cell covered by Natura 2000 (for the hotspot logic and map shading).
- Export simplified polygons: `natura.geojson`, topology-preserving simplification, aim for < 3 MB; keep `SITECODE`, `SITENAME`, `SITETYPE` (verify field names).

### Step 7 — Fire exposure (`fire.py`, P1)

- Burnt-area polygons for Greece, years per `scoring.yaml` (default last 10 years).
- Per species: `fire_share` = records inside burnt polygons.
- Export simplified `fires.geojson` (< 2 MB) with year.
- If skipped, `fire_share = null` and the weight is redistributed proportionally (log it).

### Step 8 — Risk score (`score.py`)

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

### Step 9 — Curation merge and export (`export.py` → `web/public/data/`)

1. Merge `featured_species.csv` (uses, EMA status/link, harvest, substitutes, names). Validate: unknown slugs in `substitutes`, invalid enums → error.
2. Slug: `genus-species` lowercase ASCII (`origanum-dictamnus`). Catalogue number: `CHL-0001`… ordered by family, then name.
3. Photos (P1, featured only): one CC0/CC BY image per species from GBIF occurrence media (`mediaType=StillImage`, licence filter); store URL, creator, licence, source link. Never use unlicensed images.
4. Write the files described in `docs/DATA_MODEL.md`. Round floats (scores to integers, shares to 2 decimals). Minify JSON.
5. Print file sizes; fail if `species.json` > 2 MB raw or any `occ/*.json` > 200 KB.
6. Write `meta.json` with source versions, GBIF DOI, download dates, counts, weights and missing-data notes.

# ==== FILE: docs/DATA_MODEL.md ====
## Data model

All files in `web/public/data/` are generated by the pipeline. The web app never edits them. TypeScript types for each live in `web/lib/types.ts` and must match exactly.

### `species.json` — the catalogue

Array of objects, sorted by catalogue number.

```ts
type IucnCode = "CR" | "EN" | "VU" | "NT" | "LC" | "DD" | "NE";
type Harvest = "safe" | "careful" | "do-not-harvest" | "unknown";
type EmaStatus = "well-established" | "traditional" | "none" | "unknown";
type RiskLevel = "low" | "moderate" | "high" | "critical";

interface Species {
  slug: string;              // "origanum-dictamnus"
  cat: string;               // "CHL-0412" catalogue number
  name: string;              // accepted scientific name, no authors
  authors: string;
  family: string;
  nameEl: string | null;
  nameEn: string | null;
  powoId: string | null;     // for POWO link and Pl@ntNet matching
  gbifKey: number | null;
  endemic: boolean;          // endemic to Greece (GRC/KRI/EAI)
  iucn: IucnCode;
  medicinalSource: "wcups" | "curated";
  risk: {
    score: number;           // 0–100 integer
    level: RiskLevel;
    atRisk: boolean;
    parts: {                 // points contributed; null = not enough data
      iucn: number; endemic: number; rarity: number;
      decline: number | null; unprotected: number; fire: number | null;
    };
  };
  stats: {
    records: number; cells: number;
    recordsOld: number; recordsNew: number;
    declineRatio: number | null;
    protectedShare: number;  // 0–1
    fireShare: number | null;
    firstYear: number | null; lastYear: number | null;
  };
  featured: boolean;
  curated?: {                // only when featured
    usesEn: string; usesEl: string;
    ema: EmaStatus; emaUrl: string | null;
    harvest: Harvest;
    substitutes: string[];   // slugs
    reviewedBy: string | null;
  };
  photo?: { url: string; credit: string; licence: string; source: string };
}
```

### `names.json` — lookup for search and scan matching

```ts
{
  byName: Record<string, string>;   // normalised name (accepted + synonyms, lowercase, no authors) → slug
  byPowo: Record<string, string>;   // POWO id → slug
  byGbif: Record<string, string>;   // GBIF key → slug
}
```

### `cells.json` — hotspots

```ts
{
  size: number;                      // 0.1
  cells: Array<{
    id: string;                      // "382_237" → lat 38.2–38.3, lon 23.7–23.8
    s: number[];                     // indexes into species.json
    nAtRisk: number; nEndemic: number;
    protected: number;               // 0–1 fraction of cell in Natura 2000
    hotspot: boolean;                // has ≥1 at-risk species AND protected < 0.5
  }>;
}
```

### `occ/<slug>.json` — one species' cells, loaded on demand

```ts
Array<{ c: string; n: number; f: number | null; l: number | null; o: number; w: number }>
// c = cell id, n = records, f/l = first/last year, o = records in old period, w = records in new period
```

### `natura.geojson`, `fires.geojson`

Simplified polygons. Properties: Natura `{ code, name, type }`; fires `{ year }`.

### `meta.json`

```ts
{
  generatedAt: string;
  sources: Array<{ name: string; version: string; url: string; licence: string; doi?: string }>;
  counts: { greekNatives: number; medicinal: number; featured: number; records: number; cells: number; atRisk: number };
  scoring: object;                  // copy of scoring.yaml
  notes: string[];                  // e.g. "Fire layer skipped: no data"
}
```

### Firestore: `sightings` collection

```ts
interface Sighting {
  slug: string | null;              // null if not in Chloris
  scientificName: string | null;    // from Pl@ntNet or user
  confidence: number | null;        // 0–1
  note: string | null;              // max 280 chars
  lat: number; lng: number;         // rounded: 0.1 for at-risk species, 0.001 otherwise
  generalised: boolean;
  uid: string;                      // anonymous auth uid
  createdAt: Timestamp;             // serverTimestamp()
  capturedAt: string;               // ISO, device time (may differ when synced later)
  verified: boolean;                // always false on create
}
```

**Security rules (must be deployed):**
- read: anyone.
- create: signed-in (anonymous) users only, `uid == request.auth.uid`, `verified == false`, lat within 34.5–42.0 and lng within 19.0–30.0, `note` ≤ 280 chars, only the fields above.
- update, delete: nobody (verification is done by hand in the console for the hackathon).

### Device storage (offline)

- **Firestore persistent local cache** queues sighting writes.
- **IndexedDB** (`idb-keyval`) queue `pendingScans`: `{ id, photoBlob, lat, lng, capturedAt }`. Processed by `/api/identify` when online, then removed. Photos never leave the device except to Pl@ntNet.

# ==== FILE: docs/WEB_APP.md ====
## Web app

**Stack:** latest stable Next.js (App Router, TypeScript strict) · Tailwind CSS · MapLibre GL via `react-map-gl/maplibre` · Serwist (`@serwist/next`) for the service worker · Firebase (Firestore + Anonymous Auth) · MiniSearch or Fuse.js for search · `idb-keyval` · `qrcode.react` · Three.js via `@react-three/fiber` + `@react-three/drei` (landing only) · GSAP + Lenis (landing only) · Vercel hosting.

Check the installed Next.js version against Serwist's docs. If Serwist needs webpack for the service-worker build, build with the webpack flag; don't fight the bundler.

### Routes

| Route | Purpose | Data | Priority |
| --- | --- | --- | --- |
| `/` | Cinematic landing, story, install QR | `cells.json` (for particles) | P1 |
| `/map` | Map with layers + cell bottom sheet | `cells.json`, `natura.geojson`, `fires.geojson`, `occ/<slug>.json`, Firestore | P0 |
| `/scan` | Camera → identify → result | `/api/identify`, `names.json`, `species.json` | P0 |
| `/species/[slug]` | Species card (herbarium specimen) | `species.json`, `occ/<slug>.json` | P0 |
| `/priorities` | Ranked list + filters | `species.json` | P0 |
| `/search` | Full-text search (also a sheet on `/map`) | `species.json`, `names.json` | P0 |
| `/sightings` | My queued and synced sightings | IndexedDB, Firestore | P1 |
| `/about` | Data, method, scoring, limitations, credits, "not medical advice" | `meta.json` | P0 |
| `/api/identify` | Server route → Pl@ntNet | env `PLANTNET_API_KEY` | P0 |

`manifest.start_url = "/map"` so the installed app skips the landing page.

### App shell

- Bottom tab bar on phones: **Map · Scan · Priorities · Search**; Scan is the raised centre button. Side rail on desktop.
- Top bar: language switch (EL/EN), offline indicator ("Offline — identification will run when you're back online").
- All data loaded through one cached client store (`lib/data.ts`) that fetches each file once, keeps it in memory and relies on the service worker for offline.

### `/map`

- MapLibre with an OpenFreeMap style (check available style URLs at openfreemap.org; prefer a dark one or restyle "liberty" to the Chloris palette). Centre Greece, `maxBounds` around it.
- Layers (toggles in a sheet; order bottom → top):
  1. Natura 2000 (fill, low opacity, outline)
  2. Burnt areas (P1)
  3. Medicinal diversity: cells coloured by number of species (sequential scale, one hue)
  4. Risk hotspots: cells where `hotspot == true`, ember outline + pattern so it isn't colour-only
  5. Selected species: its cells (from `occ/<slug>.json`), with a "Then / Now" toggle (old vs new period)
  6. User sightings (Firestore, live): hollow markers labelled "Unverified"
- Build cell squares client-side from ids (GeoJSON generated in a `useMemo`).
- Tap cell → bottom sheet: cell name/coordinates, counts, species list sorted by risk (virtualised), each row → card.
- "Locate me" button; works offline from cached tiles where available.

### `/scan`

1. Viewfinder screen (see DESIGN.md "portal"). `<input type="file" accept="image/*" capture="environment">` plus "Choose from gallery".
2. Resize in a canvas to max 1000 px, JPEG 0.8. Get GPS (`navigator.geolocation`, 10 s timeout, optional).
3. **Online:** POST `multipart/form-data` to `/api/identify`. Show the scan skeleton while waiting.
4. **Offline:** save to `pendingScans` in IndexedDB; toast "Saved. We'll identify it when you're online." A `useOnline` hook processes the queue on reconnect and notifies the user.
5. Result logic:
   - Best score ≥ 0.3 and found in Chloris → portal transition into `/species/[slug]?from=scan`, which shows the harvest banner first.
   - Best score < 0.3 → "Not sure" with top 3 candidates (name, score %, Chloris badge if known) + "Try a flower or leaf photo".
   - Not in Chloris → "Not in Chloris yet" + "Add it as a new plant" → sighting with `slug: null`, Pl@ntNet name.
6. Matching order: POWO id → GBIF key → normalised name (incl. synonyms) via `names.json`.

### `/api/identify` (route handler, Node runtime)

- Accept `multipart/form-data` with `image` (≤ 5 MB, image/*) and optional `organ`.
- Forward to `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&nb-results=5&lang=en` with fields `images` and `organs` (`auto` by default). Check the current Pl@ntNet API docs for parameter names and the response shape before coding.
- Return `{ candidates: [{ name, score, commonNames, powoId, gbifKey }], remaining?: number }`.
- Errors: 4xx/5xx → `{ error: "identify_failed" }` with status; never leak the key. Simple per-IP rate limit (e.g. 10/min, in-memory).

### `/species/[slug]`

Order on the page:
1. Harvest banner (only if `curated.harvest` set, or `atRisk` → "Do not harvest: at-risk species"), with substitutes as chips.
2. Specimen header: catalogue number, scientific name (italic), authors, Greek and English names, family, endemic badge, IUCN badge, POWO link.
3. Risk: score ring + level label + breakdown bars (each component with a one-line explanation; nulls say "Not enough data").
4. Mini map of its cells with Then / Now toggle and first/last year.
5. Uses (featured): EN/EL text, EMA status badge + link, "Not medical advice" notice. Non-featured: "Recorded medicinal use (Kew WCUPS). Uses and harvest guidance not reviewed yet."
6. Data footnote: records, cells, sources; photo credit and licence.
- Client-rendered from the cached catalogue so every species works offline. `generateStaticParams` only for featured species (fast first load in the demo).

### `/priorities`

- Virtualised list sorted by risk; filters: at-risk only, endemic only, featured only, family, IUCN, harvest. Row: catalogue number, names, risk level chip (icon + text), score.

### Offline and install (Serwist)

- Precache: app shell, route JS/CSS, fonts, icons, `species.json`, `names.json`, `cells.json`, `meta.json`.
- Runtime: `occ/*.json` and GeoJSON → StaleWhileRevalidate; OpenFreeMap tiles/styles/glyphs/sprites → CacheFirst with expiration (e.g. 3000 entries, 30 days); `/api/*` → NetworkOnly.
- Offline fallback page for uncached navigations.
- Manifest: name "Chloris", short_name "Chloris", theme/background from DESIGN.md, icons 192/512 + maskable, `display: standalone`, `start_url: /map`, `lang: el`.
- Install UX: `beforeinstallprompt` → "Install Chloris" button (Android/desktop Chrome). iOS Safari (no prompt) → one-time hint "Tap Share → Add to Home Screen". Hide both when `display-mode: standalone`.
- Landing and `/about` show a QR code (`qrcode.react`) of the production URL.

### Firebase

- `lib/firebase.ts`: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`, `signInAnonymously` on first save.
- Deploy `firestore.rules` from DATA_MODEL.md (`firebase deploy --only firestore:rules`).

### Internationalisation

- `lib/i18n/{el,en}.ts` dictionaries + a small context provider; default from `navigator.language`, persisted in `localStorage` (wrapped in try/catch). Every UI string goes through it. Species content uses `nameEl`/`usesEl` when present, else English with a small "EN" tag.

### Quality bar

- TypeScript strict, ESLint clean, no `any` in data types.
- Lighthouse on `/map` (mobile): Performance ≥ 80, Accessibility ≥ 95, PWA installable.
- No layout shift when skeletons are replaced (CLS < 0.1).
- Test on a real Android phone and a real iPhone before Saturday.

# ==== FILE: docs/DESIGN.md ====
## Design

### Concept: "Night herbarium"

Chloris looks like a botanical herbarium catalogue at night: dark forest ink, chlorophyll light, parchment specimen sheets with catalogue numbers. The landing page is a cinematic WebGL story. The app screens are calm and fast, with skeleton screens instead of spinners.

**Inspiration (combine ideas that suit plants and conservation; don't copy any site's look):**

| Site | What we take | Where in Chloris |
| --- | --- | --- |
| [The New Mobile Workforce](https://thenewmobileworkforce.imm-g-prod.com) | Linear scroll story; every scroll step has a big visual change; WebGL particles morphing between shapes | Landing: particles morph leaf → Greece hotspots → at-risk glow |
| [Persepolis Reimagined](https://persepolis.getty.edu) | Loading counter; "past vs present" reconstruction | Intro counter; "Then / Now" toggle on maps and cards |
| [KPRverse](https://kprverse.com) | Portals: one world revealed through another | Scan viewfinder as a circular portal that opens into the species card |
| [Byholm](https://byholm.co) | Numbered menu (01–05) with one permanent CTA; sideways-scrolling panels | Landing nav; "How we keep them" panels |
| [Noddal](https://noddal.xyz) | Dark cinematic mood; huge condensed title across the screen | "CHLORIS" across the bottom of the hero |
| [Suho](https://suho.studio/#work) | 000→100 loader; numbered entries; ASCII-art closing | Loader; catalogue numbers "CHL-0001"; ASCII/dot-matrix plant on the landing footer (P2) |

### Tokens

Define as CSS variables in `app/globals.css` and map them into Tailwind's theme.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0B1410` | Page background (night forest) |
| `--moss` | `#13241B` | Raised surfaces, sheets |
| `--moss-2` | `#1C3326` | Hover, skeleton base |
| `--line` | `rgba(233,240,228,0.12)` | Hairlines |
| `--text` | `#E9F0E4` | Primary text |
| `--text-dim` | `#A9B8AC` | Secondary text |
| `--chlorophyll` | `#7BE495` | Brand accent, primary buttons, focus ring |
| `--pollen` | `#E9D98B` | Highlights, endemic badge |
| `--parchment` | `#F1EBDD` | Specimen card paper |
| `--parchment-ink` | `#2A2418` | Text on parchment |
| Risk low | `#8FB79A` + leaf icon | |
| Risk moderate | `#E3B23C` + triangle icon | |
| Risk high | `#E0653A` + flame icon | |
| Risk critical | `#E04848` + octagon icon | Always icon + label, never colour alone |
| Harvest safe / careful / do-not | same as low / moderate / critical, with icons ✓ / ! / ✕ | |

Radius 14 px cards, 999 px pills. Hairline borders, no heavy shadows. Check contrast for every text/background pair (AA).

### Type (all support Greek)

- **Display:** Roboto Flex, condensed (`wdth` 25–40, weight 800–900) for "CHLORIS" and section numbers.
- **Botanical serif:** Literata for species names (italic for scientific names) and long text on cards.
- **Specimen mono:** JetBrains Mono for catalogue numbers, coordinates, counts, labels.
- UI text: Roboto Flex at normal width.
Load with `next/font/google`, subsets `latin` + `greek`, `display: swap`.

### Landing page `/` (WebGL)

Linear scroll story, numbered menu `01 Flora · 02 Where · 03 Risk · 04 Keep · 05 Install` + permanent "Open Chloris" button.

0. **Intro loader** (first visit only, skippable, max 2.5 s): mono counter `000 → 100` tied to real loading of `cells.json` and the WebGL scene, label "Cataloguing the flora of Greece". Session-stored so it never repeats.
1. **01 Flora — hero:** a leaf made of ~6,000 particles (3,000 on phones) breathing slowly in chlorophyll light. Huge condensed "CHLORIS" across the bottom edge. Subtitle: "Where Greece's medicinal plants grow, which are at risk, and how we keep them."
2. **02 Where:** on scroll, particles fly from the leaf to the real cell centres from `cells.json`, forming Greece. Brightness = number of medicinal species. Counter shows the real number of species from `meta.json`.
3. **03 Risk:** hotspot cells glow ember and pulse; the rest dim. Text: real count of at-risk species and how many hotspots are outside Natura 2000.
4. **04 Keep:** sideways-scrolling panels (Byholm): Scan a plant → See if it's safe → Use a substitute → Record a sighting. Each panel has a phone mock with a real screenshot of the app.
5. **05 Install:** QR code + "Open Chloris" + iPhone/Android install hint. Data credits line.
6. **Footer (P2):** ASCII/dot-matrix rendering of a featured plant photo that reveals the real photo under the pointer (Suho), with the photo credit.

**WebGL implementation rules**
- `@react-three/fiber` `Points` with a custom `ShaderMaterial`: attributes `aStart` (leaf), `aMap` (cell position), `aRisk`; uniform `uProgress` (0–2) driven by GSAP ScrollTrigger + Lenis; mix positions in the vertex shader with per-particle delay and noise.
- Leaf positions: sample points inside an SVG leaf path (or a simple parametric leaf) once at startup.
- Map positions: project cell centres with an equirectangular projection fitted to the canvas; if there are more particles than cells, distribute extras around busy cells.
- Load the scene with `next/dynamic` and `ssr: false` **only on `/`**. App routes never import Three.js, GSAP or Lenis.
- Cap DPR at 1.5, pause the render loop when the tab is hidden or the canvas is offscreen, and dispose geometry on unmount.
- No WebGL, or `prefers-reduced-motion`: show a static, pre-rendered poster image of the Greece hotspot map and normal scrolling. Same text, no motion.

### App screens

**Specimen card** (`/species/[slug]`): a parchment sheet on the dark background, like a herbarium sheet. Top-left catalogue number in mono; top-right a round "seal" with the risk score; a bordered "label" block (family, records, cells, years, IUCN, endemic). Scientific name in Literata italic. Harvest banner sits above the sheet at full width.

**Portal (scan):** the viewfinder is a circular mask over the camera image with a thin rotating chlorophyll ring while identifying. On success, the circle expands (`clip-path: circle()` animation, ~600 ms) and reveals the species card underneath. Pure CSS, no WebGL.

**Then / Now:** a two-state segmented control on maps; "Then" shows old-period cells in pollen, "Now" new-period cells in chlorophyll; cells present then but not now get a dashed outline.

**Motion:** 150–250 ms ease-out for UI; nothing bounces. Respect `prefers-reduced-motion` everywhere.

### Skeleton screens (required)

Every route that loads data shows a skeleton that matches the final layout, so nothing jumps when content arrives (CLS < 0.1). No full-screen spinners.

- Build them with `loading.tsx` per route (navigation) **and** client skeleton components while JSON loads (`<Suspense>` boundaries around data-dependent parts).
- One shared `<Skeleton>` primitive: `--moss-2` blocks with a slow diagonal shimmer (1.6 s, linear). With reduced motion: static blocks, no shimmer. Skeletons have `aria-busy="true"` on the container and a visually hidden "Loading…" label.

| Screen | Skeleton |
| --- | --- |
| `/map` | Map area as a faint grid of cell squares over `--ink` with a soft pulse; layer toggle pills; bottom sheet handle with 3 row placeholders |
| `/species/[slug]` | Harvest banner bar; parchment sheet with catalogue-number chip, two title lines, round seal outline, label block (5 short lines), breakdown bars (6), mini-map square |
| `/priorities`, `/search` | 10 rows: number chip, two text lines, level pill |
| `/scan` result | Portal circle with the rotating ring; 3 candidate rows below |
| Cell bottom sheet | Header line + 6 species rows |
| `/about` | Heading + paragraphs blocks |
| Landing | The intro loader replaces the skeleton on `/` |

### Accessibility

- All colour-coded things also have an icon and a text label.
- Focus ring: 2 px `--chlorophyll`, offset 2 px.
- Map: list alternative for every map view (cell sheet and priorities), labelled controls.
- Touch targets ≥ 44 px. Greek and English text both fit (test long Greek strings).

# ==== FILE: docs/SUBMISSION.md ====
## Submission

**Deadline:** Sunday 8 November 2026. Rules: 11:00 CET; Devpost schedule: 11:00 EET. Use the earlier one: **Sunday 11:00 Greek time is the absolute last minute. Submit Saturday night.**

Every submission needs (official rules): Devpost project page · public GitHub repo · README/documentation · pitch video (max 10 min) · presentation (max 10 slides). Teams of 2–5; every member listed on Devpost.

### README checklist (`README.md` at repo root)

- [ ] What Chloris is (one paragraph) + live demo URL + QR image
- [ ] Track: 3 — Biodiversity & Sustainability; the question it answers
- [ ] Screenshots / GIF
- [ ] How it works: pipeline diagram, risk score formula with the weights from `scoring.yaml` and why (science lead's justification)
- [ ] Data sources table with versions, licences, citations, **GBIF download DOI**
- [ ] How to reproduce: pipeline setup, raw downloads, `python -m chloris.run --step all`, notebook
- [ ] How to run the web app locally + env vars
- [ ] **What we built vs. pre-existing:** our pipeline, scoring, app code, design; reused libraries, datasets and the Pl@ntNet API (listed)
- [ ] **Limitations:** sampling bias and how we corrected for it; GBIF records ≠ true presence/absence; most species not IUCN-assessed; identification errors; WCUPS use flags are not efficacy evidence; 10 km generalisation; uses reviewed only for featured species
- [ ] **Not medical advice** statement
- [ ] Traditional knowledge: provenance and attribution of uses (EMA monographs, WCUPS), no undocumented community knowledge collected
- [ ] **AI use disclosure:** Claude (Anthropic) and Claude Code were used for planning, code generation and documentation; the team reviewed and is responsible for all output
- [ ] Team members and roles
- [ ] Licence for our code (e.g. MIT) and copyright "© 2026 Andromachossp and the Chloris team"

### Video (max 10 min) — suggested script

1. Problem (45 s): Greek medicinal plants under pressure; the track lead's question.
2. Data and method (2 min): WCVP + WCUPS → all Greek medicinal plants; GBIF records → cells; risk score and its parts; sampling-bias correction; show the notebook.
3. Demo (4 min): landing → install via QR → map hotspots → tap a hotspot → species card with breakdown and Then/Now → scan a real plant → harvest decision + substitute → airplane mode → sighting queued → back online, synced.
4. Results (1 min): real numbers from `meta.json` (species, endemics, at-risk, hotspots outside Natura 2000).
5. Limitations (1 min) and future (1 min): native offline app, sensors and fire alerts, expert verification, range-shift models.

### Slides (max 10)

1. Title + QR · 2. Problem · 3. Question & users · 4. Data · 5. Method & risk score · 6. Results (map + numbers) · 7. Prototype (3 screenshots) · 8. Limitations & responsible use · 9. Impact & future · 10. Team & thanks.

# ==== FILE: docs/FLUTTER_PHASE2.md ====
## Phase 2 — Flutter app (only after the web submission is safe)

Goal: a native Android app (APK shared by QR) with stronger offline use. It reuses everything except the UI.

**Reused as-is:** `web/public/data/*` (bundled as assets and updated from the deployed URL when online), the deployed `/api/identify` route (so the Pl@ntNet key stays on the server), the Firestore `sightings` collection and rules.

**Packages:** `flutter_map` (+ `flutter_map_tile_caching` for offline tiles), `image_picker`, `geolocator`, `firebase_core`, `cloud_firestore` (offline persistence on by default), `firebase_auth` (anonymous), `http`, `hive` or `isar` for the scan queue, `flutter_localizations` (EL/EN).

**Screens:** same as the web app (Map, Scan, Species, Priorities, Search, Sightings, About), same tokens and fonts from DESIGN.md, skeleton loaders with the `shimmer` package (disabled when reduced motion is on).

**Deliverable:** `flutter/` folder in the repo, release APK attached to a GitHub release, QR to the APK on the Devpost page. iPhone users keep the PWA.

# ==== FILE: pipeline/config/scoring.yaml ====
```yaml
# Chloris risk score configuration.
# VERSION 0: placeholder weights. The science lead must review, change and justify these
# before the numbers are shown in the pitch. The justification goes in the README.
version: "v0-draft"

cell_size_deg: 0.1          # ~10 km grid used for maps, rarity and privacy

periods:
  old: [1950, 1999]         # historical period for the decline signal
  new: [2000, null]         # null = up to the current year
min_old_records: 10         # fewer old records -> decline = "not enough data"

# Points per component; must sum to 100.
weights:
  iucn: 35
  endemic: 15
  rarity: 15
  decline: 15
  unprotected: 15
  fire: 5

# Fraction of the IUCN weight per category (NE/DD = unknown, small weight).
iucn_fraction:
  CR: 1.0
  EN: 0.8
  VU: 0.6
  NT: 0.35
  LC: 0.0
  DD: 0.2
  NE: 0.2

rarity_cells_cap: 150       # species in >= this many cells get 0 rarity points
decline_full_at: 0.25       # ratio at or below this gets the full decline weight
fire_years: 10              # burnt areas from the last N years

at_risk:
  iucn: [CR, EN, VU]
  score_threshold: 55

levels:                     # score thresholds for labels
  moderate: 25
  high: 45
  critical: 65

hotspot:
  max_protected_fraction: 0.5   # a cell is a hotspot if it has an at-risk species and is < 50% protected
```

# ==== FILE: pipeline/config/featured_species.csv ====
```csv
scientific_name,name_el,name_en,uses_en,uses_el,ema_status,ema_url,harvest,substitutes,reviewed_by,notes
Sideritis scardica,Τσάι του βουνού,Greek mountain tea,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Sideritis raeseri,Τσάι του βουνού,Mountain tea,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Origanum vulgare,Ρίγανη,Oregano,,,unknown,,unknown,,,DRAFT - Greek oregano is subsp. hirtum; science lead to verify
Origanum dictamnus,Δίκταμο,Cretan dittany,,,unknown,,unknown,,,DRAFT - Cretan endemic; science lead to verify
Salvia fruticosa,Φασκόμηλο,Greek sage,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Thymbra capitata,Θυμάρι,Conehead thyme,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Matricaria chamomilla,Χαμομήλι,Chamomile,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Hypericum perforatum,Βαλσαμόχορτο,St John's wort,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Mentha pulegium,Φλησκούνι,Pennyroyal,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Lavandula stoechas,Αγριολεβάντα,French lavender,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Pistacia lentiscus,Σχίνος,Mastic tree,,,unknown,,unknown,,,DRAFT - science lead to verify and complete
Orchis mascula,Σαλέπι,Early purple orchid,,,unknown,,unknown,,,DRAFT - salep orchids are linked to illegal trade; science lead to verify
```

# ==== FILE: pipeline/requirements.txt ====
```text
pandas>=2.2
pyarrow>=15
geopandas>=1.0
shapely>=2.0
pyproj>=3.6
pyogrio>=0.9
requests>=2.32
pygbif>=0.6
pyyaml>=6.0
python-dotenv>=1.0
tqdm>=4.66
rapidfuzz>=3.9
matplotlib>=3.8
jupyter>=1.0
```

# ==== FILE: pipeline/.env.example ====
```bash
# Copy to pipeline/.env (never commit .env)
GBIF_USER=
GBIF_PWD=
GBIF_EMAIL=
```

# ==== FILE: web/.env.example ====
```bash
# Copy to web/.env.local for local dev and add the same values in Vercel.
# Server only (never prefix with NEXT_PUBLIC_):
PLANTNET_API_KEY=

# Firebase web config (public by design; security comes from firestore.rules):
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Production URL, used for the install QR code:
NEXT_PUBLIC_SITE_URL=
```

# ==== FILE: web/firestore.rules ====
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sightings/{id} {
      allow read: if true;

      allow create: if request.auth != null
        && request.resource.data.keys().hasOnly(
             ['slug', 'scientificName', 'confidence', 'note', 'lat', 'lng',
              'generalised', 'uid', 'createdAt', 'capturedAt', 'verified'])
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.verified == false
        && request.resource.data.createdAt == request.time
        && request.resource.data.lat is number
        && request.resource.data.lng is number
        && request.resource.data.lat >= 34.5 && request.resource.data.lat <= 42.0
        && request.resource.data.lng >= 19.0 && request.resource.data.lng <= 30.0
        && request.resource.data.generalised is bool
        && (request.resource.data.note == null
            || (request.resource.data.note is string && request.resource.data.note.size() <= 280));

      allow update, delete: if false;
    }
  }
}
```

# ==== FILE: .gitignore ====
```text
# Secrets
.env
.env.local
.env.*.local
pipeline/.env

# Pipeline
pipeline/raw/*
!pipeline/raw/.gitkeep
pipeline/work/
pipeline/.venv/
__pycache__/
.ipynb_checkpoints/

# Web
web/node_modules/
web/.next/
web/out/
web/public/sw.js
web/public/sw.js.map
web/public/swe-worker-*.js
.vercel

# OS
.DS_Store
```

---

End of master prompt. Start with Phase 0 now.
