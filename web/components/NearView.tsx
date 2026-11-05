"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useCells, useSpecies, useVerdictConfig } from "@/lib/data";
import { cellIdOf, inGreeceBox, locateOnce, type LocateFailure } from "@/lib/geo";
import { fillText, verdictFor, type VerdictKey } from "@/lib/verdict";
import { cellLabel } from "./CellSheet";
import { ClientOnly } from "./ClientOnly";
import { PinIcon } from "./Icons";
import { PlantRow } from "./PlantRow";
import { RowsSkeleton, Skeleton, SkeletonScreen } from "./Skeleton";

/** The user's position is reduced to a 0.1 degree cell id the moment it arrives. Only that id is kept in memory:
    no coordinates are stored (not in state, storage or the network) and none are ever shown. */
type State =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "result"; cell: string | null; outside: boolean }
  | { kind: "error"; failure: LocateFailure };

export function NearView() {
  return (
    <ClientOnly fallback={<RowsSkeleton rows={4} />}>
      <Near />
    </ClientOnly>
  );
}

const SEVERITY: Record<VerdictKey, number> = { protect: 0, care: 1, notThreatened: 2, nodata: 3 };

function Near() {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: "idle" });

  async function find() {
    setState({ kind: "locating" });
    const r = await locateOnce();
    if ("failure" in r) return setState({ kind: "error", failure: r.failure });
    const outside = !inGreeceBox(r.lat, r.lng);
    setState({ kind: "result", cell: outside ? null : cellIdOf(r.lat, r.lng), outside }); // coordinates are dropped here
  }

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <h1 className="font-display text-4xl font-semibold">{t.pages.near.title}</h1>

      {(state.kind === "idle" || state.kind === "error") && (
        <>
          <p className="text-dim">{t.near.intro}</p>
          {state.kind === "error" && (
            <div role="alert" className="rounded-[14px] border border-risk-high-line bg-risk-high-line/10 p-4 text-sm text-text">
              <p>{state.failure === "denied" ? t.near.denied : t.near.unavailable}</p>
              <Link href="/map" className="mt-3 inline-flex min-h-[44px] items-center rounded-full border border-saffron px-5 text-saffron">{t.near.exploreMap}</Link>
            </div>
          )}
          <button type="button" onClick={find} className="flex min-h-[64px] items-center justify-center gap-3 rounded-[18px] bg-saffron px-6 text-xl font-semibold text-ink">
            <PinIcon className="h-7 w-7" />
            {state.kind === "error" ? t.near.tryAgain : t.near.button}
          </button>
          <p className="text-xs text-dim">{t.near.privacy}</p>
        </>
      )}

      {state.kind === "locating" && (
        <SkeletonScreen className="flex flex-col gap-3">
          <p className="text-dim" aria-live="polite">{t.near.locating}</p>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-28 w-full rounded-[14px]" />
          <Skeleton className="h-28 w-full rounded-[14px]" />
        </SkeletonScreen>
      )}

      {state.kind === "result" && (
        <Suspense fallback={<RowsSkeleton rows={4} />}>
          <Result cell={state.cell} outside={state.outside} onAgain={find} />
        </Suspense>
      )}
    </section>
  );
}

function Result({ cell, outside, onAgain }: { cell: string | null; outside: boolean; onAgain: () => void }) {
  const { t, locale } = useI18n();
  const cells = useCells();
  const species = useSpecies();
  const vcfg = useVerdictConfig();

  const data = cell ? cells.cells.find((c) => c.id === cell) : undefined;
  const rows = useMemo(() => {
    if (!data) return [];
    return data.s
      .map((i) => ({ s: species[i], v: verdictFor(species[i], vcfg) }))
      .sort((a, b) => SEVERITY[a.v.key] - SEVERITY[b.v.key] || b.s.risk.score - a.s.risk.score || a.s.name.localeCompare(b.s.name));
  }, [data, species, vcfg]);

  if (outside || !cell) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-[14px] border border-dashed border-dim p-4">{t.near.outside}</p>
        <Link href="/map" className="flex min-h-[48px] items-center self-start rounded-full border border-saffron px-5 text-saffron">{t.near.exploreMap}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-sm text-dim">{t.near.yourSquare}</p>
        <p className="font-mono text-lg">{cellLabel(cell, cells.size)}</p>
      </header>

      {!data ? (
        <>
          <p className="rounded-[14px] border border-dashed border-dim p-4">{t.near.noData}</p>
          <Link href="/map" className="flex min-h-[48px] items-center self-start rounded-full border border-saffron px-5 text-saffron">{t.near.exploreMap}</Link>
        </>
      ) : (
        <>
          <p className="font-display text-2xl font-semibold">{fillText(t.near.count, { n: rows.length.toLocaleString(locale) })}</p>
          <p className="text-xs text-dim">{t.near.note}</p>
          <ul className="flex flex-col gap-2">
            {rows.map(({ s, v }) => (
              <li key={s.slug} className="min-h-[112px]"><PlantRow s={s} verdict={v} /></li>
            ))}
          </ul>
          <p className="text-xs text-dim">{t.notMedicalAdvice}</p>
        </>
      )}
      <button type="button" onClick={onAgain} className="min-h-[48px] self-start rounded-full border border-line px-5">{t.near.tryAgain}</button>
    </div>
  );
}
