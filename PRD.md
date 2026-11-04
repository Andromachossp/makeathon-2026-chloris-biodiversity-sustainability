# Chloris — Product Requirements Document

**Event:** EthnoHack 2026 · Track 3: Biodiversity & Sustainability
**Version:** 1.0 · 4 November 2026
**Owner (code):** Andro (Andromachossp) · **Science lead:** PhD teammate (environmental education) · **Pitch:** whole team
**Hard deadline:** Sunday 8 November 2026. The rules say 11:00 CET; Devpost says 11:00 EET. Treat **Sunday 11:00 Greek time** as the last minute and **submit Saturday night**.

---

## 1. One-line summary

Chloris is an installable phone app that shows where Greece's medicinal plants grow, which ones are at risk and why, identifies plants from a photo, and tells people whether a plant is safe to harvest or what to use instead.

It answers the Track 3 question in the track lead's own words: *"Where do medicinal plants grow, which are at risk, and how do we keep them?"*

## 2. Problem

- Greece has one of the richest floras in Europe and many endemic medicinal plants (mountain tea, Cretan dittany, oregano, sage, salep orchids).
- Overharvesting, illegal trade, wildfires and habitat loss threaten many of them.
- The data to see this exists (GBIF sightings, Kew's World Checklist, IUCN, Natura 2000, fire data) but it is scattered, technical and not usable by a forager, a hiker, a teacher or a local authority.
- People who pick wild herbs have no simple way to know: *is this plant threatened here, and what can I use instead?*

## 3. Users

| User | Need | What Chloris gives them |
| --- | --- | --- |
| Hiker / forager / herb collector | Know if a plant is safe to pick | Scan → species card → harvest rule + substitute |
| Teacher / environmental educator | Teach local flora and conservation | Atlas, species cards, hotspots for their region |
| Researcher / conservation body | See priorities and gaps | Ranked priorities, hotspots outside Natura 2000, decline signal, open data export |
| Local authority / park manager | Know where to act | Hotspot map, fire exposure, user sightings in their area |
| Hackathon judges | Try it in seconds | QR → installed app; public repo; reproducible notebook |

## 4. Goals and non-goals

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

## 5. Scope: features and requirements

Priorities: **P0** = must ship for the demo · **P1** = should ship · **P2** = stretch.

### 5.1 Species catalogue (the "database") — P0
- Built by the pipeline from WCVP + WCUPS: species **native to Greece** (WGSRPD level-3 areas GRC Greece, KRI Crete, EAI East Aegean Is.) **and** flagged with a medicinal use.
- Each species has: accepted name, synonyms, family, Greek and English names (where known), endemic-to-Greece flag, IUCN category, risk score + breakdown, decline ratio, record counts, protected share, fire share, map cells, photo (if licence allows), POWO link.
- **Featured species** (curated by the science lead, ~10–30): also uses summary, EMA monograph status and link, harvest rule (`safe | careful | do-not-harvest`), substitutes, reviewer.
- Non-featured species show automatic data and "Uses and harvest guidance not reviewed yet".
- Search by Greek, English or scientific name (accent-insensitive, typo-tolerant).

### 5.2 Risk score — P0
- Weighted sum of components, each 0–max, total 0–100. Weights live in `pipeline/config/scoring.yaml` so the science lead can change them without touching code.
- Components: IUCN category, Greek endemism, rarity (occupied 10 km cells), decline (sampling-effort corrected), share outside Natura 2000, share in burnt areas (P1).
- Missing data is shown as missing, never as zero ("Not enough historical records").
- Every card shows the breakdown, so the score is explainable.

### 5.3 Map — P0
- Base map of Greece (OpenFreeMap vector tiles).
- Layers (toggle): Medicinal diversity (species per cell), Risk hotspots, Natura 2000, Burnt areas (P1), Selected species cells, User sightings (unverified).
- Tap a cell → bottom sheet listing species there, sorted by risk.
- Threatened species are only ever shown at ~10 km cell resolution.

### 5.4 Priorities — P0
- Ranked list of species by risk score, filterable (endemic only, featured only, family, harvest rule). Each row links to the card.

### 5.5 Scan (camera) — P0
- Photo from camera (`capture="environment"`) or gallery, resized client-side to ~1000 px.
- Server route sends it to Pl@ntNet; the key never reaches the browser.
- Confidence ≥ 0.3 and name in Chloris → open species card with a big harvest decision banner (threatened → "Do not harvest" + substitute).
- Confidence < 0.3 → ask for a flower or leaf photo; show the top 3 candidates.
- Not in Chloris → "Not in Chloris yet — add it as a new plant?" → saves a sighting with the Pl@ntNet name.
- **Offline:** photo + GPS are queued on the device and identified automatically when back online.

### 5.6 Sightings — P1
- Save a sighting (species or "unknown" + optional note) with GPS. Threatened species are rounded to 0.1° before saving.
- Works offline (Firestore persistent cache + IndexedDB photo queue); syncs automatically.
- Shown on the map as an "unverified" layer; `verified` is set by a reviewer (manually in Firestore for the hackathon).
- No photos stored on the server (privacy, quota).

### 5.7 Install and offline — P0
- PWA manifest, icons, service worker (Serwist).
- Desktop landing shows a QR code to open on the phone; Android gets the install prompt; iPhone gets an "Add to Home Screen" hint.
- Offline: app shell, species catalogue, search, cards, priorities, previously viewed map areas, sighting queue.

### 5.8 Landing and visual design — P1
- Cinematic landing page with a Three.js particle scene (particles form a leaf, then morph into the real hotspot cells over Greece), loading counter, huge condensed title, numbered navigation.
- Herbarium-specimen design language for cards (catalogue numbers, specimen labels).
- **Skeleton screens** for every view that loads data (map, cards, lists, scan result). No blank screens and no spinners as the main loading state.
- Respects `prefers-reduced-motion`; the 3D scene never loads on the app screens.
- Full design spec: `docs/DESIGN.md`.

### 5.9 Languages — P1
- Greek and English UI, switchable, Greek default when the phone is in Greek.

## 6. Data sources

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

## 7. Non-functional requirements

- **Performance:** app screens interactive in < 3 s on a mid-range phone over 4G. `species.json` gzipped < 1 MB. Per-species cell files loaded on demand. Three.js only on the landing route, dynamically imported.
- **Offline:** everything except identification works with no signal after first open.
- **Privacy:** no accounts (anonymous auth), no photos stored, threatened species locations generalised.
- **Accessibility:** WCAG AA contrast, keyboard and screen-reader labels, reduced-motion support, risk never shown by colour alone.
- **Reproducibility:** one notebook regenerates every data file from raw downloads; versions and DOIs recorded.
- **Honesty:** limitations visible in-app ("About the data") and in the README.

## 8. Success criteria (demo day)

1. A judge scans the QR and has Chloris installed in under 30 seconds.
2. The map shows real hotspots for Greece, and tapping one lists real species.
3. Scanning a real plant (e.g. oregano or sage) lands on its card with a harvest decision.
4. Airplane mode: the app still opens, search and cards work, a sighting is queued.
5. The notebook runs top to bottom and reproduces `web/public/data/`.
6. README covers sources, licences, method, limitations, what we built vs. reused, and AI use.

## 9. Risks

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

## 10. Timeline (remaining days)

| Day | Focus | Checkpoint |
| --- | --- | --- |
| Wed 4 Nov (night) | Repo, accounts, pipeline stages 1–3 | Greek medicinal species list exists |
| Thu 5 Nov | GBIF download, cells, decline, Natura, scores, export; app shell + map | Map shows real hotspots on the deployed URL |
| Fri 6 Nov | Cards, search, priorities, scan, sightings, offline, skeletons | Scan a real plant on a phone → card |
| Sat 7 Nov | Landing visuals, polish, README, slides, video, **submit** | Devpost submission confirmed |
| Sun 8 Nov | Buffer only (deadline 11:00 Greek time at the latest) | — |

Flutter (Phase 2) starts only after the Saturday submission is safe.

## 11. Future (slides only)

Native offline app with on-device identification · sensor network for real-time monitoring and fire prevention · expert verification workflow · climate-driven range-shift models · heritage-site plant networks · illegal-trade signals from market and customs data.
