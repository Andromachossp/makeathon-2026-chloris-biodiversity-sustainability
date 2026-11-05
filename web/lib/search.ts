import type { Species } from "./types";

const GREEK_LETTERS = /[Ͱ-Ͽἀ-῿]/;

/** Accent- and case-insensitive: "Δίκταμο" matches "δικταμο", "Origanum" matches "origanum". */
export function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/ς/g, "σ").replace(/[×.,()]/g, " ").replace(/\s+/g, " ").trim();
}

export const hasGreekLetters = (s: string) => GREEK_LETTERS.test(s);

export interface SearchIndexEntry { s: Species; names: string[] }

/** Names we search: Latin, English, and the Greek name only when it is written in Greek letters. We never invent names. */
export function buildIndex(plants: Species[]): SearchIndexEntry[] {
  return plants.map((s) => ({
    s,
    names: [s.name, s.nameEn, s.nameEl && hasGreekLetters(s.nameEl) ? s.nameEl : null].filter((n): n is string => !!n).map(norm),
  }));
}

function nameScore(name: string, token: string): number {
  if (name === token) return 100;
  if (name.startsWith(token)) return 80;
  if (name.split(" ").some((w) => w.startsWith(token))) return 60;
  if (name.includes(token)) return 30;
  return 0;
}

/** Type-ahead search: every typed word must match one of the plant's names; best matches first, then higher prototype score. */
export function searchPlants(query: string, index: SearchIndexEntry[]): Species[] {
  const tokens = norm(query).split(" ").filter(Boolean);
  if (tokens.length === 0) return [];
  const hits: { s: Species; score: number }[] = [];
  for (const { s, names } of index) {
    let total = 0;
    for (const tok of tokens) {
      const best = Math.max(...names.map((n) => nameScore(n, tok)));
      if (best === 0) { total = 0; break; }
      total += best;
    }
    if (total > 0) hits.push({ s, score: total });
  }
  return hits.sort((a, b) => b.score - a.score || b.s.risk.score - a.s.risk.score).map((h) => h.s);
}
