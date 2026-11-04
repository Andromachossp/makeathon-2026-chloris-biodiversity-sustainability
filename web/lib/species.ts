import type { Dictionary } from "./i18n/en";
import type { Locale } from "./i18n";
import type { Species } from "./types";

/** Display name: Greek or English common name when we have one, else the scientific name. */
export function displayName(s: Species, locale: Locale): { title: string; isFallback: boolean; enTag: boolean } {
  if (locale === "el") {
    if (s.nameEl) return { title: s.nameEl, isFallback: false, enTag: false };
    if (s.nameEn) return { title: s.nameEn, isFallback: false, enTag: true };
  } else if (s.nameEn) return { title: s.nameEn, isFallback: false, enTag: false };
  return { title: s.name, isFallback: true, enTag: false };
}

export type HarvestState = "safe" | "careful" | "do-not-harvest" | "atRisk" | "unknown";

/** Harvest banner state: curated rule wins, otherwise at-risk species are "do not harvest". */
export function harvestState(s: Species): HarvestState {
  const h = s.curated?.harvest;
  if (h && h !== "unknown") return h;
  if (s.risk.atRisk) return "atRisk";
  return "unknown";
}

export const RISK_ORDER = ["low", "moderate", "high", "critical"] as const;
export type Parts = Species["risk"]["parts"];
export const PART_KEYS = ["iucn", "endemic", "rarity", "decline", "unprotected", "fire"] as const;

export function partMissingText(key: (typeof PART_KEYS)[number], t: Dictionary): string {
  if (key === "unprotected") return t.parts.unprotectedMissing;
  if (key === "fire") return t.parts.fireMissing;
  return t.parts.noData;
}
