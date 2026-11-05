# MASTER PROMPT (FINAL SCOPE) — Chloris

You are the lead engineer for **Chloris** (EthnoHack 2026, Track 3: Biodiversity & Sustainability). Read this whole file, then `CLAUDE.md`, `HANDOFF.md` and `docs/TASKS.md`. **This file overrides the priorities in `docs/TASKS.md` where they conflict.** Do not redo finished work.

**Deadline: Sunday 8 Nov 2026, 11:00 Greek time. Our own target: submit Saturday 7 Nov night.**
**The jury looks at:** scientific relevance, innovation, technical implementation, data science quality, feasibility, impact, presentation. A small working thing beats a big unfinished one. Judges will mostly see: the live site on a laptop, the repo and README, a short demo.

## Working rules
- Budget is tight. Work in the stages below, **in order**. After each stage: run `npm run build` and `npm run validate-data`, commit, push, print a summary of at most 8 lines (done / not done / what I must do by hand), then **STOP and wait for me to say "continue"**.
- At most **one phone-width screenshot per stage**, and only if the stage changed the UI. No other screenshots.
- Keep `dev` deployable at all times. Never leave the build broken. Work on `dev` or `feature-*` branches; at the end merge into `main`.
- CLAUDE.md hard rules apply: never invent data; not medical advice, no dosing; protect threatened plants (0.1° / ~10 km, never jitter a point); secrets server-side only; skeleton screens, no spinner-only loading; Three.js only on `/`, MapLibre only on `/map`; icon + text, never colour alone; bilingual EL/EN through i18n; credit every dataset, API, image and library.
- Science decisions belong to the science lead. Weights and thresholds live in `pipeline/config/scoring.yaml`; curated content in `pipeline/config/featured_species.csv`, `review_overrides.csv` and `evidence.csv`. Use the placeholders below, make them config values, and flag them in your summary.
- Check current docs before using any API you are unsure of (Next.js 16, MapLibre, Pl@ntNet, Firebase, Serwist). If something needs a human, say exactly what and continue with the rest.

## Current state (verify with `git status` and `git log`)
Done: pipeline (1,386 medicinal native species, 2,134 cells, Natura 2000 joined, scores, exports, validation), UI v1 (landing with a 3D landscape, terrain map with flower pins and layer chips, priorities list, species pages), skeletons, i18n shell. Placeholders: `/scan`, `/search`, `/sightings`, `/about`. Unknown: whether `web/public/data/` is committed and pushed, and whether Vercel shows real data.

## Placeholder science values (config, science lead may change)
- Minimum records to rank a species: 5. Below it: "Not enough data yet", excluded from the top ranking.
- IUCN `NE` (not assessed): no risk points (component left out, weights rescaled), label "Not assessed yet".
- Verdicts: **Protect it** (risk level high or critical, or IUCN VU/EN/CR); **Handle with care** (moderate risk, or endemic to Greece); **Not known to be threatened** (low risk); **Not enough data yet** (null or below the record minimum). Thresholds read from config.
- Harvest advice ONLY for species with reviewed harvest rules in `featured_species.csv`; every other species shows "Harvest advice not reviewed yet". Never imply a plant is safe to pick or use.
- Scan confidence (Pl@ntNet score): >= 0.70 "Likely match"; 0.40 to 0.70 "Possible match: compare with the photos"; < 0.40 "Not sure: try another photo (leaf, flower, whole plant)". Below 0.40 show no uses and no harvest content.

## STAGE 0 — Ship what exists
1. Commit `web/public/data/` (preliminary) and `HANDOFF.md`, push `dev`. Add a small "Preliminary scores" notice in the app and on `/about`.
2. Scan the repo and git history for secrets (keys, passwords, `.env`). Confirm `.gitignore` covers them. Make sure `.env.example` files contain names only.
3. Confirm the production build passes with the data present. Tell me exactly which environment variables Vercel needs (names only), including `NEXT_PUBLIC_SITE_URL`, so I can set them.

## STAGE 1 — Plain words, verdict first, map fixes
1. Replace jargon in all UI, EL and EN, through i18n: Endemic → "Only grows in Greece"; IUCN VU/EN/CR → "Threatened" (category as a small detail); NE → "Not assessed yet"; Richness → "Plants recorded here"; Hotspots → "Medicinal plant hotspots"; Priorities → "Plants". Hide IDs like CHL-0038 from main views. Show the score only as a small detail labelled "prototype score". Draft the Greek yourself and list every Greek string in `docs/GREEK_REVIEW.md` for me to review.
2. Species rows and the species page lead with the coloured **verdict**, then one plain reason, then details (IUCN, endemic, Natura 2000 protected share, score breakdown as a stacked bar with one colour per factor, data-quality flags in plain words). Common name first (Greek in Greek mode if available, otherwise English), Latin name second in italics.
3. Apply the minimum-records rule in the Plants list and rankings.
4. Pipeline: keep Greek vernacular names only if they contain Greek characters, otherwise none; scale the risk-layer colour ramp to the 5th–95th percentile of cells with 5 or more species; re-export and validate.
5. Map: open framed on Greece (lat 34.5 to 41.8, lng 19.3 to 28.4) with the current pitch. Replace the dark numbered cluster badges: cluster only below zoom ~6.5, small radius, small translucent badges coloured by average risk with a small count, so the terrain shows. From zoom ~7 show individual flowers with `icon-allow-overlap: false` and scale the icon size with zoom. Collapse the legend into a small chip that opens on tap, with plain text: "Each flower is a 10 km area. Redder means higher average risk. Grey means not enough data yet." On phones it covers at most a third of the map.

## STAGE 2 — Scan and sightings (never cut)
1. `/scan`: camera on phones; on laptops a file upload (`<input type="file" accept="image/*" capture="environment">`) with drag and drop. Calls `/api/identify` (server side, `PLANTNET_API_KEY` never exposed).
2. Result card, verdict first, using the confidence thresholds above. Always one line: "A photo match can be wrong. Check with an expert before using any wild plant." If the plant is not in our 1,386-species catalogue, say so plainly. Handle errors, quota limits and offline with friendly messages.
3. "Try a sample photo": add 2 to 3 small sample images (under 200 KB each) of well-known Greek medicinal plants from Wikimedia Commons or GBIF with a clearly CC0 or CC BY licence. Verify each licence, show attribution on the page and in `/about`. Cache the Pl@ntNet response for the samples in the repo so the demo does not use the API quota. If no clearly licensed image is found, say so and skip it.
4. **Save this sighting** button on the result: writes to Firestore (anonymous auth, rules in `web/firestore.rules`). At-risk species are rounded to 0.1° before saving. If offline, queue locally (idb-keyval) and sync when online. A simple "My sightings" list under the Plants tab. No moderation screens, no map layer for sightings.

## STAGE 3 — Home and navigation
1. New first app tab **Home**: one sentence about what Chloris does and three big buttons: "Scan a plant", "What's near me", "Explore the map". Landing `/` stays as is (the landing links into the app).
2. Tabs: Home, Scan, Map, Plants. Plants = search box on top (type-ahead over Greek, English and Latin names) plus the ranked list with filters Threatened / Only grows in Greece. If a Greek name has no match, show: "We have Greek names for only some plants. Try the English or Latin name." Do not invent Greek names. Old routes `/search`, `/priorities` and `/sightings` redirect.
3. **What's near me:** ask for browser location, find the user's 0.1° cell, list the medicinal plants recorded there with their verdicts. Location stays on the device: never stored, never sent, only the generalised 10 km square is shown. Handle denied permission and no GPS with a friendly message and a link to the map. If this takes more than a small amount of work, ship a version that links to the map instead and say so.

## STAGE 4 — Judges' view: About, README, notebook, repo
1. `/about` (methods and honesty page): data sources with licences and versions (Kew WCVP download of 4 Nov 2026, WCUPS DOI 10.5063/F1CV4G34 with the PDF-extraction method and its limits, GBIF download DOI 10.15468/dl.g7nrxe, IUCN via GBIF, Natura 2000 vector version end 2024 (EEA, CC BY 4.0), OpenFreeMap/OSM, terrain tiles and attribution, Pl@ntNet, sample photo credits). The risk-score formula and weights (read from `scoring.yaml`), the sampling-effort-corrected decline signal, how missing data is handled, limitations (only 8 species with a threatened IUCN rating, decline null for 623 species, synonym and name-only matches flagged, preliminary weights), "not medical advice", and a short Nagoya Protocol and responsible-use paragraph.
2. Complete the README to the organisers' rules: project description (challenge and problem), technologies, install and run steps, **API key setup** (where each key is created, how it is stored locally, how the app uses it) for Pl@ntNet, GBIF and Firebase, screenshots or a demo link, data sources and licences, the risk score, what we built vs. reused, limitations, responsible use, **AI-use disclosure** (Claude and Claude Code used for planning, code and docs, reviewed by the team), team. Repo name: `makeathon-2026-chloris-biodiversity-sustainability`.
3. Finish the pipeline notebook (`pipeline/chloris_pipeline.ipynb`) with the Phase 2 cells and saved outputs. Make it readable for judges: short markdown explanations of each step and the key numbers.
4. Draft `docs/DEVPOST.md` (title, one-line tagline, description following problem → approach → results → impact, built-with list, links) from the real numbers only. List the screenshots we should capture for Devpost and the slides.
5. Repo hygiene: no large files, no secrets, no `.env`; a clean-clone test following the README (tell me exactly which steps you could not test); remove unused placeholder code.

## STAGE 5 — Evidence cards (only if time remains)
Species page section "What has been studied" for featured species only. New `pipeline/config/evidence.csv` (columns: slug, kind, title, finding, limitations, plant_part, preparation, design, source_type, source_id, source_url, verified_at, verification, specialist_review, safety_note), export to `web/public/data/evidence/{slug}.json` loaded lazily with a skeleton. kinds: traditional_use | human_research | animal_or_lab | review | regulatory_monograph. Fill only 2 species, only with sources you actually fetched and read in this session (PubMed abstract or EMA/HMPC monograph). Write `finding` and `limitations` in your own words, neutral, at most 2 sentences each, no copied abstract text, include mixed or negative results. Use "unknown" where the source is silent. `verification` is "checked against linked source" only if you fetched it; `specialist_review` stays "pending". Show cards with a kind label, the finding, a highlighted Limitations box, a collapsed "Study and source details" and a "Read the original source" link. If no entries: "Uses not reviewed yet". Add a safety note above the cards when present. Keep the not-medical-advice line at the top of the section. No dosing. List which entries you verified and which species you left empty.

## STAGE 6 — Final QA
1. Merge `dev` into `main`, tag `v1.0-submission`, push. Confirm the Vercel production deployment shows real data.
2. Run the demo path end to end on the production URL: landing → Home → Map → tap a flower → species page with verdict and reason → Scan with a sample photo → result with verdict → About. Report any step that fails.
3. Accessibility pass (contrast of at least 4.5:1, icon + text for risk states, keyboard use of the Plants list as an alternative to the map, reduced-motion fallbacks) and a Greek-fit check.
4. Give me a short checklist of manual tests to do on a real phone (install to the home screen, camera scan, location prompt, offline sighting) and a list of known issues.

## Do NOT build
Fire data, climate range shifts, illegal-trade signals, the Flutter app, a sightings map layer, moderation or verification screens, Greek names for all species, advanced offline sync, extra landing or 3D effects, further redesign beyond the above.

## Definition of done
The live site on the production URL supports the demo path above; the repo passes a clean-clone test; the README, `/about` and the notebook are complete and honest about limits; `docs/DEVPOST.md` is drafted; nothing in the repo contains a secret.
