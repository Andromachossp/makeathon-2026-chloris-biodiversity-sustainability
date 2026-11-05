# HANDOFF — Chloris (EthnoHack 2026, Track 3)

Snapshot written Thursday 5 Nov 2026, about 02:00 Greek time. Use it to continue the project if the previous AI session or account ran out of usage. **Verify anything marked "unknown" before relying on it.**

## 1. The project in one paragraph
**Chloris** is an installable phone app (Next.js PWA) that maps where Greece's native medicinal plants grow, scores which are at risk, identifies plants from a photo (Pl@ntNet), lets people save sightings offline, and shows whether to harvest or what to use instead. Track 3: Biodiversity & Sustainability. Team name = app name = **Chloris**. The developer is Andro (GitHub: Andromachossp). The science lead is a PhD environmental-education teacher on the team. Other teammates handle the pitch.

**DEADLINE: submit Saturday 7 Nov 2026 night. Absolute last minute: Sunday 8 Nov, 11:00 Greek time.**

## 2. Where everything is
- Repo (public): https://github.com/Andromachossp/makeathon-2026-chloris-biodiversity-sustainability — branches `main` and `dev`. Work on `dev` and `feature-*` branches.
- Local folder on Andro's Mac: `~/Development/Projects/Major Projects/chloris/`
- Read first, in this order: `CLAUDE.md` (hard rules) → `PRD.md` → `docs/TASKS.md` → the doc for the area you touch (`docs/ARCHITECTURE.md`, `DATA_PIPELINE.md`, `DATA_MODEL.md`, `WEB_APP.md`, `DESIGN.md`, `SUBMISSION.md`, `FLUTTER_PHASE2.md`).
- `MASTER_PROMPT.md` is the original all-in-one prompt (the separate files are the source of truth if they differ).
- Stack: Next.js 16 (App Router, TypeScript, Tailwind v4) in `web/`; Python pipeline in `pipeline/`; MapLibre (react-map-gl) with OpenFreeMap tiles; Firebase Firestore + Anonymous Auth; Serwist for offline; Pl@ntNet API via server route `/api/identify`; Vercel hosting (root directory `web`); Three.js/GSAP/Lenis only on the landing page `/`.
- Commands: pipeline `cd pipeline && source .venv/bin/activate && python -m chloris.run --step all`; web `cd web && npm run dev` / `npm run build` / `npm run validate-data`.

## 3. Hard rules (from CLAUDE.md — do not break)
1. **Never invent data.** No made-up species, uses, IUCN categories, coordinates, counts or citations. Missing data shows "not enough data" / "not reviewed yet". Missing stays `null`, never 0.
2. **Not medical advice.** Uses are documented information with an evidence level; no dosing; the notice appears wherever uses are shown.
3. **Protect threatened plants.** Public data is aggregated to 0.1° (~10 km) cells; at-risk sightings are rounded to 0.1° before saving.
4. **Science decisions belong to the science lead:** weights and thresholds live in `pipeline/config/scoring.yaml`; curated uses/harvest rules/substitutes in `pipeline/config/featured_species.csv`; review flags in `pipeline/config/review_overrides.csv`. Don't change them silently; propose changes.
5. **Secrets:** `PLANTNET_API_KEY` server-side only (`/api/identify`); GBIF credentials only in `pipeline/.env`. Never commit `.env*`, `raw/` or `work/`. Never paste keys into chats.
6. **Performance/UX:** skeleton screens (no spinner-only loading); Three.js only on `/`; MapLibre only on `/map`.
7. **Accessibility:** risk and harvest states use icon + text, never colour alone; respect `prefers-reduced-motion`. IUCN `NE` must read "Not assessed" and never look like a low-risk category.
8. **Bilingual:** every UI string goes through the EL/EN i18n dictionaries.
9. **Licences/attribution** for every dataset, API and library in the README and `/about`.

## 4. Status

### Done
- **Phase 0 (scaffold):** Next.js shell, tab bar, EL/EN switch, skeleton screens, i18n, design tokens, Firestore rules (`web/firestore.rules`).
- **Phase 1 (catalogue):** Kew WCVP (download of 4 Nov 2026): 6,081 native Greek species (areas GRC, KRI, EAI), 1,293 endemic. WCUPS (World Checklist of Useful Plant Species, DOI 10.5063/F1CV4G34) exists only as a 689-page PDF; it was parsed by `pipeline/chloris/wcups.py` (40,293 rows vs 40,292 stated; 26,663 medicinal `ME` vs 26,662 stated; method and limits in `pipeline/WCUPS_EXTRACTION.md`). **Final medicinal list: 1,386 species** (1,336 matched by IPNI id, 50 by name only). `ME` = "Medicines (human and veterinary)", confirmed from the PDF legend (p. 4).
- **GBIF download:** 333,393 records, DOI 10.15468/dl.g7nrxe (zip is in git-ignored `pipeline/raw/gbif/`). 1,375 of 1,386 species have usable keys (list of 11 unmatched in `work/gbif_unmatched.csv`).
- **Phase 2 (steps 4, 5, 6, 8, 9):** 299,438 records kept across 1,325 species; 2,134 occupied 0.1° cells; effort totals N_old = 157,335 and N_new = 540,831; Natura 2000 (vector, version end 2024, EEA, CC BY 4.0) joined, 446 Greek sites, 30.3% of records inside a site; 47 species have no records inside any site; scoring and export work; `npm run validate-data` passes (1,386 species, 2,134 cells, 1,325 occ files).
- **Flags** (`pipeline/chloris/flags.py`): 32 `gbif_synonym_match`, 11 `gbif_no_match`, 4 `gbif_shared_key` (rule: only the GBIF-accepted species of a shared-key pair gets the records), 50 `name_only_match`, `native_status_check` on *Crocus sativus*.
- **UI v1:** real landing (Three.js particles), map, priorities list and species pages exist. Bundle check passed.
- Notebook `pipeline/chloris_pipeline.ipynb` covers steps 1–3.

### Not done / unknown (check with `git status`, `git log`, and the Vercel dashboard)
- **UNKNOWN:** whether `web/public/data/` has been committed and pushed (it was held back as preliminary), whether `dev` is pushed, and whether the Vercel deploy shows data. Without the data files a deployed site shows empty screens.
- **Placeholder routes:** `/scan`, `/search`, `/sightings`, `/about`. **`/scan` is a never-cut feature: build it next.**
- Fire data (step 7) skipped; Phase 2 notebook cells missing; real-phone testing and PWA install untested; Greek strings never reviewed by a Greek speaker; QR code shows `localhost` until `NEXT_PUBLIC_SITE_URL` is set; map has no keyboard way to pick a cell.
- Firestore security rules: **unknown** whether they are published (paste `web/firestore.rules` into Firebase → Firestore → Rules → Publish; or `firebase deploy --only firestore:rules`).

## 5. Open decisions for the science lead
1. Keep *Crocus sativus* (cultivated saffron, listed as native by WCVP)?
2. The 32 species matched to GBIF synonym records: keep flagged, or review first?
3. **Minimum-records rule:** the priorities list is dominated by species with one record (sampling artefact). Placeholder proposal: fewer than 5 records shows "not enough data" and is excluded from ranking. Make it a setting in `scoring.yaml`.
4. `scoring.yaml` gives NE (not evaluated) 0.2 and LC 0. Proposal: NE gets no points (component left out and weights rescaled).
5. Weights themselves (placeholders: iucn 35, endemic 15, rarity 15, decline 15, unprotected 15, fire 5). Only 8 species have an IUCN rating of NT or worse, so the score leans on endemism, rarity, decline and protection. State this openly in the README.
6. *Origanum dictamnus* scored low (23) in the first run, before Natura was joined. Re-check; don't tune weights to force a result.
7. Decline is null for 623 species (too few old records). Document in Limitations.

## 6. Remaining work, in priority order
1. Verify and push `dev`; commit `web/public/data/` (preliminary) with a visible "preliminary scores" notice; confirm the Vercel deployment shows real data on a phone. Set `NEXT_PUBLIC_SITE_URL` (Vercel and `.env.local`).
2. Apply the minimum-records placeholder (Section 5, item 3).
3. **Build `/scan`:** camera, `/api/identify` with Pl@ntNet, result card, offline queue (idb-keyval), sighting saved to Firestore (rounded to 0.1° if at risk). Then `/sightings`, `/search`, `/about` (licences and attributions).
4. **Design fixes (cheap first):** Andro finds the UI too green and the particle hero ugly. Do in this order and stop when budget runs out: (a) swap the colour tokens: ink-navy base (`#0D1220` / `#151B2E` / `#232B45`), warm text (`#F4EFE6`), wildflower accents poppy `#F0533A`, saffron `#F6B93B`, lavender `#9B8CFF`, Aegean `#2EA8D8`, green only as a small "OK" accent; (b) map: no cell outlines, colour-blind-safe warm ramp for risk, separate cool ramp for richness, Natura 2000 as cyan dashed outline; (c) replace the particle hero with a clean hero and big saffron numerals; (d) only if budget remains: a Three.js instanced 3D landscape of the real cells, a 3D map toggle, and species-card score breakdown bars with one colour per factor.
5. Science-lead decisions applied; rerun steps 8 and 9 and recheck the top-20 table.
6. **Submission package (see Section 7):** complete README, demo video, slides, final deploy, QR code.
7. Optional: fire data (EFFIS/FIRMS) into `pipeline/raw/fire/`; Flutter phase (`docs/FLUTTER_PHASE2.md`) is only if time allows and is probably cut.

## 7. Submission requirements (organisers' official guides)
- **Repo name must follow** `makeathon-2026-[team-name]-[challenge-name]` (ours is above). Public, with README and `.gitignore`. Add every teammate as a collaborator (Write or Admin).
- **README (mandatory) must include:** project description (chosen challenge and the problem), technologies (languages, libraries, frameworks), execution instructions (install and run), **API key setup** (where each key is created, how it is stored locally, how the app uses it), and screenshots/demo/video link. Also: data sources and licences, risk-score formula and weights with the science lead's justification, what we built vs. reused, limitations, responsible-use notice, **AI-use disclosure** (Claude / Claude Code used for planning, code and docs, reviewed by the team), team.
- Use frequent, clear commits and branches (`dev`, `feature-*`); no large files in git (link externally); no secrets, no `.env`; the project must run from the README instructions on a clean clone.
- **Demo video:** 2–3 minutes, MP4/MOV/WEBM, 1280×720, ideally under 100 MB, audio not required (the team narrates live). Structure: how it works in practice, key features, optional example scenario. QuickTime screen recording is enough on a Mac.
- Upload video and presentation to the platform the organisers indicate.
- Free perks for participants: Aitho (pitch rehearsal, free until 31 Dec), Anakin (1 month free). Hackathon-hosted WCVP API: `wcvp.ethcstwin.di.uoa.gr:65000/docs` (not the official service; fallback only).

## 8. Accounts and keys (status only — no secrets here)
- GBIF account: created, credentials in `pipeline/.env` (git-ignored).
- Firebase project: created, Firestore (Standard edition, production mode, European location) and Anonymous Auth enabled; web config in `web/.env.local` and Vercel as `NEXT_PUBLIC_FIREBASE_*` (these are public, not secret). If sign-in fails on the live site, add the Vercel domain under Firebase → Authentication → Settings → Authorized domains.
- Pl@ntNet API key: obtained; `PLANTNET_API_KEY` in `web/.env.local` and Vercel (Sensitive on, no `NEXT_PUBLIC_` prefix). Free tier has a daily limit, so avoid test loops.
- Vercel: project imported from the repo with Root Directory `web`. After changing env vars, redeploy.
- Check what `web/.env.example` lists for the exact variable names; `pipeline/.env.example` lists the GBIF names. Never put real values in `.env.example` files (they are tracked by git).

## 9. Working with Andro
- He is a first-year Digital Systems student (University of the Peloponnese) and the only developer. He writes quickly and informally and may have typos ("gleb" meant WebGL).
- He wants short, concrete steps; give exact commands and say what to check. Don't paste or ask for key values.
- Usage budget: **his weekly Claude limit was about 86% used with a reset on Monday 9 Nov at 8 PM, after the deadline.** Keep jobs narrow, avoid extra screenshots, use Sonnet for building and Opus only for one targeted review, and use `/clear` between tasks. A final read-only review pass on Friday or Saturday is worth more than extra features.
- He wants the UI to look distinctive (cinematic, WebGL landing, skeleton screens, multi-colour), not a generic green dashboard.
- Rest matters: it was 2 AM when this was written and the team is working across several late nights.
