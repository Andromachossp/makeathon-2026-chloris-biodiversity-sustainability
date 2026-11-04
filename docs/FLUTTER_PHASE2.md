# Phase 2 — Flutter app (only after the web submission is safe)

Goal: a native Android app (APK shared by QR) with stronger offline use. It reuses everything except the UI.

**Reused as-is:** `web/public/data/*` (bundled as assets and updated from the deployed URL when online), the deployed `/api/identify` route (so the Pl@ntNet key stays on the server), the Firestore `sightings` collection and rules.

**Packages:** `flutter_map` (+ `flutter_map_tile_caching` for offline tiles), `image_picker`, `geolocator`, `firebase_core`, `cloud_firestore` (offline persistence on by default), `firebase_auth` (anonymous), `http`, `hive` or `isar` for the scan queue, `flutter_localizations` (EL/EN).

**Screens:** same as the web app (Map, Scan, Species, Priorities, Search, Sightings, About), same tokens and fonts from DESIGN.md, skeleton loaders with the `shimmer` package (disabled when reduced motion is on).

**Deliverable:** `flutter/` folder in the repo, release APK attached to a GitHub release, QR to the APK on the Devpost page. iPhone users keep the PWA.
