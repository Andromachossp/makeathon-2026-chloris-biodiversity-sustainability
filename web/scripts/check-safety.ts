/* Static guard for the safety and placement rules. Run: npm run check-safety (also part of `npm run validate-data`).
   1. The standard notice wording is exactly the agreed text, in EN and EL, and is the only "not medical advice" notice.
   2. Uses, traditional preparations, studies and evidence cards appear ONLY on the species page (never in lists, search,
      map sheets, scan or near-me results, never next to a condition or advisory elsewhere).
   3. Every place that shows uses or evidence, and /about, renders the standard notice.
   4. Sample-photo results are labelled "Cached example result". */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { el } from "../lib/i18n/el";
import { en } from "../lib/i18n/en";

const root = join(__dirname, "..");
const errors: string[] = [];

const EN_NOTICE = "Chloris is for information only. It is not medical advice and does not replace a doctor or prescribed medicine. We give no doses. Take extra care in pregnancy, while breastfeeding, and with children. Ask a pharmacist or doctor before using any wild plant.";
if (en.safety.notice !== EN_NOTICE) errors.push("lib/i18n/en.ts: safety.notice is not the agreed standard notice");
if (!el.safety.notice || el.safety.notice === en.safety.notice) errors.push("lib/i18n/el.ts: safety.notice must be a Greek translation of the standard notice");
if (en.scan.cachedExample !== "Cached example result") errors.push('lib/i18n/en.ts: scan.cachedExample must read "Cached example result"');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
const files = ["components", "app", "lib"].flatMap((d) => walk(join(root, d)));
const rel = (f: string) => relative(root, f).replaceAll("\\", "/");
const SPECIES_ONLY = new Set(["components/SpeciesView.tsx", "components/EvidenceSection.tsx"]);
const TYPES_AND_TEXT = (r: string) => r.startsWith("lib/i18n/") || r === "lib/schemas.ts" || r === "lib/types.ts";

for (const f of files) {
  const r = rel(f);
  const src = readFileSync(f, "utf8");
  if (/notMedicalAdvice/.test(src)) errors.push(`${r}: uses the removed short notice; use <SafetyNotice /> / t.safety.notice`);
  const showsUses = /EvidenceSection|`evidence\/|"evidence\/|\.usesEn|\.usesEl|\.prepEn|\.prepEl|curated\??\.(uses|prep)/.test(src);
  if (showsUses && !SPECIES_ONLY.has(r) && !TYPES_AND_TEXT(r)) errors.push(`${r}: uses/evidence content must only be shown on the species page`);
  if (r === "lib/search.ts" && /evidence|finding|uses|prep/i.test(src)) errors.push("lib/search.ts: search must not index uses or evidence (names only)");
}

const mustHaveNotice = ["components/EvidenceSection.tsx", "components/HomeView.tsx", "components/NearView.tsx", "components/ScanView.tsx", "app/(app)/about/page.tsx"];
for (const r of mustHaveNotice) if (!/<SafetyNotice/.test(readFileSync(join(root, r), "utf8"))) errors.push(`${r}: must render <SafetyNotice />`);
if (!/t\.safety\.notice/.test(readFileSync(join(root, "components/landing/Landing.tsx"), "utf8"))) errors.push("components/landing/Landing.tsx: footer must show t.safety.notice");
if (!/t\.scan\.cachedExample/.test(readFileSync(join(root, "components/ScanView.tsx"), "utf8"))) errors.push('components/ScanView.tsx: sample results must be labelled "Cached example result"');

if (errors.length) {
  console.error(`Safety check FAILED (${errors.length}):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(`Safety check OK: standard notice (EN/EL) intact, uses/evidence only on the species page, notice present on ${mustHaveNotice.length + 1} screens, sample label present.`);
