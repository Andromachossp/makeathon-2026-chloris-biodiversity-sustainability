import type { Dictionary } from "./i18n/en";
import type { Locale } from "./i18n";
import type { Species } from "./types";

const GREEK_LETTERS = /[\u0370-\u03FF\u1F00-\u1FFF]/;

/** Display name: common name first (Greek in Greek mode when we have a Greek-script name, else English), Latin otherwise.
    Some GBIF "Greek" names are written in Latin letters; those are not shown as Greek. We never invent names. */
export function displayName(s: Species, locale: Locale): { title: string; isFallback: boolean; enTag: boolean } {
  if (locale === "el") {
    if (s.nameEl && GREEK_LETTERS.test(s.nameEl)) return { title: s.nameEl, isFallback: false, enTag: false };
    if (s.nameEn) return { title: s.nameEn, isFallback: false, enTag: true };
  } else if (s.nameEn) return { title: s.nameEn, isFallback: false, enTag: false };
  return { title: s.name, isFallback: true, enTag: false };
}

export type HarvestState = "safe" | "careful" | "do-not-harvest" | "unknown";

/** Harvest advice exists ONLY for species with a reviewed rule in featured_species.csv (a harvest value and a reviewer).
    Everything else is "not reviewed yet": we never infer advice from the risk score and never imply a plant is safe to pick. */
export function harvestState(s: Species): HarvestState {
  const c = s.curated;
  if (c && c.reviewedBy && c.harvest !== "unknown") return c.harvest;
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
