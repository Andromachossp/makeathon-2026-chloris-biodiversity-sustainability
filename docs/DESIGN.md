# Design

## Concept: "Night herbarium"

Chloris looks like a botanical herbarium catalogue at night: dark forest ink, chlorophyll light, parchment specimen sheets with catalogue numbers. The landing page is a cinematic WebGL story. The app screens are calm and fast, with skeleton screens instead of spinners.

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

Define as CSS variables in `app/globals.css` and map them into Tailwind's theme.

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0B1410` | Page background (night forest) |
| `--moss` | `#13241B` | Raised surfaces, sheets |
| `--moss-2` | `#1C3326` | Hover, skeleton base |
| `--line` | `rgba(233,240,228,0.12)` | Hairlines |
| `--text` | `#E9F0E4` | Primary text |
| `--text-dim` | `#A9B8AC` | Secondary text |
| `--chlorophyll` | `#7BE495` | Brand accent, primary buttons, focus ring |
| `--pollen` | `#E9D98B` | Highlights, endemic badge |
| `--parchment` | `#F1EBDD` | Specimen card paper |
| `--parchment-ink` | `#2A2418` | Text on parchment |
| Risk low | `#8FB79A` + leaf icon | |
| Risk moderate | `#E3B23C` + triangle icon | |
| Risk high | `#E0653A` + flame icon | |
| Risk critical | `#E04848` + octagon icon | Always icon + label, never colour alone |
| Harvest safe / careful / do-not | same as low / moderate / critical, with icons ✓ / ! / ✕ | |

Radius 14 px cards, 999 px pills. Hairline borders, no heavy shadows. Check contrast for every text/background pair (AA).

## Type (all support Greek)

- **Display:** Roboto Flex, condensed (`wdth` 25–40, weight 800–900) for "CHLORIS" and section numbers.
- **Botanical serif:** Literata for species names (italic for scientific names) and long text on cards.
- **Specimen mono:** JetBrains Mono for catalogue numbers, coordinates, counts, labels.
- UI text: Roboto Flex at normal width.
Load with `next/font/google`, subsets `latin` + `greek`, `display: swap`.

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

**Portal (scan):** the viewfinder is a circular mask over the camera image with a thin rotating chlorophyll ring while identifying. On success, the circle expands (`clip-path: circle()` animation, ~600 ms) and reveals the species card underneath. Pure CSS, no WebGL.

**Then / Now:** a two-state segmented control on maps; "Then" shows old-period cells in pollen, "Now" new-period cells in chlorophyll; cells present then but not now get a dashed outline.

**Motion:** 150–250 ms ease-out for UI; nothing bounces. Respect `prefers-reduced-motion` everywhere.

## Skeleton screens (required)

Every route that loads data shows a skeleton that matches the final layout, so nothing jumps when content arrives (CLS < 0.1). No full-screen spinners.

- Build them with `loading.tsx` per route (navigation) **and** client skeleton components while JSON loads (`<Suspense>` boundaries around data-dependent parts).
- One shared `<Skeleton>` primitive: `--moss-2` blocks with a slow diagonal shimmer (1.6 s, linear). With reduced motion: static blocks, no shimmer. Skeletons have `aria-busy="true"` on the container and a visually hidden "Loading…" label.

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
- Focus ring: 2 px `--chlorophyll`, offset 2 px.
- Map: list alternative for every map view (cell sheet and priorities), labelled controls.
- Touch targets ≥ 44 px. Greek and English text both fit (test long Greek strings).
