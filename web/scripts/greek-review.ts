/* Writes docs/GREEK_REVIEW.md: every Greek UI string next to its English source, for the Greek-speaking reviewer.
   Run: npm run greek-review */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { el } from "../lib/i18n/el";
import { en } from "../lib/i18n/en";

type Json = string | readonly Json[] | { readonly [k: string]: Json };
const rows: [string, string, string][] = [];
function walk(a: Json, b: Json, path: string) {
  if (typeof a === "string" && typeof b === "string") rows.push([path, a, b]);
  else if (Array.isArray(a) && Array.isArray(b)) a.forEach((x, i) => walk(x as Json, b[i] as Json, `${path}[${i}]`));
  else if (a && b && typeof a === "object" && typeof b === "object") for (const k of Object.keys(a)) walk((a as Record<string, Json>)[k], (b as Record<string, Json>)[k], path ? `${path}.${k}` : k);
}
walk(en as unknown as Json, el as unknown as Json, "");
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const sameAsEn = (e: string, g: string) => e === g;
const out = [
  "# Greek strings to review",
  "",
  "Drafted by Claude (an AI), **not yet reviewed by a Greek speaker**. Please check wording, tone (informal \"you\"), grammar and accents, and that every string fits on a phone. Edit `web/lib/i18n/el.ts`; then run `npm run greek-review` to refresh this file.",
  "",
  "Notes for the reviewer:",
  "- Plant names come from our data, not from this file. Greek common names exist for only some plants (from GBIF); we never invent them. Names written in Latin letters are not shown as Greek.",
  "- `{n}`, `{cat}`, `{level}` are placeholders filled by the app.",
  "- Terms chosen on purpose: *Φυτά* (Plants), *Φυτρώνει μόνο στην Ελλάδα* (Only grows in Greece), *Απειλούμενο* (Threatened), *Δεν έχει αξιολογηθεί ακόμη* (Not assessed yet), *Πρωτότυπος βαθμός* (Prototype score).",
  "",
  `${rows.length} strings.`,
  "",
  "| Key | English | Greek (to review) |",
  "| --- | --- | --- |",
  ...rows.map(([k, e, g]) => `| \`${k}\` | ${esc(e)} | ${esc(g)}${sameAsEn(e, g) ? " ⚠ same as English" : ""} |`),
  "",
];
writeFileSync(join(__dirname, "..", "..", "docs", "GREEK_REVIEW.md"), out.join("\n"));
console.log(`Wrote docs/GREEK_REVIEW.md with ${rows.length} strings`);
