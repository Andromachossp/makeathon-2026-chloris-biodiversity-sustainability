"use client";

import { NODATA, RISK_RAMP, rampAt } from "@/lib/ramps";
import type { CellsFile, Species } from "@/lib/types";
import { KX, LAT_C, LON_C, MIN_SPECIES_FOR_RISK, cellCentre } from "./geometry";

/** Static poster used when WebGL is missing: the same cells coloured by the risk ramp, no motion. */
export function Poster({ cells, species, label }: { cells: CellsFile; species: Species[]; label: string }) {
  const w = 10.4 * KX, h = 7.2;
  const mean = cells.cells.map((c) => (c.s.length >= MIN_SPECIES_FOR_RISK ? c.s.reduce((a, i) => a + species[i].risk.score, 0) / c.s.length : null));
  const vals = mean.flatMap((m) => (m === null ? [] : [m])).sort((a, b) => a - b);
  const lo = vals[Math.floor(vals.length * 0.05)] ?? 0, hi = vals[Math.floor(vals.length * 0.98)] ?? 1;
  const rgb = (t: number) => `rgb(${rampAt(RISK_RAMP, t).map((v) => Math.round(v * 255)).join(",")})`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {cells.cells.map((c, k) => {
        const [lon, lat] = cellCentre(c.id, cells.size);
        const x = (lon - (LON_C - 5.2)) * KX - (cells.size * KX) / 2;
        const y = h - (lat - (LAT_C - 3.6)) - cells.size / 2;
        const m = mean[k];
        return <rect key={c.id} x={x} y={y} width={cells.size * KX} height={cells.size} fill={m === null ? NODATA : rgb((m - lo) / Math.max(hi - lo, 1e-6))} />;
      })}
    </svg>
  );
}
