# Design

## Concept: "Night over the Aegean"

Chloris looks like an editorial atlas printed at night: ink-navy paper, warm off-white type and the colours of Greek wildflowers (poppy, saffron, lavender, Aegean blue). Green is reserved for a small "OK" accent. The landing page is a cinematic WebGL story built from our own data; the app screens are calm and fast, with skeleton screens instead of spinners. The species card keeps its herbarium-sheet idea: an off-white specimen sheet with a catalogue number.

**Inspiration (combine ideas that suit plants and conservation; don't copy any site's look):**

| Site | What we take | Where in Chloris |
| --- | --- | --- |
| [The New Mobile Workforce](https://thenewmobileworkforce.imm-g-prod.com) | Linear scroll story; every scroll step has a big visual change; WebGL particles morphing between shapes | Landing: particles morph leaf → Greece hotspots → at-risk glow |
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

- Slate-blue basemap built from OpenFreeMap vector tiles: land `#2A3552` is slightly lighter than sea `#131A2E`; roads are omitted, labels are muted (`#8590B0`). No cell outlines.
- One layer at a time, chosen with chips: **Risk** (average risk score of the species recorded in a square, magma ramp, only squares with at least 5 species; others are muted slate with a legend note), **Richness** (species per square, cool ramp) and **Medicinal hotspots** (at-risk species and under 50% protected: poppy with a hatch pattern, never colour alone).
- Natura 2000 is an Aegean-blue dashed outline (toggle).
- **3D** toggle: pitch 48°, fill-extrusion columns, height = number of species (Risk, Richness) or at-risk species (Hotspots). Flat by default on low-end devices (fewer than 6 cores, under 4 GB memory, data saver or reduced motion). Choosing a species always switches to flat so its cells stay visible.
- Legend shows the active ramp with its real numeric range. **Cell list** is a keyboard- and screen-reader-friendly alternative to the map: every square as a button.

## Landing page `/` (WebGL)

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
