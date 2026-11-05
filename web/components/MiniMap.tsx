"use client";

import { Suspense, use, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { loadOcc, useCells } from "@/lib/data";
import { Skeleton } from "./Skeleton";

const LON0 = 19.3, LON1 = 29.7, LAT0 = 34.7, LAT1 = 41.9;
const KX = Math.cos((38 * Math.PI) / 180);
const W = (LON1 - LON0) * KX;
const H = LAT1 - LAT0;

function rect(id: string, size: number) {
  const [i, j] = id.split("_").map(Number);
  return { x: (j * size - LON0) * KX, y: LAT1 - (i + 1) * size, w: size * KX, h: size };
}

/** Light SVG map of where a species was recorded: no map tiles, works offline, Then / Now toggle. */
export function MiniMap({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<Skeleton className="aspect-[8.2/7.2] w-full" />}>
      <Inner slug={slug} />
    </Suspense>
  );
}

function Inner({ slug }: { slug: string }) {
  const { t } = useI18n();
  const occ = use(loadOcc(slug));
  const cells = useCells();
  const [period, setPeriod] = useState<"then" | "now">("now");
  const size = cells.size;

  const then = new Set(occ.filter((o) => o.o > 0).map((o) => o.c));
  const now = new Set(occ.filter((o) => o.w > 0).map((o) => o.c));
  const other = occ.filter((o) => o.o === 0 && o.w === 0).map((o) => o.c);
  const active = period === "then" ? then : now;
  const lostCells = period === "now" ? [...then].filter((c) => !now.has(c)) : [];

  return (
    <div>
      <div role="radiogroup" aria-label={t.species.mapTitle} className="mb-3 inline-flex rounded-full border border-paper-ink/40 p-0.5 text-sm">
        {(["then", "now"] as const).map((p) => (
          <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}
            className={`min-h-[44px] rounded-full px-4 ${period === p ? "bg-paper-ink text-paper" : "text-paper-ink"}`}>
            {t.species[p]} <span className="font-mono text-xs opacity-70">{t.species[p === "then" ? "thenHelp" : "nowHelp"]}</span>
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-paper-ink/[0.07]" role="img"
        aria-label={`${t.species.mapTitle}: ${active.size} ${t.species.cells}`}>
        {cells.cells.map((c) => {
          const r = rect(c.id, size);
          return <rect key={c.id} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(42,36,24,0.10)" />;
        })}
        {other.map((c) => {
          const r = rect(c, size);
          return <rect key={`o${c}`} x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(42,36,24,0.35)" />;
        })}
        {[...active].map((c) => {
          const r = rect(c, size);
          return <rect key={c} x={r.x} y={r.y} width={r.w} height={r.h} fill={period === "then" ? "#a8861f" : "#1f7a3a"} />;
        })}
        {lostCells.map((c) => {
          const r = rect(c, size);
          return <rect key={`l${c}`} x={r.x + 0.01} y={r.y + 0.01} width={r.w - 0.02} height={r.h - 0.02} fill="none" stroke="#a8861f" strokeWidth="0.03" strokeDasharray="0.06 0.05" />;
        })}
      </svg>
      <p className="mt-2 font-mono text-xs text-paper-ink/80">
        {active.size} {t.species.cells}
        {lostCells.length > 0 && <> · {lostCells.length} {t.species.gone}</>}
      </p>
    </div>
  );
}
