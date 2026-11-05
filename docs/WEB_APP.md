# Web app

**Stack:** latest stable Next.js (App Router, TypeScript strict) · Tailwind CSS · MapLibre GL via `react-map-gl/maplibre` · Serwist (`@serwist/next`) for the service worker · Firebase (Firestore + Anonymous Auth) · MiniSearch or Fuse.js for search · `idb-keyval` · `qrcode.react` · Three.js via `@react-three/fiber` + `@react-three/drei` (landing only) · GSAP + Lenis (landing only) · Vercel hosting.

Check the installed Next.js version against Serwist's docs. If Serwist needs webpack for the service-worker build, build with the webpack flag; don't fight the bundler.

## Routes

| Route | Purpose | Data | Priority |
| --- | --- | --- | --- |
| `/` | Cinematic landing, story, install QR | `cells.json` (for particles) | P1 |
| `/map` | Map with layers + cell bottom sheet | `cells.json`, `natura.geojson`, `fires.geojson`, `occ/<slug>.json`, Firestore | P0 |
| `/scan` | Camera → identify → result | `/api/identify`, `names.json`, `species.json` | P0 |
| `/species/[slug]` | Species card (herbarium specimen) | `species.json`, `occ/<slug>.json` | P0 |
| `/home` | First tab: one sentence and three big buttons (Scan a plant, What's near me, Explore the map) | none | P0 |
| `/plants` | Plants tab: type-ahead search (Greek, English, Latin; accent-insensitive) on top, ranked list below with Threatened / Only grows in Greece filters; plants with fewer than `min_records` records (verdicts.yaml) sit under "Not enough data yet" | `species.json`, `meta.json` | P0 |
| `/near` | What's near me: plants recorded in the user's generalised 10 km square (device-only location) | `cells.json`, `species.json` | P0 |
| `/priorities`, `/search` | Redirect to `/plants` | | |
| `/sightings` | My queued and synced sightings | IndexedDB, Firestore | P1 |
| `/about` | Data, method, scoring, limitations, credits, "not medical advice" | `meta.json` | P0 |
| `/api/identify` | Server route → Pl@ntNet | env `PLANTNET_API_KEY` | P0 |

`manifest.start_url = "/home"` so the installed app skips the landing page.

## App shell

- Bottom tab bar on phones: **Home · Scan · Map · Plants**; Scan is the raised button. Side rail on desktop. `/sightings` is reached from a small "My sightings" link under Plants and from the scan result.
- Top bar: language switch (EL/EN), offline indicator ("Offline — identification will run when you're back online").
- All data loaded through one cached client store (`lib/data.ts`) that fetches each file once, keeps it in memory and relies on the service worker for offline.

## `/map`

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

## `/scan`

1. Viewfinder screen (see DESIGN.md "portal"). `<input type="file" accept="image/*" capture="environment">` plus "Choose from gallery".
2. Resize in a canvas to max 1000 px, JPEG 0.8. Get GPS (`navigator.geolocation`, 10 s timeout, optional).
3. **Online:** POST `multipart/form-data` to `/api/identify`. Show the scan skeleton while waiting.
4. **Offline:** save to `pendingScans` in IndexedDB; toast "Saved. We'll identify it when you're online." A `useOnline` hook processes the queue on reconnect and notifies the user.
5. Result logic (thresholds are constants in `web/lib/scan.ts`: `CONFIDENCE_LIKELY_MIN = 0.70`, `CONFIDENCE_POSSIBLE_MIN = 0.40`), verdict first:
   - Score ≥ 0.70 → "Likely match". In our catalogue: verdict banner, common and Latin name, harvest advice (only if reviewed, else "not reviewed yet"), link to the plant page.
   - 0.40 to 0.70 → "Possible match: compare with the photos", with up to two Pl@ntNet reference photos (credited) and the other candidates.
   - Below 0.40 → "Not sure: try another photo (leaf, flower, whole plant)". Candidate names only: no verdict, no uses, no harvest content, no links, no save button.
   - Not in the catalogue → says so plainly and shows the Pl@ntNet name; a sighting can still be saved.
   - Always: "A photo match can be wrong. Check with an expert before using any wild plant."
   - "Save this sighting" asks for location only at that moment. Plants that may be at risk (verdict "Protect it" or at-risk) and plants not in the catalogue are rounded to a 0.1° square before saving; others to 0.001°. Sightings are stored on the device only (IndexedDB) for now; Firestore sync is not built yet.
   - "Try a sample photo": three CC0 / CC BY photos from Wikimedia Commons in `web/public/samples/` with their Pl@ntNet responses cached next to them, so samples never use the API quota. Credits on the page and on `/about`.
6. Matching order: POWO id → GBIF key → normalised name (incl. synonyms) via `names.json`.

## `/api/identify` (route handler, Node runtime)

- Accept `multipart/form-data` with `image` (≤ 5 MB, image/*) and optional `organ`.
- Forward to `https://my-api.plantnet.org/v2/identify/all?api-key=${PLANTNET_API_KEY}&nb-results=5&lang=en` with fields `images` and `organs` (`auto` by default). Check the current Pl@ntNet API docs for parameter names and the response shape before coding.
- Return `{ candidates: [{ name, score, commonNames, powoId, gbifKey }], remaining?: number }`.
- Errors: 4xx/5xx → `{ error: "identify_failed" }` with status; never leak the key. Simple per-IP rate limit (e.g. 10/min, in-memory).

## `/species/[slug]`

Order on the page:
1. Harvest banner (only if `curated.harvest` set, or `atRisk` → "Do not harvest: at-risk species"), with substitutes as chips.
2. Specimen header: catalogue number, scientific name (italic), authors, Greek and English names, family, endemic badge, IUCN badge, POWO link.
3. Risk: score ring + level label + breakdown bars (each component with a one-line explanation; nulls say "Not enough data").
4. Mini map of its cells with Then / Now toggle and first/last year.
5. Uses (featured): EN/EL text, EMA status badge + link, "Not medical advice" notice. Non-featured: "Recorded medicinal use (Kew WCUPS). Uses and harvest guidance not reviewed yet."
6. Data footnote: records, cells, sources; photo credit and licence.
- Client-rendered from the cached catalogue so every species works offline. `generateStaticParams` only for featured species (fast first load in the demo).

## `/priorities`

- Virtualised list sorted by risk; filters: at-risk only, endemic only, featured only, family, IUCN, harvest. Row: catalogue number, names, risk level chip (icon + text), score.

## Offline and install (Serwist)

- Precache: app shell, route JS/CSS, fonts, icons, `species.json`, `names.json`, `cells.json`, `meta.json`.
- Runtime: `occ/*.json` and GeoJSON → StaleWhileRevalidate; OpenFreeMap tiles/styles/glyphs/sprites → CacheFirst with expiration (e.g. 3000 entries, 30 days); `/api/*` → NetworkOnly.
- Offline fallback page for uncached navigations.
- Manifest: name "Chloris", short_name "Chloris", theme/background from DESIGN.md, icons 192/512 + maskable, `display: standalone`, `start_url: /map`, `lang: el`.
- Install UX: `beforeinstallprompt` → "Install Chloris" button (Android/desktop Chrome). iOS Safari (no prompt) → one-time hint "Tap Share → Add to Home Screen". Hide both when `display-mode: standalone`.
- Landing and `/about` show a QR code (`qrcode.react`) of the production URL.

## Firebase

- `lib/firebase.ts`: `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`, `signInAnonymously` on first save.
- Deploy `firestore.rules` from DATA_MODEL.md (`firebase deploy --only firestore:rules`).

## Internationalisation

- `lib/i18n/{el,en}.ts` dictionaries + a small context provider; default from `navigator.language`, persisted in `localStorage` (wrapped in try/catch). Every UI string goes through it. Species content uses `nameEl`/`usesEl` when present, else English with a small "EN" tag.

## Safety and placement rules (enforced by `npm run check-safety`, part of `npm run validate-data`)

1. **One standard notice**, `t.safety.notice` (EN and EL), rendered by `<SafetyNotice />`: "Chloris is for information only. It is not medical advice and does not replace a doctor or prescribed medicine. We give no doses. Take extra care in pregnancy, while breastfeeding, and with children. Ask a pharmacist or doctor before using any wild plant." Shown wherever uses or evidence appear (the species page evidence section, scan results, near-me results), on Home, on `/about` and in the landing footer. There is no other "not medical advice" wording.
2. **Placement:** uses, traditional preparations, studies and evidence cards appear only on their species page, each card with its kind label. They are never shown in lists, search, map sheets, scan or near-me results, and search indexes names only. No screen pairs a plant with a health condition outside its own page.
3. **Sample-photo results** are labelled "Cached example result" with where and when the Pl@ntNet response was fetched (date and API version) and a Pl@ntNet credit, plus the photo's own licence credit.
4. **Featured species** (chosen by the science lead): Greek name and traditional preparations are shown when filled in (`featured_species.csv`), otherwise "Not reviewed yet".

## Quality bar

- TypeScript strict, ESLint clean, no `any` in data types.
- Lighthouse on `/map` (mobile): Performance ≥ 80, Accessibility ≥ 95, PWA installable.
- No layout shift when skeletons are replaced (CLS < 0.1).
- Test on a real Android phone and a real iPhone before Saturday.
