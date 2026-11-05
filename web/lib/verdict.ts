import type { Dictionary } from "./i18n/en";
import type { Meta, Species } from "./types";

/** Plain-language verdicts. They come from data we already have; thresholds live in pipeline/config/verdicts.yaml
    (exported in meta.json). A verdict is never advice to pick or use a plant. */
export type VerdictKey = "protect" | "care" | "notThreatened" | "nodata";
export type VerdictReason = "protectIucn" | "protectScore" | "careModerate" | "careEndemic" | "notThreatened" | "nodata";
export type VerdictConfig = Meta["verdicts"];
export interface Verdict { key: VerdictKey; reason: VerdictReason }

/** Order matters (first match wins), see verdicts.yaml:
    1 threatened on the IUCN list, 2 too few records, 3 high/critical prototype risk, 4 moderate risk or only grows in Greece, 5 the rest. */
export function verdictFor(s: Species, c: VerdictConfig): Verdict {
  if (c.protect_iucn.includes(s.iucn)) return { key: "protect", reason: "protectIucn" };
  if (s.stats.records < c.min_records) return { key: "nodata", reason: "nodata" };
  if (c.protect_levels.includes(s.risk.level)) return { key: "protect", reason: "protectScore" };
  if (c.care_levels.includes(s.risk.level)) return { key: "care", reason: "careModerate" };
  if (c.care_if_endemic && s.endemic) return { key: "care", reason: "careEndemic" };
  return { key: "notThreatened", reason: "notThreatened" };
}

/** True when a plant has enough records to be ranked (see verdicts.yaml `min_records`). */
export const hasEnoughData = (s: Species, c: VerdictConfig) => s.stats.records >= c.min_records;

const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));

/** One plain sentence explaining the verdict. */
export function reasonText(v: Verdict, s: Species, t: Dictionary): string {
  switch (v.reason) {
    case "protectIucn": return fill(t.verdict.reasonProtectIucn, { cat: s.iucn });
    case "protectScore": return fill(t.verdict.reasonProtectScore, { level: t.risk[s.risk.level].toLowerCase() });
    case "careModerate": return t.verdict.reasonCareModerate;
    case "careEndemic": return t.verdict.reasonCareEndemic;
    case "notThreatened": return t.verdict.reasonNotThreatened;
    case "nodata": return s.stats.records === 0 ? t.verdict.reasonNodataZero : fill(t.verdict.reasonNodata, { n: s.stats.records });
  }
}

export const fillText = fill;
