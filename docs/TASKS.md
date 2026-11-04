# Build tasks

Work through the phases in order. Each phase ends with a **checkpoint**: run it, show the result, commit, then stop and report before starting the next phase. Tick boxes in this file as you go.

Andro does the manual steps marked 👤 (accounts, downloads, phone tests). Ask for them early; don't wait until they block you.

## Phase 0 — Setup (Wed night)

- [ ] 👤 GitHub repo `chloris` (public), Vercel project linked to `web/`, Firebase project (Firestore + Anonymous Auth), Pl@ntNet API key, GBIF account
- [x] Create the monorepo layout from ARCHITECTURE.md, `.gitignore`, `pipeline/.env.example`, `web/.env.example`
- [x] `pipeline/`: virtualenv + `requirements.txt`; package skeleton `chloris/` with `config.py` reading `config/scoring.yaml`
- [x] `web/`: create the Next.js app (TypeScript, Tailwind, App Router, ESLint), add design tokens, fonts, app shell with tab bar, i18n scaffold, `<Skeleton>` primitive, placeholder pages for every route
- [ ] Deploy the empty app to Vercel
- **Checkpoint:** deployed URL opens on a phone with the tab bar and skeletons on every route.

## Phase 1 — Species catalogue (Wed night → Thu morning)

- [x] Step 0 downloads: WCVP scripted; 👤 WCUPS, Natura 2000 (and fire data if possible) into `raw/`
- [x] Step 1 `wcvp.py`: Greek natives + endemism + synonyms
- [x] Step 2 `wcups.py`: medicinal filter (+ fallback path)
- [x] Step 3 `gbif.py`: backbone keys, IUCN, vernacular names (cached)
- [x] Notebook cells 1–3 with printed counts and a table of the first 20 species
- **Checkpoint:** report the number of Greek native species, endemic species, medicinal species, and match rates. Science lead sanity-checks a sample.

## Phase 2 — Occurrences, cells, scores, export (Thu)

- [x] Step 4: GBIF download request, poll, fetch, clean; effort totals; record DOI
- [x] Step 5: cells
- [ ] Step 6: Natura 2000 join + simplified `natura.geojson`
- [ ] Step 7: fire (P1; skip cleanly if no data)
- [x] Step 8: scores with sanity checks (histogram, top 20, known threatened species)
- [ ] Step 9: merge `featured_species.csv`, export all files to `web/public/data/`, size checks, `meta.json`
- [x] `web/lib/types.ts` matches DATA_MODEL.md; a tiny script validates the JSON against the types (zod)
- **Checkpoint:** file sizes, counts, top-20 table; commit the data files.

## Phase 3 — Map and catalogue screens (Thu → Fri morning)

- [ ] Data store `lib/data.ts` (fetch once, cache in memory)
- [ ] `/map`: base map, diversity layer, hotspots, Natura 2000, cell bottom sheet, species layer with Then/Now, locate me
- [ ] `/species/[slug]`: full specimen card + skeleton
- [ ] `/priorities` with filters, `/search` with accent-insensitive Greek/English/scientific search
- [ ] `/about` from `meta.json` (sources, DOI, weights, limitations, not medical advice)
- **Checkpoint:** on the deployed URL, tap a hotspot → species → card, on a phone.

## Phase 4 — Scan, sightings, offline, install (Fri)

- [ ] `/api/identify` with error handling and rate limit
- [ ] `/scan`: portal viewfinder, resize, GPS, result states (found / unsure / not in Chloris), portal transition to card with harvest banner
- [ ] Offline scan queue (IndexedDB) processed on reconnect
- [ ] Sightings: save with generalisation rules, Firestore offline cache, live layer on map, `/sightings` page
- [ ] `firestore.rules` deployed
- [ ] Serwist: precache, runtime caching, offline fallback, manifest, icons, install button, iOS hint, QR on `/about`
- **Checkpoint (👤 on real phones):** install from QR on Android and iPhone; scan a real plant → card; airplane mode → app opens, search and cards work, sighting queued, then syncs.

## Phase 5 — Landing and polish (Sat morning)

- [ ] Intro loader, WebGL particle story (leaf → Greece → risk), numbered menu, sideways panels, install section
- [ ] Reduced-motion / no-WebGL poster fallback
- [ ] Lighthouse pass on `/map` and `/`; fix CLS, contrast, labels
- [ ] Greek translation pass on every UI string
- [ ] P2 only if time: ASCII footer, species photos for all featured, fire layer polish
- **Checkpoint:** landing runs smoothly on a mid-range phone; app routes don't load Three.js (check the bundle).

## Phase 6 — Submission (Sat afternoon/evening)

- [ ] README complete (see SUBMISSION.md)
- [ ] Notebook rerun top to bottom with outputs saved
- [ ] Screenshots + screen recording for the video
- [ ] 👤 Devpost page, video, slides; submit Saturday night
- **Checkpoint:** Devpost shows "Submitted"; repo and demo open in a private window.

## Phase 7 — Flutter (only after submission is safe)

See FLUTTER_PHASE2.md.
