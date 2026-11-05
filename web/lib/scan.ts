import type { Names } from "./types";
import type { Species } from "./types";

/** Photo-match confidence tiers (Pl@ntNet score, 0 to 1). Change them here only. */
export const CONFIDENCE_LIKELY_MIN = 0.7;
export const CONFIDENCE_POSSIBLE_MIN = 0.4;
export type ConfidenceTier = "likely" | "possible" | "unsure";

export function confidenceTier(score: number): ConfidenceTier {
  if (score >= CONFIDENCE_LIKELY_MIN) return "likely";
  if (score >= CONFIDENCE_POSSIBLE_MIN) return "possible";
  return "unsure";
}

export interface ScanImage { url: string; credit: string; organ?: string | null }
export interface ScanCandidate {
  name: string;
  score: number;
  commonNames: string[];
  powoId: string | null;
  gbifKey: number | null;
  images: ScanImage[];
}
export interface IdentifyResponse {
  candidates: ScanCandidate[];
  remaining?: number | null;
  /** Only on cached sample results: where, when and with which API version the result was fetched. */
  source?: string;
  apiVersion?: string;
  fetchedAt?: string;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // the route rejects anything larger
export const RESIZE_MAX_PX = 1000;

const norm = (s: string) => s.replace(/×/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

/** Match a Pl@ntNet candidate to our catalogue: POWO id first, then GBIF key, then the (accepted or synonym) name. */
export function matchCandidate(c: ScanCandidate, names: Names, species: Species[]): Species | null {
  const slug = (c.powoId && names.byPowo[c.powoId]) || (c.gbifKey && names.byGbif[String(c.gbifKey)]) || names.byName[norm(c.name)];
  return slug ? species.find((s) => s.slug === slug) ?? null : null;
}
