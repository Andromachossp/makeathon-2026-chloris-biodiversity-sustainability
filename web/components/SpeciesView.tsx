"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useMeta, useSpecies } from "@/lib/data";
import { PART_KEYS, displayName, harvestState, partMissingText } from "@/lib/species";
import type { Species } from "@/lib/types";
import { HarvestBanner, RiskChip, Seal } from "./Risk";
import { IucnBadge } from "./IucnBadge";
import { MiniMap } from "./MiniMap";
import { ClientOnly } from "./ClientOnly";
import { SpeciesSkeleton } from "./Skeleton";

export function SpeciesView({ slug }: { slug: string }) {
  return (
    <ClientOnly fallback={<SpeciesSkeleton />}>
      <Suspense fallback={<SpeciesSkeleton />}>
        <Card slug={slug} />
      </Suspense>
    </ClientOnly>
  );
}

function Card({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const all = useSpecies();
  const meta = useMeta();
  const s = all.find((x) => x.slug === slug);

  if (!s) {
    return (
      <section className="mx-auto max-w-2xl p-4">
        <p>{t.species.notFound}</p>
        <Link href="/priorities" className="mt-4 inline-block text-saffron underline">{t.species.back}</Link>
      </section>
    );
  }

  const name = displayName(s, locale);
  const state = harvestState(s);
  const weights = meta.scoring.weights as Record<string, number>;
  const wsum = PART_KEYS.reduce((a, k) => a + (s.risk.parts[k] === null ? 0 : weights[k]), 0);
  const subs = (s.curated?.substitutes ?? []).map((sl) => all.find((x) => x.slug === sl)).filter((x): x is Species => !!x);
  const uses = s.curated ? (locale === "el" ? s.curated.usesEl || s.curated.usesEn : s.curated.usesEn) : "";
  const usesIsEn = locale === "el" && s.curated && !s.curated.usesEl && !!s.curated.usesEn;
  const ema = s.curated?.ema ?? "unknown";
  const years = s.stats.firstYear && s.stats.lastYear ? `${s.stats.firstYear}–${s.stats.lastYear}` : "—";

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <Link href="/priorities" className="min-h-[44px] self-start py-3 text-sm text-dim hover:text-text">← {t.species.back}</Link>

      <HarvestBanner state={state} />
      {subs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-dim">{t.harvest.substitutes}:</span>
          {subs.map((x) => (
            <Link key={x.slug} href={`/species/${x.slug}`} className="min-h-[44px] rounded-full border border-saffron px-4 py-2.5 text-sm text-saffron">
              {displayName(x, locale).title}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-[14px] bg-paper p-5 text-paper-ink shadow-[0_0_0_1px_rgba(42,36,24,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs tracking-wider">{s.cat}</p>
            <h1 className={`mt-3 font-serif text-3xl font-semibold leading-tight ${name.isFallback ? "italic" : ""}`}>
              {name.title}
              {name.enTag && <span className="ml-2 rounded border border-paper-ink/40 px-1 align-middle font-mono text-[10px]">{t.species.enTag}</span>}
            </h1>
            {!name.isFallback && <p className="mt-1 font-serif text-lg italic">{s.name}</p>}
            {s.authors && <p className="text-sm opacity-70">{s.authors}</p>}
          </div>
          <Seal score={s.risk.score} level={s.risk.level} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <IucnBadge code={s.iucn} onPaper />
          {s.endemic && <span className="rounded-full border border-paper-ink/50 px-3 py-1 text-xs">★ {t.species.endemic}</span>}
          <RiskChipOnPaper level={s.risk.level} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-[10px] border border-paper-ink/30 p-4 font-mono text-xs sm:grid-cols-4">
          {[[t.species.family, s.family], [t.species.records, s.stats.records.toLocaleString(locale)], [t.species.cells, String(s.stats.cells)], [t.species.years, years]].map(([k, v]) => (
            <div key={k}><dt className="uppercase tracking-wide opacity-60">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>
          ))}
        </dl>

        {(s.dataQuality.length > 0 || s.review.length > 0) && (
          <div className="mt-4 rounded-[10px] border border-dashed border-paper-ink/50 p-3 text-sm">
            <p className="font-semibold">{s.review.length > 0 ? t.species.review : t.species.dataNote}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {[...s.dataQuality, ...s.review].map((f) => <li key={f}>{t.species.flags[f]}</li>)}
            </ul>
            {s.reviewNote && <p className="mt-1 opacity-80">{s.reviewNote}</p>}
          </div>
        )}

        <h2 className="mt-6 font-serif text-xl font-semibold">{t.species.riskTitle}</h2>
        <ul className="mt-3 flex flex-col gap-3">
          {PART_KEYS.map((k) => {
            const v = s.risk.parts[k];
            const max = v === null ? 0 : (weights[k] / wsum) * 100;
            return (
              <li key={k}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{t.parts[k].name}</span>
                  <span className="font-mono text-xs">{v === null ? "—" : `${v} / ${max.toFixed(0)} ${t.parts.points}`}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-paper-ink/15" aria-hidden="true">
                  {v !== null && <div className="h-2 rounded-full bg-paper-ink" style={{ width: `${max ? (v / max) * 100 : 0}%` }} />}
                </div>
                <p className="mt-1 text-xs opacity-75">{v === null ? partMissingText(k, t) : t.parts[k].desc}</p>
              </li>
            );
          })}
        </ul>

        <h2 className="mt-6 font-serif text-xl font-semibold">{t.species.mapTitle}</h2>
        <div className="mt-3">
          {s.stats.cells > 0 ? <MiniMap slug={s.slug} /> : <p className="text-sm opacity-80">{t.species.noRecords}</p>}
        </div>

        <h2 className="mt-6 font-serif text-xl font-semibold">{t.species.usesTitle}</h2>
        {uses ? (
          <p className="mt-2 font-serif leading-relaxed">
            {uses}{usesIsEn && <span className="ml-1 rounded border border-paper-ink/40 px-1 font-mono text-[10px]">{t.species.enTag}</span>}
          </p>
        ) : (
          <p className="mt-2 text-sm">{t.species.usesNotReviewed}</p>
        )}
        {s.curated && (
          <p className="mt-2 text-sm">
            {t.species.ema}: <strong>{t.species.emaStatus[ema]}</strong>
            {s.curated.emaUrl && <> · <a href={s.curated.emaUrl} className="underline" target="_blank" rel="noreferrer">EMA ↗</a></>}
          </p>
        )}
        <p className="mt-3 rounded-[10px] bg-paper-ink/10 p-3 text-xs">{t.notMedicalAdvice}</p>

        <p className="mt-6 border-t border-paper-ink/25 pt-3 text-xs opacity-80">
          {t.species.sources}
          {s.powoId && <> <a className="underline" target="_blank" rel="noreferrer" href={`https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${s.powoId}`}>{t.species.powo} ↗</a></>}
        </p>
      </div>

      {s.stats.cells > 0 && (
        <Link href={`/map?species=${s.slug}`} className="min-h-[44px] self-start rounded-full bg-saffron px-6 py-3 font-semibold text-ink">{t.species.openMap}</Link>
      )}
    </article>
  );
}

/** Risk level label on paper: dark text, icon + word. */
function RiskChipOnPaper({ level }: { level: Species["risk"]["level"] }) {
  return <span className="[&>span]:!border-paper-ink/50 [&>span]:!text-paper-ink"><RiskChip level={level} /></span>;
}
