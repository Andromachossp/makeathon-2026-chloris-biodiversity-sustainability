"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useI18n } from "@/lib/i18n";
import { CloseIcon } from "./Icons";

export interface CellRow {
  id: string;
  label: string;
  value: string; // formatted metric for the current mode
  n: number;
  hot: boolean;
}

/** Keyboard- and screen-reader-friendly alternative to the map: every occupied square as a button. */
export function CellList({ rows, onPick, onClose, hint }: { rows: CellRow[]; onPick: (id: string) => void; onClose: () => void; hint: string }) {
  "use no memo";
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scroller.current, estimateSize: () => 72, overscan: 8 });

  return (
    <section aria-label={t.map.cellListTitle}
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col rounded-t-[14px] border-t border-line bg-surface md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-96 md:rounded-none md:border-l md:border-t-0">
      <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
        <div>
          <h2 className="font-display text-xl font-semibold">{t.map.cellListTitle}</h2>
          <p className="mt-0.5 text-xs text-dim">{hint}</p>
        </div>
        <button type="button" onClick={onClose} aria-label={t.map.close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line">
          <CloseIcon className="h-5 w-5" />
        </button>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" role="list">
        <div style={{ height: virt.getTotalSize(), position: "relative" }}>
          {virt.getVirtualItems().map((v) => {
            const r = rows[v.index];
            return (
              <div key={r.id} role="listitem" className="pb-1.5" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: v.size, transform: `translateY(${v.start}px)` }}>
                <button type="button" onClick={() => onPick(r.id)} className="flex h-full w-full flex-col justify-center gap-1 rounded-[10px] border border-line px-3 text-left hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-mono text-xs">{r.label}</span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-dim">
                    {r.hot && <span className="rounded-full bg-poppy px-2 py-0.5 font-semibold text-ink">{t.map.hotspotShort}</span>}
                    <span className="font-mono text-text">{r.value}</span>
                    <span>{r.n} {t.map.species}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
