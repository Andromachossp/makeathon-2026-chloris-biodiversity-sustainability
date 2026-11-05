"use client";

import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useI18n } from "@/lib/i18n";
import { useSpecies } from "@/lib/data";
import { displayName } from "@/lib/species";
import { RiskChip } from "./Risk";
import { IucnBadge } from "./IucnBadge";
import { ClientOnly } from "./ClientOnly";
import { RowsSkeleton } from "./Skeleton";

export function PrioritiesView() {
  return (
    <ClientOnly fallback={<RowsSkeleton />}>
      <Suspense fallback={<RowsSkeleton />}>
        <List />
      </Suspense>
    </ClientOnly>
  );
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm ${on ? "border-saffron bg-saffron text-ink" : "border-line text-text"}`}>
      {on && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}

function List() {
  "use no memo"; // TanStack Virtual returns unmemoizable functions
  const { t, locale } = useI18n();
  const all = useSpecies();
  const [atRisk, setAtRisk] = useState(false);
  const [endemic, setEndemic] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [family, setFamily] = useState("");

  const families = useMemo(() => [...new Set(all.map((s) => s.family))].sort(), [all]);
  const rows = useMemo(
    () =>
      all
        .filter((s) => (!atRisk || s.risk.atRisk) && (!endemic || s.endemic) && (!featured || s.featured) && (!family || s.family === family))
        .sort((a, b) => b.risk.score - a.risk.score || a.name.localeCompare(b.name)),
    [all, atRisk, endemic, featured, family],
  );

  const scroller = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virt = useVirtualizer({ count: rows.length, getScrollElement: () => scroller.current, estimateSize: () => 112, overscan: 8 });

  return (
    <section className="mx-auto flex h-[calc(100dvh-3.5rem-6rem)] max-w-3xl flex-col px-4 pt-4 md:h-[calc(100dvh-3.5rem)]">
      <h1 className="font-display text-4xl font-semibold">{t.nav.priorities}</h1>
      <p className="mt-1 text-sm text-dim">{t.priorities.sub}</p>
      <div role="group" aria-label={t.priorities.filters} className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <Toggle on={atRisk} onClick={() => setAtRisk(!atRisk)}>{t.priorities.atRisk}</Toggle>
        <Toggle on={endemic} onClick={() => setEndemic(!endemic)}>{t.priorities.endemic}</Toggle>
        <Toggle on={featured} onClick={() => setFeatured(!featured)}>{t.priorities.featured}</Toggle>
        <select aria-label={t.priorities.family} value={family} onChange={(e) => setFamily(e.target.value)}
          className="min-h-[44px] max-w-[11rem] rounded-full border border-line bg-ink px-3 text-sm">
          <option value="">{t.priorities.allFamilies}</option>
          {families.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <p className="mt-2 font-mono text-xs text-dim" aria-live="polite">{rows.length.toLocaleString(locale)} {t.priorities.count}</p>

      {rows.length === 0 ? (
        <p className="mt-8 text-dim">{t.priorities.empty}</p>
      ) : (
        <div ref={scroller} className="mt-2 flex-1 overflow-y-auto" role="list">
          <div style={{ height: virt.getTotalSize(), position: "relative" }}>
            {virt.getVirtualItems().map((v) => {
              const s = rows[v.index];
              const n = displayName(s, locale);
              return (
                <div key={s.slug} role="listitem" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: v.size, transform: `translateY(${v.start}px)` }} className="pb-2">
                  <Link href={`/species/${s.slug}`} className="flex h-full flex-col justify-center gap-1 rounded-[14px] border border-line bg-surface px-3 hover:bg-surface-2">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-dim">{s.cat}</span>
                      <RiskChip level={s.risk.level} score={s.risk.score} />
                    </span>
                    <span className={`block truncate text-base ${n.isFallback ? "font-serif italic" : "font-medium"}`}>
                      {n.title}{n.enTag && <span className="ml-1 rounded border border-line px-1 font-mono text-[10px] text-dim">{t.species.enTag}</span>}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {!n.isFallback && <span className="mr-1 max-w-full truncate font-serif text-sm italic text-dim">{s.name}</span>}
                      {s.iucn !== "NE" && <IucnBadge code={s.iucn} />}
                      {s.endemic && <span className="rounded-full border border-lavender px-2 py-0.5 text-[11px] text-lavender">{t.species.endemic}</span>}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
