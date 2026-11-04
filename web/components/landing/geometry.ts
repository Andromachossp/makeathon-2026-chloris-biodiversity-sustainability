import type { CellsFile } from "@/lib/types";

/** Shared projection: equirectangular fitted to Greece, in "world" units (~3.4 tall). Used by the WebGL scene and the static poster. */
export const LON_C = 24.6;
export const LAT_C = 38.3;
export const KX = Math.cos((38 * Math.PI) / 180);
export const SCALE = 0.5; // world units per degree of latitude

export function project(lon: number, lat: number): [number, number] {
  return [(lon - LON_C) * KX * SCALE, (lat - LAT_C) * SCALE];
}

export function cellCentre(id: string, size: number): [number, number] {
  const [i, j] = id.split("_").map(Number);
  return [(j + 0.5) * size, (i + 0.5) * size];
}

export interface ParticleData {
  start: Float32Array; // leaf
  map: Float32Array;   // cell positions
  rand: Float32Array;
  bright: Float32Array;
  risk: Float32Array;
}

/** Deterministic PRNG so server/client and reloads agree. */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildParticles(count: number, cells: CellsFile): ParticleData {
  const rnd = mulberry32(42);
  const start = new Float32Array(count * 3);
  const map = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const bright = new Float32Array(count);
  const risk = new Float32Array(count);

  // cumulative weights: more species => more particles
  const weights = cells.cells.map((c) => c.s.length);
  const cum: number[] = [];
  weights.reduce((a, w, i) => (cum[i] = a + w), 0);
  const total = cum[cum.length - 1] || 1;
  const maxN = Math.max(...weights, 1);
  const pick = () => {
    const r = rnd() * total;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
    return lo;
  };

  for (let i = 0; i < count; i++) {
    // leaf: ovate blade with a pointed tip, midrib, side veins and a short stem; rotated (not skewed)
    const L = 3.0;
    const width = (u: number) => 0.95 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 0.9);
    const kind = rnd();
    let x: number, y: number;
    if (kind < 0.05) {            // stem
      const u = rnd();
      x = Math.sin(u * 2.2) * 0.07; y = -L / 2 - u * 0.45;
    } else if (kind < 0.15) {     // midrib
      const u = rnd();
      x = (rnd() - 0.5) * 0.035; y = (u - 0.5) * L;
    } else if (kind < 0.30) {     // side veins
      const t0 = [0.18, 0.34, 0.5, 0.66][Math.floor(rnd() * 4)];
      const u = t0 + rnd() * (0.95 - t0);
      const side = rnd() < 0.5 ? -1 : 1;
      x = side * Math.min((u - t0) * 0.95, width(u) * 0.92); y = (u - 0.5) * L;
    } else {                      // blade fill, denser towards the edge so the outline reads
      const u = rnd();
      const e = Math.pow(rnd(), 0.6);
      x = (rnd() < 0.5 ? -1 : 1) * width(u) * e; y = (u - 0.5) * L;
    }
    const tilt = -0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
    const LEAF = 0.8; // smaller and lifted, so the stem and blade clear the tagline on phones
    start[i * 3] = (x * ct - y * st) * LEAF;
    start[i * 3 + 1] = (x * st + y * ct) * LEAF + 0.6;
    start[i * 3 + 2] = (rnd() - 0.5) * 0.12;

    const k = pick();
    const c = cells.cells[k];
    const [lon, lat] = cellCentre(c.id, cells.size);
    const [mx, my] = project(lon + (rnd() - 0.5) * cells.size, lat + (rnd() - 0.5) * cells.size);
    map[i * 3] = mx; map[i * 3 + 1] = my; map[i * 3 + 2] = (rnd() - 0.5) * 0.05;
    bright[i] = Math.pow(c.s.length / maxN, 0.5);
    risk[i] = c.nAtRisk > 0 ? 1 : 0;
    rand[i] = rnd();
  }
  return { start, map, rand, bright, risk };
}
