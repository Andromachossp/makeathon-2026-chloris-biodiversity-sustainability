"use client";

import { use } from "react";
import type { CellsFile, Meta, Names, OccRow, Species } from "./types";

/** Fetch each data file once and keep the promise in memory. The service worker (Phase 4) handles offline. */
const cache = new Map<string, Promise<unknown>>();

export function loadJson<T>(path: string): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(`/data/${path}`).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(path)); // allow a retry after a failure
    cache.set(path, p);
  }
  return p;
}

/** Hooks suspend, so wrap the caller in <Suspense fallback={<Skeleton…/>}>. */
export const useSpecies = () => use(loadJson<Species[]>("species.json"));
export const useCells = () => use(loadJson<CellsFile>("cells.json"));
export const useMeta = () => use(loadJson<Meta>("meta.json"));
export const useVerdictConfig = () => useMeta().verdicts;
export const useNames = () => use(loadJson<Names>("names.json"));
export const loadOcc = (slug: string) => loadJson<OccRow[]>(`occ/${slug}.json`);
export const loadNatura = () => loadJson<GeoJSON.FeatureCollection>("natura.geojson");
