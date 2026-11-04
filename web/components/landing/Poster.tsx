"use client";

import type { CellsFile } from "@/lib/types";
import { KX, LAT_C, LON_C, cellCentre } from "./geometry";

/** Static poster used when WebGL is missing or the user prefers reduced motion: same data, no motion. */
export function Poster({ cells, label }: { cells: CellsFile; label: string }) {
  const maxN = Math.max(...cells.cells.map((c) => c.s.length), 1);
  const w = 10.4 * KX, h = 7.2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {cells.cells.map((c) => {
        const [lon, lat] = cellCentre(c.id, cells.size);
        const x = (lon - (LON_C - 5.2)) * KX - (cells.size * KX) / 2;
        const y = h - (lat - (LAT_C - 3.6)) - cells.size / 2;
        const risk = c.nAtRisk > 0;
        return <rect key={c.id} x={x} y={y} width={cells.size * KX} height={cells.size} fill={risk ? "#E0653A" : "#7BE495"} opacity={risk ? 0.9 : 0.15 + 0.8 * Math.sqrt(c.s.length / maxN)} />;
      })}
    </svg>
  );
}
