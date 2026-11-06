# Chloris

> Where Greece's medicinal plants grow, which are at risk, and how we keep them.

**EthnoHack 2026 · Track 3: Biodiversity & Sustainability**

_This README is a template. Claude Code completes every section in Phase 6 using `docs/SUBMISSION.md`. Remove this line when done._

## Try it
- Live app: `TODO: production URL` (scan the QR on a phone to install)
- Video: `TODO`
- Slides: `TODO`

## What it does
`TODO`

## How it works
`TODO: pipeline diagram, data → cells → risk score → app`

### Risk score
`TODO: formula, weights from pipeline/config/scoring.yaml and the science lead's justification`

## Data sources and licences
`TODO: table incl. WCVP version, WCUPS citation, GBIF download DOI, IUCN via GBIF, Natura 2000, fire data, EMA monographs, Pl@ntNet, OpenFreeMap/OSM`

### Species photos (GBIF contributors)
The species page shows one header photo, fetched on demand by the server route `/api/photo/[slug]` from the [GBIF occurrence API](https://www.gbif.org/developer/occurrence). Photos are never shown in the Plants list, on the landing page or on the map.

Rules the route enforces:
- **Licence: CC0 or CC BY only** (any version), checked on the photo itself, not just the record. Non-commercial (NC), NoDerivatives, ShareAlike and all-rights-reserved photos are never used.
- **Human observations only.** No preserved specimens or herbarium sheets.
- **Research-grade iNaturalist first** (GBIF dataset `50c9509d-22c7-4a22-a47d-8c48425ef4a7`), then any other human observation that passes the licence check.
- **Attribution as the licence requires:** every displayed photo shows "Photo: creator, licence" with the licence name linking to its legal text. CC BY photos without a named creator are skipped. `/about` explains the source and licence rules.
- **Privacy:** the route returns only `{ url, creator, licence, licenceUrl }`. Coordinates, record IDs and occurrence or photo page links are stripped on the server and are never returned, stored or linked.
- Photos come from many contributors and may occasionally show a similar plant; the species page says so.
- Responses are cached (`s-maxage` 30 days) so each species is looked up about once. Lookups time out after 5 seconds. If nothing suitable exists, the request fails or the user is offline, a neutral flower icon is shown instead.
- Featured species use a checked photo catalogue generated from GBIF ahead of deployment (`cd web && node scripts/build-photo-catalog.mjs`). This avoids a slow live lookup for those species. `--all` extends the catalogue to other species; entries without a qualifying photo remain absent. The catalogue stores only image URL, creator, licence and licence URL.

## Reproduce
`TODO: pipeline setup, raw downloads, run steps, notebook; web app setup and env vars`

## What we built vs. what we reused
`TODO`

## Limitations
`TODO`

## Responsible use
Chloris is not medical advice. Documented uses are shown with their evidence level for information only. Locations of at-risk species are generalised to ~10 km.

## AI use
`TODO: disclosure (Claude / Claude Code for planning, code and docs; reviewed by the team)`

## Team
`TODO`

## Licence
Code: MIT © 2026 Andromachossp and the Chloris team. Data remains under the licences of its sources.
