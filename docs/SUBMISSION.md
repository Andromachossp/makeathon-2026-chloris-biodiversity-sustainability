# Submission

**Deadline:** Sunday 8 November 2026. Rules: 11:00 CET; Devpost schedule: 11:00 EET. Use the earlier one: **Sunday 11:00 Greek time is the absolute last minute. Submit Saturday night.**

Every submission needs (official rules): Devpost project page · public GitHub repo · README/documentation · pitch video (max 10 min) · presentation (max 10 slides). Teams of 2–5; every member listed on Devpost.

## README checklist (`README.md` at repo root)

- [ ] What Chloris is (one paragraph) + live demo URL + QR image
- [ ] Track: 3 — Biodiversity & Sustainability; the question it answers
- [ ] Screenshots / GIF
- [ ] How it works: pipeline diagram, risk score formula with the weights from `scoring.yaml` and why (science lead's justification)
- [ ] Data sources table with versions, licences, citations, **GBIF download DOI**
- [ ] How to reproduce: pipeline setup, raw downloads, `python -m chloris.run --step all`, notebook
- [ ] How to run the web app locally + env vars
- [ ] **What we built vs. pre-existing:** our pipeline, scoring, app code, design; reused libraries, datasets and the Pl@ntNet API (listed)
- [ ] **Limitations:** sampling bias and how we corrected for it; GBIF records ≠ true presence/absence; most species not IUCN-assessed; identification errors; WCUPS use flags are not efficacy evidence; 10 km generalisation; uses reviewed only for featured species
- [ ] **Not medical advice** statement
- [ ] Traditional knowledge: provenance and attribution of uses (EMA monographs, WCUPS), no undocumented community knowledge collected
- [ ] **AI use disclosure:** Claude (Anthropic) and Claude Code were used for planning, code generation and documentation; the team reviewed and is responsible for all output
- [ ] Team members and roles
- [ ] Licence for our code (e.g. MIT) and copyright "© 2026 Andromachossp and the Chloris team"

## Video (max 10 min) — suggested script

1. Problem (45 s): Greek medicinal plants under pressure; the track lead's question.
2. Data and method (2 min): WCVP + WCUPS → all Greek medicinal plants; GBIF records → cells; risk score and its parts; sampling-bias correction; show the notebook.
3. Demo (4 min): landing → install via QR → map hotspots → tap a hotspot → species card with breakdown and Then/Now → scan a real plant → harvest decision + substitute → airplane mode → sighting queued → back online, synced.
4. Results (1 min): real numbers from `meta.json` (species, endemics, at-risk, hotspots outside Natura 2000).
5. Limitations (1 min) and future (1 min): native offline app, sensors and fire alerts, expert verification, range-shift models.

## Slides (max 10)

1. Title + QR · 2. Problem · 3. Question & users · 4. Data · 5. Method & risk score · 6. Results (map + numbers) · 7. Prototype (3 screenshots) · 8. Limitations & responsible use · 9. Impact & future · 10. Team & thanks.
