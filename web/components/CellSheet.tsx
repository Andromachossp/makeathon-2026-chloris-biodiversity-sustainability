"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useI18n } from "@/lib/i18n";
import { displayName } from "@/lib/species";
import type { Cell, Species } from "@/lib/types";
import { CloseIcon } from "./Icons";
import { RiskChip } from "./Risk";

/** "382_237" → "38.2–38.3°N, 23.7–23.8°E" */
export function cellLabel(id: string, size: number): string {
  const [i, j] = id.split("_").map(Number);
  const f = (v: number) => (Math.round(v * 10) / 10).toFixed(1);
  return `${f(i * size)}–${f((i + 1) * size)}°N, ${f(j * size)}–${f((j + 1) * size)}°E`;
}

export function CellSheet({ cell, size, species, onClose }: { cell: Cell; size: number; species: Species[]; onClose: () => void }) {
  "use no memo";
  const { t, locale } = useI18n();
  const rows = useMemo(() => cell.s.map((i) => species[i]).sort((a, b) => b.risk.score - a.risk.score), [cell, species]);
  const scroller = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scroller.current, estimateSize: () => 64, overscan: 6 });

  return (
    <section aria-label={t.map.list}
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[55%] flex-col rounded-t-[14px] border-t border-line bg-moss md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none md:border-l md:border-t-0">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-line md:hidden" aria-hidden="true" />
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div>
          <h2 className="font-mono text-sm">{t.map.cellTitle} {cellLabel(cell.id, size)}</h2>
          <p className="mt-0.5 text-sm text-dim">
            {rows.length} {t.map.species}{cell.nAtRisk > 0 && <> · {cell.nAtRisk} {t.map.atRiskIn}</>}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.map.close} className="flex h-11 w-11 items-center justify-center rounded-full border border-line">
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" role="list">
        <div style={{ height: virt.getTotalSize(), position: "relative" }}>
          {virt.getVirtualItems().map((v) => {
            const s = rows[v.index];
            const n = displayName(s, locale);
            return (
              <div key={s.slug} role="listitem" className="pb-1.5" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: v.size, transform: `translateY(${v.start}px)` }}>
                <Link href={`/species/${s.slug}`} className="flex h-full items-center gap-3 rounded-[10px] border border-line px-3 hover:bg-moss-2">
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${n.isFallback ? "font-serif italic" : "font-medium"}`}>{n.title}</span>
                    {!n.isFallback && <span className="block truncate font-serif text-xs italic text-dim">{s.name}</span>}
                  </span>
                  <RiskChip level={s.risk.level} score={s.risk.score} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
