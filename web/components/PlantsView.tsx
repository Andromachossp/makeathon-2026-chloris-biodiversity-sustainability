"use client";

import Link from "next/link";
import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useI18n } from "@/lib/i18n";
import { useSpecies, useVerdictConfig } from "@/lib/data";
import { buildIndex, hasGreekLetters, searchPlants } from "@/lib/search";
import type { Species } from "@/lib/types";
import { fillText, hasEnoughData, verdictFor } from "@/lib/verdict";
import { ClientOnly } from "./ClientOnly";
import { SearchIcon } from "./Icons";
import { PlantRow } from "./PlantRow";
import { RowsSkeleton } from "./Skeleton";

export function PlantsView() {
  return (
    <ClientOnly fallback={<RowsSkeleton />}>
      <Suspense fallback={<RowsSkeleton />}>
        <Plants />
      </Suspense>
    </ClientOnly>
  );
}

type Item = { kind: "row"; s: Species } | { kind: "header"; n: number };

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm ${on ? "border-saffron bg-saffron text-ink" : "border-line text-text"}`}>
      {on && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}

function Plants() {
  "use no memo"; // TanStack Virtual returns unmemoizable functions
  const { t, locale } = useI18n();
  const all = useSpecies();
  const vcfg = useVerdictConfig();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [threatened, setThreatened] = useState(false);
  const [endemic, setEndemic] = useState(false);

  const index = useMemo(() => buildIndex(all), [all]);
  const searching = q.trim().length > 0;

  const { items, rankedCount, restCount, rawHits } = useMemo(() => {
    const passes = (s: Species) => (!threatened || vcfg.protect_iucn.includes(s.iucn)) && (!endemic || s.endemic);
    if (searching) {
      const hits = searchPlants(q, index);
      const rows = hits.filter(passes);
      return { items: rows.map((s): Item => ({ kind: "row", s })), rankedCount: rows.length, restCount: 0, rawHits: hits.length };
    }
    const ranked = all.filter((s) => hasEnoughData(s, vcfg) && passes(s)).sort((a, b) => b.risk.score - a.risk.score || a.name.localeCompare(b.name));
    // plants with too few records are not ranked: they sit below, under "Not enough data yet"
    const rest = all.filter((s) => !hasEnoughData(s, vcfg) && passes(s)).sort((a, b) => a.name.localeCompare(b.name));
    const list: Item[] = ranked.map((s) => ({ kind: "row", s }));
    if (rest.length) list.push({ kind: "header", n: rest.length }, ...rest.map((s): Item => ({ kind: "row", s })));
    return { items: list, rankedCount: ranked.length, restCount: rest.length, rawHits: -1 };
  }, [all, index, q, searching, threatened, endemic, vcfg]);

  const scroller = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line react-hooks/incompatible-library
  const virt = useVirtualizer({ count: items.length, getScrollElement: () => scroller.current, estimateSize: (i) => (items[i].kind === "header" ? 96 : 112), overscan: 8 });

  const message = items.length > 0 ? null : searching && rawHits === 0 ? (hasGreekLetters(q) ? t.plants.noGreekMatch : fillText(t.plants.noMatch, { q: q.trim() })) : t.plants.empty;

  return (
    <section className="mx-auto flex h-[calc(100dvh-3.5rem-6rem)] max-w-3xl flex-col px-4 pt-4 md:h-[calc(100dvh-3.5rem)]">
      <h1 className="font-display text-4xl font-semibold">{t.nav.plants}</h1>
      <p className="mt-1 text-sm text-dim">{t.plants.sub}</p>

      <div className="relative mt-4">
        <label htmlFor="plant-search" className="sr-only-label">{t.plants.searchLabel}</label>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dim" />
        <input id="plant-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.plants.searchPlaceholder}
          autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="search"
          className="min-h-[48px] w-full rounded-full border border-line bg-surface pl-12 pr-4 text-base text-text placeholder:text-dim" />
      </div>

      <div role="group" aria-label={t.plants.filters} className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Toggle on={threatened} onClick={() => setThreatened(!threatened)}>{t.plants.threatened}</Toggle>
        <Toggle on={endemic} onClick={() => setEndemic(!endemic)}>{t.plants.endemic}</Toggle>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="font-mono text-xs text-dim" aria-live="polite">
          {searching ? fillText(t.plants.results, { n: rankedCount.toLocaleString(locale) }) : `${rankedCount.toLocaleString(locale)} ${t.plants.count}`}
        </p>
        <Link href="/sightings" className="flex min-h-[44px] items-center text-sm text-saffron underline">{t.plants.mySightings}</Link>
      </div>

      {message ? (
        <p role="status" className="mt-6 text-dim">{message}</p>
      ) : (
        <div ref={scroller} className="flex-1 overflow-y-auto" role="list">
          <div style={{ height: virt.getTotalSize(), position: "relative" }}>
            {virt.getVirtualItems().map((v) => {
              const it = items[v.index];
              const pos = { position: "absolute" as const, top: 0, left: 0, width: "100%", height: v.size, transform: `translateY(${v.start}px)` };
              if (it.kind === "header") {
                return (
                  <div key="not-enough" role="listitem" style={pos} className="flex flex-col justify-end pb-3">
                    <h2 className="font-display text-xl font-semibold">{t.plants.notEnoughTitle}</h2>
                    <p className="text-xs text-dim">{fillText(t.plants.notEnoughHelp, { n: restCount, min: vcfg.min_records })}</p>
                  </div>
                );
              }
              return (
                <div key={it.s.slug} role="listitem" style={pos} className="pb-2">
                  <PlantRow s={it.s} verdict={verdictFor(it.s, vcfg)} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
