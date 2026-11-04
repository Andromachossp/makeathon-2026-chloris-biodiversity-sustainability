# WCUPS extraction: method and limits (for the README)

**Source.** World Checklist of Useful Plant Species 2020 (Diazgranados et al., Royal Botanic Gardens, Kew; CC BY 4.0;
DOI 10.5063/F1CV4G34). The KNB package contains only a 689-page PDF, no table.
**Script.** `pipeline/chloris/wcups.py` extracts the PDF text with `pypdf` and parses it. Rerun: `python -m chloris.wcups`.
**Use-code legend** (PDF p. 4): AF animal food, EU environmental uses, FU fuels, GS gene sources, HF human food,
IF invertebrate food, MA materials, **ME medicines (human and veterinary)**, PO poisons, SU social uses.

**Method.** Each entry is `name (wrapped over 1-3 lines)` + `IPNI id | codes | [sources]`. Genus/family headings,
page headers and wrapped source lists are removed. A species is medicinal when its row contains `ME`.
Rows are joined to WCVP by IPNI id (accepted names and synonyms), then by genus + epithet; the join type is kept in
`medicinal_species.parquet` (`match` column).

**Checks.** 40,293 rows parsed (the PDF says 40,292); 26,663 rows with ME (the PDF says 26,662).

**Limits (state these in the README).**
- Text extracted from a PDF, not a curated table. A one-row difference from the stated totals remains unexplained.
- 1,272 rows have no source list in the text (flagged `truncated_no_refs`, `work/wcups_parse_issues.csv`). None of them
  contains ME; because the parsed ME total matches the stated total, we treat this as genuine, but it is not verified row by row.
- ~53 names have no IPNI id ("in Tropicos" / "in AlgaeBase") and can only be matched by name.
- Name-only matches use genus + epithet and WCVP synonyms; a wrong synonym link would give a false match. The `match`
  column lets the science lead review these.
- WCUPS says a plant has a documented medicinal use somewhere in the world, not that it is used in Greece, nor that it is safe.
