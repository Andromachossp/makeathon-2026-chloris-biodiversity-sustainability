import { NODATA, RISK_RAMP, quantile, rampAt } from "@/lib/ramps";
import type { CellsFile, Species } from "@/lib/types";

/** Equirectangular projection fitted to Greece, in world units (x east, z south). Shared by the 3D scene and the poster. */
export const LON_C = 24.6;
export const LAT_C = 38.3;
export const KX = Math.cos((38 * Math.PI) / 180);
export const SCALE = 0.9; // world units per degree of latitude

export function project(lon: number, lat: number): [number, number] {
  return [(lon - LON_C) * KX * SCALE, -(lat - LAT_C) * SCALE];
}

export function cellCentre(id: string, size: number): [number, number] {
  const [i, j] = id.split("_").map(Number);
  return [(j + 0.5) * size, (i + 0.5) * size];
}

export const MIN_SPECIES_FOR_RISK = 5;

export interface Column {
  x: number;
  z: number;
  h: number;
  color: [number, number, number]; // linear-ish 0..1 rgb from the risk ramp
  n: number;
  mean: number | null;
}

export interface Landscape {
  columns: Column[];
  cell: number; // column footprint in world units
  riskRange: [number, number];
  maxN: number;
}

/** One column per occupied cell: height from species richness, colour from the average risk of its species. */
export function buildLandscape(cells: CellsFile, species: Species[]): Landscape {
  const stats = cells.cells.map((c) => ({
    id: c.id,
    n: c.s.length,
    mean: c.s.length >= MIN_SPECIES_FOR_RISK ? c.s.reduce((a, i) => a + species[i].risk.score, 0) / c.s.length : null,
  }));
  const vals = stats.flatMap((s) => (s.mean === null ? [] : [s.mean])).sort((a, b) => a - b);
  const lo = quantile(vals, 0.05), hi = quantile(vals, 0.98);
  const maxN = Math.max(...stats.map((s) => s.n), 1);
  const nodata: [number, number, number] = [0x46 / 255, 0x50 / 255, 0x6f / 255];
  void NODATA;
  const columns = stats.map((s) => {
    const [lon, lat] = cellCentre(s.id, cells.size);
    const [x, z] = project(lon, lat);
    const t = s.mean === null ? 0 : (s.mean - lo) / Math.max(hi - lo, 1e-6);
    return {
      x, z, n: s.n, mean: s.mean,
      h: 0.03 + Math.pow(s.n / maxN, 0.9) * 0.85,
      color: s.mean === null ? nodata : rampAt(RISK_RAMP, t),
    } satisfies Column;
  });
  return { columns, cell: cells.size * KX * SCALE * 0.9, riskRange: [lo, hi], maxN };
}
