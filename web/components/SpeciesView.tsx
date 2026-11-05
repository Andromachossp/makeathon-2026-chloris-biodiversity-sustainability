"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/lib/i18n";
import { useMeta, useSpecies, useVerdictConfig } from "@/lib/data";
import { PART_KEYS, displayName, harvestState, partMissingText } from "@/lib/species";
import type { Species } from "@/lib/types";
import { fillText, verdictFor } from "@/lib/verdict";
import { ClientOnly } from "./ClientOnly";
import { IucnBadge } from "./IucnBadge";
import { MiniMap } from "./MiniMap";
import { EvidenceSection } from "./EvidenceSection";
import { HarvestBanner } from "./Risk";
import { SpeciesSkeleton } from "./Skeleton";
import { VerdictBanner } from "./Verdict";

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
  const vcfg = useVerdictConfig();
  const s = all.find((x) => x.slug === slug);

  if (!s) {
    return (
      <section className="mx-auto max-w-2xl p-4">
        <p>{t.species.notFound}</p>
        <Link href="/plants" className="mt-4 inline-block text-saffron underline">{t.species.back}</Link>
      </section>
    );
  }

  const name = displayName(s, locale);
  const verdict = verdictFor(s, vcfg);
  const harvest = harvestState(s);
  const weights = meta.scoring.weights as Record<string, number>;
  const wsum = PART_KEYS.reduce((a, k) => a + (s.risk.parts[k] === null ? 0 : weights[k]), 0);
  const subs = harvest === "unknown" ? [] : (s.curated?.substitutes ?? []).map((sl) => all.find((x) => x.slug === sl)).filter((x): x is Species => !!x);
  const uses = s.curated ? (locale === "el" ? s.curated.usesEl || s.curated.usesEn : s.curated.usesEn) : "";
  const years = s.stats.firstYear && s.stats.lastYear ? `${s.stats.firstYear}–${s.stats.lastYear}` : "—";

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <Link href="/plants" className="min-h-[44px] self-start py-3 text-sm text-dim hover:text-text">← {t.species.back}</Link>

      {/* 1. verdict and one plain reason */}
      <VerdictBanner verdict={verdict} species={s} />

      {/* 2. names: common name first, Latin second */}
      <header>
        <h1 className={`font-display text-4xl font-semibold leading-tight ${name.isFallback ? "italic" : ""}`}>
          {name.title}
          {name.enTag && <span className="ml-2 rounded border border-line px-1 align-middle font-mono text-[10px] text-dim">{t.species.enTag}</span>}
        </h1>
        {!name.isFallback && <p className="mt-1 font-serif text-xl italic text-dim">{s.name}</p>}
        {s.featured && locale === "el" && (name.isFallback || name.enTag) && <p className="mt-1 text-xs text-dim">{t.species.greekNameNotReviewed}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {s.endemic && <span className="rounded-full border border-lavender px-3 py-1 text-xs text-lavender">★ {t.species.endemic}</span>}
          <IucnBadge code={s.iucn} />
        </div>
      </header>

      {/* 3. harvest advice only when a reviewed rule exists; otherwise say so, never imply it is safe */}
      <HarvestBanner state={harvest} />
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

      {/* 4. details */}
      <div className="rounded-[14px] bg-paper p-5 text-paper-ink shadow-[0_0_0_1px_rgba(26,32,54,0.25)]">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[10px] border border-paper-ink/30 p-4 font-mono text-xs sm:grid-cols-4">
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

        <h2 className="mt-6 font-display text-xl font-semibold">{t.species.mapTitle}</h2>
        <div className="mt-3">
          {s.stats.cells > 0 ? <MiniMap slug={s.slug} /> : <p className="text-sm opacity-80">{t.species.noRecords}</p>}
        </div>

        <EvidenceSection slug={s.slug} hasEvidence={meta.evidenceSlugs.includes(s.slug)} version={meta.evidenceVersion} counts={meta.evidenceCounts[s.slug]} prep={s.featured && s.curated ? { en: s.curated.prepEn, el: s.curated.prepEl, reviewedBy: s.curated.reviewedBy } : null} legacyUses={uses ? uses : undefined} />

        {/* the prototype score is a small detail, tucked away */}
        <details className="mt-6 rounded-[10px] border border-paper-ink/30 p-3">
          <summary className="min-h-[44px] cursor-pointer py-2 text-sm font-semibold">
            {t.species.protoScore}: {s.risk.score} <span className="font-normal opacity-70">· {t.species.riskTitle}</span>
          </summary>
          <p className="mt-1 text-xs opacity-80">{fillText(t.species.protoScoreOf, { n: s.risk.score })}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {PART_KEYS.map((k) => {
              const v = s.risk.parts[k];
              const max = v === null ? 0 : (weights[k] / wsum) * 100;
              return (
                <li key={k}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-medium"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: `var(--c-${k})` }} aria-hidden="true" />{t.parts[k].name}</span>
                    <span className="font-mono text-xs">{v === null ? "—" : `${v} / ${max.toFixed(0)} ${t.parts.points}`}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-paper-ink/15" aria-hidden="true">
                    {v !== null && <div className="h-2 rounded-full" style={{ width: `${max ? (v / max) * 100 : 0}%`, background: `var(--c-${k})` }} />}
                  </div>
                  <p className="mt-1 text-xs opacity-75">{v === null ? partMissingText(k, t) : t.parts[k].desc}</p>
                </li>
              );
            })}
          </ul>
        </details>

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
