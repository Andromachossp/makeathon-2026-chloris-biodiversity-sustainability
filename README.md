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

### Greek plant names
The pipeline uses GBIF vernacular names, then applies the individually sourced corrections in [`pipeline/config/greek_names.csv`](pipeline/config/greek_names.csv). Each row identifies an exact accepted scientific name, a Greek name and the source page. Sources include [Greek Flora](https://www.greekflora.gr/el/flowersIndex.aspx), the Greek Ministry of Rural Development and Food, and university forestry material. These are factual name citations; no source images or prose are copied. Add a name only after confirming the source names the same taxon. Run `cd pipeline && .venv/bin/python -m chloris.run --step export`, followed by `cd ../web && npm run validate-data && npm run build`. Species without a confirmed Greek name retain their scientific name in Greek mode.

*Trigonella foenum-graecum* (μοσχοσίταρο, τσεμένι) is absent because [Kew lists it as introduced in Greece](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A523957-1). It must not be confused with the catalogue's *Trigonella balansae* or *Trigonella caerulea*.

### Species photos (GBIF, iNaturalist and Wikimedia Commons contributors)
The species page shows one header photo. The server route `/api/photo/[slug]` uses a checked catalog first and the [GBIF occurrence API](https://www.gbif.org/developer/occurrence) for uncatalogued species. The catalog also includes [Wikimedia Commons](https://commons.wikimedia.org/) files whose title or exact species category matches the accepted name and whose image metadata gives a reusable licence, plus direct [iNaturalist](https://www.inaturalist.org/pages/api+recommended+practices) research-grade photos whose taxon name maps to the same species in the Kew synonym index and whose photo-level licence is eligible. Herbarium specimens and illustrations are excluded. Photos are never shown in the Plants list, on the landing page or on the map.

Rules the route enforces:
- **Licence: CC0 or CC BY** (any version), checked on the photo itself, not just the record. NoDerivatives, ShareAlike and all-rights-reserved photos are not used. **One explicit exception:** the *Galanthus ikariae* photo by Thanasis Papanikolaou is CC BY-NC 4.0 and may be used only for this non-commercial prototype. Replace or remove it before any commercial use.
- **Human observations only for GBIF and iNaturalist.** No preserved specimens or herbarium sheets from any source.
- **Research-grade iNaturalist first** (GBIF dataset `50c9509d-22c7-4a22-a47d-8c48425ef4a7`), then any other human observation that passes the licence check.
- **Attribution as the licence requires:** every displayed photo shows "Photo: creator, licence" with the creator linking to the image and the licence name linking to its legal text. CC BY photos without a named creator are skipped. `/about` explains the source and licence rules.
- **Privacy:** the route returns only `{ url, creator, licence, licenceUrl }`. Coordinates, record IDs and occurrence or photo page links are stripped on the server and are never returned, stored or linked.
- Photos come from many contributors and may occasionally show a similar plant; the species page says so.
- Responses are cached (`s-maxage` 30 days) so each species is looked up about once. Lookups time out after 5 seconds. If nothing suitable exists, the request fails or the user is offline, a neutral flower icon is shown instead.
- Species with a checked photo use a catalog generated from GBIF (`cd web && node scripts/build-photo-catalog.mjs --all`), Commons (`cd web && node scripts/build-commons-photo-catalog.mjs --deep` then `--category`) and direct iNaturalist research-grade observations (`cd web && node scripts/build-inat-photo-catalog.mjs`). Entries without a qualifying photo remain absent; the rest use the live GBIF lookup and Kew reference-image link. The catalog stores only image URL, creator, licence and licence URL. A bulk refresh respects source rate limits and skips existing entries.
- Kew POWO is a taxonomic and reference-image link, not an automatic photo feed. Kew says copyright applies to individual images; the *Galanthus ikariae* POWO image is a herbarium specimen. An image on POWO alone is not permission to embed it.
- When no qualifying photo can be displayed, the species page links to the matching Kew Plants of the World Online reference-image page. These images stay on Kew's site; Chloris does not copy or embed them.

### Add a photo you own
1. Export a correctly identified photo without GPS/EXIF metadata into `web/public/photos/<species-slug>.jpg`. For example, with Pillow: `python3 -c 'from PIL import Image; import sys; Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2], quality=85)' /path/to/your-photo.jpg web/public/photos/galanthus-ikariae.jpg`.
2. In `web/public/data/photo-catalog.json`, set that species' four fields: `url` to `/photos/<species-slug>.jpg`, `creator` to the photographer's name, `licence` to `CC BY 4.0` (or `CC0 1.0`), and `licenceUrl` to the matching Creative Commons URL. Only choose a licence if you own the copyright or have the photographer's permission.
3. Run `cd web && npm run validate-data && npm run build`. Then commit both the image and catalogue and push `main`. Bump the `v=` token in `web/components/SpeciesPhoto.tsx` if replacing a previously cached photo.

## Reproduce
`TODO: pipeline setup, raw downloads, run steps, notebook; web app setup and env vars`

## What we built vs. what we reused
`TODO`

## Limitations
`TODO`

## Responsible use
Chloris is not medical advice. Documented uses are shown with their evidence level for information only. Locations of at-risk species are generalised to ~10 km.

Map flowers mark occupied 0.1° cells, not individual plants. To keep island and coastal flowers on land, `pipeline/build_land_anchors.py` derives one representative point per occupied cell from the [geoBoundaries Greece ADM0 boundary](https://www.geoboundaries.org/api/current/gbOpen/GRC/ADM0/) (EuroGeoGraphics, Regional IM Working Group - Europe, 2016, CC BY 4.0). No occurrence coordinates are used. Cells without mapped land have no flower but remain in the cell list; the boundary may omit tiny islands.

Every species page has a human danger section. High-severity ingestion warnings cover *Atropa bella-donna*, *Colchicum autumnale*, *Nerium oleander* and *Taxus baccata*. Skin warnings cover *Dittrichia graveolens*, *Urtica dioica* and *Ruta chalepensis*. A pollen-allergy warning covers *Parietaria judaica*. Each links to a species-level [NC State Extension Gardener Plant Toolbox](https://plants.ces.ncsu.edu/) entry or a [published report](https://pubmed.ncbi.nlm.nih.gov/12646120/). The other 1,378 species say "Human toxicity not reviewed yet"; this does not establish that they are safe from poisoning, rashes or allergies. These source checks await specialist review. Ingestion toxicity is called **poisonous**, not venomous.

## AI use
`TODO: disclosure (Claude / Claude Code for planning, code and docs; reviewed by the team)`

## Team
`TODO`

## Licence
Code: MIT © 2026 Andromachossp and the Chloris team. Data remains under the licences of its sources.
