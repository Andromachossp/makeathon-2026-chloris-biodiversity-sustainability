# Design

## Concept: "Night over the Aegean"

Chloris looks like an editorial atlas printed at night: ink-navy paper, warm off-white type and the colours of Greek wildflowers (poppy, saffron, lavender, Aegean blue). Green is reserved for a small "OK" accent. The landing page is a cinematic WebGL story built from our own data; the app screens are calm and fast, with skeleton screens instead of spinners. The species card keeps its herbarium-sheet idea: an off-white specimen sheet with a catalogue number.

**Inspiration (combine ideas that suit plants and conservation; don't copy any site's look):**

| Site | What we take | Where in Chloris |
| --- | --- | --- |
| [The New Mobile Workforce](https://thenewmobileworkforce.imm-g-prod.com) | Linear scroll story; every scroll step has a big visual change; a big visual change per scroll step | Landing: scroll-driven camera move through the 3D risk landscape of Greece |
| [Persepolis Reimagined](https://persepolis.getty.edu) | Loading counter; "past vs present" reconstruction | Intro counter; "Then / Now" toggle on maps and cards |
| [KPRverse](https://kprverse.com) | Portals: one world revealed through another | Scan viewfinder as a circular portal that opens into the species card |
| [Byholm](https://byholm.co) | Numbered menu (01–05) with one permanent CTA; sideways-scrolling panels | Landing nav; "How we keep them" panels |
| [Noddal](https://noddal.xyz) | Dark cinematic mood; huge condensed title across the screen | "CHLORIS" across the bottom of the hero |
| [Suho](https://suho.studio/#work) | 000→100 loader; numbered entries; ASCII-art closing | Loader; catalogue numbers "CHL-0001"; ASCII/dot-matrix plant on the landing footer (P2) |

## Tokens

Defined as CSS variables in `web/app/globals.css` and mapped into Tailwind's theme. Never use a raw hex in a component.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0D1220` | Page background |
| `--surface` | `#151B2E` | Cards, sheets, tab bar |
| `--surface-2` | `#1B2340` | Hover, skeleton base |
| `--line` | `#232B45` | Hairlines and borders |
| `--text` | `#F4EFE6` | Primary text (warm off-white) |
| `--text-dim` | `#A7AFC8` | Secondary text |
| `--poppy` | `#F0533A` | Alerts, decline component |
| `--saffron` | `#F6B93B` | Primary actions, large numerals, selected state |
| `--lavender` | `#9B8CFF` | Endemic badge, endemic component |
| `--aegean` | `#2EA8D8` | Focus ring, Natura 2000, rarity component |
| `--ok` | `#6BCB8B` | The only green: "OK" / Least concern, small accents only |
| `--paper` / `--paper-ink` | `#F4EFE6` / `#1A2036` | Specimen sheet |

### Risk ramp (colour-blind safe, sequential, magma-like)

Pale yellow → orange → crimson → deep purple. Lightness falls monotonically, so the order survives red-green and blue-yellow colour blindness and greyscale. Risk is **always** shown as icon + word + ramp colour. A chip uses the ramp colour as its fill and a label colour chosen for contrast.

| Level | Fill | Label on fill | Line tone (strokes/text on dark) | Icon |
| --- | --- | --- | --- | --- |
| Low | `#F9E58A` | `#1A1405` (14.5:1) | `#F9E58A` | leaf |
| Moderate | `#F5A04A` | `#1A1005` (8.9:1) | `#F5A04A` | triangle |
| High | `#C7303A` | `#FFFFFF` (5.4:1) | `#E5545B` | flame |
| Critical | `#7B2A8C` | `#FFFFFF` (8.2:1) | `#B36BD1` | octagon |

Harvest states: safe = `--ok` + ✓, careful = Moderate + !, do not harvest = High line tone + ✕, not reviewed = dashed neutral. IUCN badges reuse the ramp (CR critical, EN high, VU moderate, NT low, LC `--ok`); **Not assessed (NE) and Data deficient (DD) are neutral and dashed, never on the ramp.**

### Richness ramp (cool, separate from risk)

Ice blue → indigo: `#DDF1FB · #9ED6F2 · #5FB0EA · #5B86EE · #6A5FE0 · #5233B8`. Used only for the number of medicinal species per cell. Never use it for risk.

### Score components (one colour each, always labelled)

| Component | Colour |
| --- | --- |
| IUCN category | saffron `#F6B93B` |
| Endemic to Greece | lavender `#9B8CFF` |
| Rarity | Aegean `#2EA8D8` |
| Decline | poppy `#F0533A` |
| Outside protected areas | orchid `#E27DB8` |
| Burnt areas | burnt orange `#D97B2B` |

### Contrast (WCAG 2.x, measured)

Text `#F4EFE6` on `--ink` / `--surface` / `--surface-2`: 16.3 / 14.9 / 13.5. `--text-dim`: 8.5 / 7.8 / 7.1. Poppy 5.3 / 4.9 / 4.4 (use on `--ink` or `--surface`, not for small text on `--surface-2`). Saffron 10.6 / 9.7 / 8.8, lavender 6.7 / 6.2 / 5.6, Aegean 6.9 / 6.3 / 5.7, OK green 9.4 / 8.6 / 7.7. Component colours on `--surface`: 4.9–9.7. Not usable as text on dark: the Critical fill `#7B2A8C` (2.1:1 on `--surface`) and the deep end of the richness ramp; they appear only as fills behind a lighter label or next to an icon and word.

Radius 14 px cards, 999 px pills. Hairline borders, no heavy shadows.

## Type (all support Greek)

- **Display:** Noto Serif Display (has Greek) for headings and species names; Roboto Flex condensed (`wdth` 25–40, weight 800–900) for "CHLORIS" and large numerals.
- **Text serif:** Literata (has Greek) for long text on cards; italic for scientific names.
- **Specimen mono:** JetBrains Mono for catalogue numbers, coordinates, counts, labels.
- UI text: Roboto Flex at normal width.
Load with `next/font/google`, subsets `latin` + `greek`, `display: swap`.

## Map (`/map`)

A 3D terrain map with flower pins. The map is deliberately light and natural (sand land, blue-grey sea) so the data colours read; the app chrome around it stays ink-navy.

- **Basemap:** OpenFreeMap vector tiles restyled in sand `#D9CEB7` land, blue-grey `#9DB3C2` sea, quiet labels, dashed boundaries. No roads, no cell grid, no extruded columns.
- **Terrain:** MapLibre `terrain` with the open AWS "Terrarium" elevation tiles (`s3.amazonaws.com/elevation-tiles-prod/terrarium`, `encoding: "terrarium"`, CORS open), exaggeration 1.3, a multidirectional hillshade layer under the water, MapLibre `sky` for a soft haze (the horizon itself shows once the user tilts past about 70°). Default pitch 60° with a slow 6.5 s intro move.
- **Low-end devices** (under 6 cores, under 4 GB, data saver or reduced motion): no terrain, no hillshade, flat map, no intro move, and no elevation tiles are requested. The "3D" chip lets anyone turn terrain on or off.
- **Attribution (required by the data licence):** Mapzen / AWS Terrain Tiles with Copernicus EU-DEM, USGS (SRTM, GMTED2010) and NOAA ETOPO1; short form in the map attribution control, full text on `/about`. Basemap: OpenFreeMap, OpenMapTiles, © OpenStreetMap contributors.
- **Pins:** one flower per occupied 0.1° cell, at the exact cell centre (never jittered or offset), drawn by a GPU symbol layer from SVG icons registered with `map.addImage`. The stem's foot is the anchor, so pins stand on the terrain. Size grows with species count (small to medium).
- **Colour and shape by layer:** **Risk** = magma ramp (average risk of the species in the cell; fewer than 5 species = small muted slate bud). **Richness** = cool ramp. **Medicinal hotspots** = poppy starburst (a different silhouette, never colour alone) against muted buds.
- **Clusters and flowers:** below about zoom 6.5 nearby cells are grouped into small translucent round badges (radius 9–15 px, count in dark text with a light halo) coloured by the active layer's average, so the terrain shows through. From zoom 7 individual flowers appear with collision on, so crowded areas show fewer, larger flowers as you zoom in; icon size scales with zoom. Tap a badge to zoom in.
- **Framing:** the map opens framed on Greece (lat 34.5–41.8, lng 19.3–28.4); the tilted camera is computed so all four corners stay on screen (50° and no rotation on phones, 60° and a slight rotation on wider screens).
- **Selection:** the cell's square outline is drawn, the pin is enlarged, and the bottom sheet lists the species (name, risk, IUCN) with the note "Locations are generalised to about 10 km to protect plants."
- **Species mode (`?species=`):** only that species' cells (Then/Now), the camera flies to them.
- **Legend:** a small "Legend" chip that opens on tap; the panel is plain text ("Each flower is a 10 km area. Redder means higher average risk. Grey means not enough data yet.") plus a thin ramp bar with the real range, and never covers more than a third of the map. **Cell list** is the keyboard- and screen-reader-friendly alternative: every square as a button.

## Landing page `/` (WebGL)

Linear scroll story, numbered menu `01 Flora · 02 Where · 03 Risk · 04 Keep · 05 Install` + permanent "Open Chloris" button.

0. **Intro loader** (first visit only, skippable, max 2.5 s): mono counter `000 → 100` in saffron tied to the real loading of `cells.json`, `species.json` and the WebGL scene, label "Cataloguing the flora of Greece". Session-stored so it never repeats.
1. **01 Flora — hero:** a 3D landscape built from the real `cells.json`: one column per occupied 10 km cell, height = number of medicinal species, colour = average risk of its species on the magma ramp (cells with fewer than 5 species are muted slate). Slow camera tilt, a warm saffron light sweeping across the columns. Huge condensed "CHLORIS" across the bottom edge. Subtitle: "Where Greece's medicinal plants grow, which are at risk, and how we keep them."
2. **02 Where:** the camera moves closer and orbits over the mainland as you scroll; a small key explains height and colour. Large saffron numeral: the real number of species from `meta.json`.
3. **03 Risk:** the camera skims low between the columns. Large saffron numeral: the real count of at-risk species, plus how many medicinal hotspots exist (only when the Natura 2000 join is present).
4. **04 Keep:** sideways-scrolling panels (Byholm): Scan a plant → See if it's safe → Use a substitute → Record a sighting. Phone mock-ups with real screenshots come later.
5. **05 Install:** QR code + "Open Chloris" + iPhone/Android install hint. Data credits line.
6. **Footer (P2):** ASCII/dot-matrix rendering of a featured plant photo that reveals the real photo under the pointer (Suho), with the photo credit.

**WebGL implementation rules**
- `@react-three/fiber` with one `InstancedMesh` (a box per cell, per-instance colour) and `MeshStandardMaterial`; lights: ambient, a directional key light and one moving warm point light. Camera path = keyframes (azimuth, elevation, distance, target) interpolated by scroll progress, plus a slow sinusoidal tilt. Fog distance scales with the camera distance. On tall screens the camera backs off and looks slightly south so the map sits above the title.
- Load the scene with `next/dynamic` and `ssr: false` **only on `/`**. App routes never import Three.js. Cap DPR at 1.5, dispose geometry on unmount, pause when the tab is hidden.
- Animated only when the device is capable (6+ cores, 4 GB+ memory when reported, no data saver, no reduced motion). Otherwise the scene renders once as a still (`frameloop="demand"`). No WebGL at all: an SVG poster of the same cells on the same ramp.

## App screens

**Specimen card** (`/species/[slug]`): a parchment sheet on the dark background, like a herbarium sheet. Top-left catalogue number in mono; top-right a round "seal" with the risk score; a bordered "label" block (family, records, cells, years, IUCN, endemic). Scientific name in Literata italic. Harvest banner sits above the sheet at full width.

**Portal (scan):** the viewfinder is a circular mask over the camera image with a thin rotating Aegean-blue ring while identifying. On success, the circle expands (`clip-path: circle()` animation, ~600 ms) and reveals the species card underneath. Pure CSS, no WebGL.

**Then / Now:** a two-state segmented control on maps; "Then" shows old-period cells in saffron, "Now" new-period cells in Aegean blue; cells present then but not now get a dashed outline.

**Motion:** 150–250 ms ease-out for UI; nothing bounces. Respect `prefers-reduced-motion` everywhere.

## Skeleton screens (required)

Every route that loads data shows a skeleton that matches the final layout, so nothing jumps when content arrives (CLS < 0.1). No full-screen spinners.

- Build them with `loading.tsx` per route (navigation) **and** client skeleton components while JSON loads (`<Suspense>` boundaries around data-dependent parts).
- One shared `<Skeleton>` primitive: `--surface-2` blocks with a slow diagonal shimmer (1.6 s, linear). With reduced motion: static blocks, no shimmer. Skeletons have `aria-busy="true"` on the container and a visually hidden "Loading…" label.

| Screen | Skeleton |
| --- | --- |
| `/map` | Map area as a faint grid of cell squares over `--ink` with a soft pulse; layer toggle pills; bottom sheet handle with 3 row placeholders |
| `/species/[slug]` | Harvest banner bar; parchment sheet with catalogue-number chip, two title lines, round seal outline, label block (5 short lines), breakdown bars (6), mini-map square |
| `/priorities`, `/search` | 10 rows: number chip, two text lines, level pill |
| `/scan` result | Portal circle with the rotating ring; 3 candidate rows below |
| Cell bottom sheet | Header line + 6 species rows |
| `/about` | Heading + paragraphs blocks |
| Landing | The intro loader replaces the skeleton on `/` |

## Accessibility

- All colour-coded things also have an icon and a text label.
- Focus ring: 2 px `--aegean`, offset 2 px.
- Map: list alternative for every map view (cell sheet and priorities), labelled controls.
- Touch targets ≥ 44 px. Greek and English text both fit (test long Greek strings).
