# AGENTS.md — Chloris

Chloris is our EthnoHack 2026 (Track 3: Biodiversity & Sustainability) project: an installable phone app (Next.js PWA) that maps where Greece's medicinal plants grow, scores which are at risk, identifies plants from a photo and tells people whether to harvest or what to use instead.

**Deadline: submit Saturday 7 November night. Absolute last minute: Sunday 8 November, 11:00 Greek time.**

## Read before working
`PRD.md` → `docs/TASKS.md` (current phase) → the doc for the area you touch:
`docs/ARCHITECTURE.md` · `docs/DATA_PIPELINE.md` · `docs/DATA_MODEL.md` · `docs/WEB_APP.md` · `docs/DESIGN.md` · `docs/SUBMISSION.md` · `docs/FLUTTER_PHASE2.md`

## How to work
- Follow `docs/TASKS.md` phase by phase. Finish a phase's checkpoint, commit, report, then continue.
- Prefer working software over polish: P0 before P1 before P2. If time is short, cut using the priorities in PRD.md, never the risk score, the map or the scan flow.
- Small, focused commits with clear messages. Never commit secrets, `raw/` data or `.env` files.
- When a fact about an external API or library might have changed (Next.js, Serwist, MapLibre, react-map-gl, Pl@ntNet, GBIF), check the current docs before coding instead of guessing.
- When something needs a human (accounts, keys, manual downloads, phone tests, science decisions), say exactly what Andro needs to do and continue with whatever doesn't depend on it.

## Hard rules
- **Never invent data.** No made-up species, uses, IUCN categories, coordinates, counts or citations. If data is missing, show "not enough data" / "not reviewed yet" and log it.
- **Not medical advice.** Uses are documented information with an evidence level; every uses section shows the notice. No dosing.
- **Protect threatened plants.** Public data is aggregated to 0.1° cells. At-risk sightings are rounded to 0.1° before saving.
- **Science decisions belong to the science lead.** Weights and thresholds live in `pipeline/config/scoring.yaml`; curated uses, harvest rules and substitutes live in `pipeline/config/featured_species.csv`. Don't change them silently; propose changes in your report.
- **Licences and attribution** for every dataset, API, image and library (README + `/about`).
- **Secrets:** `PLANTNET_API_KEY` only on the server (`/api/identify`). GBIF credentials only in `pipeline/.env`.
- **Performance:** Three.js, GSAP and Lenis load only on `/`. App routes stay light. Every data-loading view has a skeleton screen matching its final layout; no spinner-only loading states.
- **Accessibility:** risk and harvest states always have icon + text, never colour alone; respect `prefers-reduced-motion`.
- **Bilingual:** every UI string goes through the i18n dictionaries (Greek and English).

## Commands (fill in as they are created)
- Pipeline: `cd pipeline && source .venv/bin/activate && python -m chloris.run --step all`
- Web dev: `cd web && npm run dev`
- Web build: `cd web && npm run build`
- Firestore rules: `cd web && firebase deploy --only firestore:rules`

## Copyright
Code © 2026 Andromachossp and the Chloris team.
