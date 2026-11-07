"use client";

import { Component, Suspense, use, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { loadJson } from "@/lib/data";
import { evidenceEl, localizeEvidence } from "@/lib/evidence-el";
import type { EvidenceEntry, EvidenceFile } from "@/lib/types";
import { fillText } from "@/lib/verdict";
import { CheckIcon, ClockIcon, DocIcon, FlaskIcon, HelpIcon, LeafIcon, ListIcon, ShieldIcon, UserIcon, WarnIcon } from "./Icons";
import { SafetyNotice } from "./SafetyNotice";
import { Skeleton, SkeletonScreen } from "./Skeleton";

const KIND_ICON = { traditional_use: LeafIcon, human_research: UserIcon, animal_or_lab: FlaskIcon, review: ListIcon, regulatory_monograph: DocIcon } as const;

/** "What has been studied": evidence cards for featured species. Not medical advice; no dosing; text comes only from reviewed config. */
export interface Preparations { en: string; el: string; reviewedBy: string | null }

export function EvidenceSection({ slug, hasEvidence, version, counts, legacyUses, prep }: { slug: string; hasEvidence: boolean; version: string; counts?: { entries: number; safetyNotes: number }; legacyUses?: string; prep?: Preparations | null }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="evidence-title" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="evidence-title" className="font-display text-xl font-semibold">{t.evidence.title}</h2>
        {hasEvidence && <span className="rounded-full border border-paper-ink/40 px-2 py-0.5 font-mono text-[11px]">{t.evidence.version}: {version}</span>}
      </div>
      <div className="mt-2"><SafetyNotice tone="paper" /></div>
      {prep && <TraditionalPreparations prep={prep} />}
      {hasEvidence ? (
        <Boundary fallback={<p className="mt-3 text-sm">{t.evidence.loadFailed}</p>}>
          <Suspense fallback={<EvidenceSkeleton entries={counts?.entries ?? 1} safety={counts?.safetyNotes ?? 0} />}>
            <Cards slug={slug} />
          </Suspense>
        </Boundary>
      ) : (
        <div className="mt-3">
          <p className="text-base font-semibold">{t.evidence.notReviewed}</p>
          <p className="mt-1 text-sm opacity-80">{t.evidence.notReviewedHelp}</p>
          {legacyUses && <p className="mt-3 font-serif leading-relaxed">{legacyUses}</p>}
        </div>
      )}
    </section>
  );
}

/** Traditional preparations for the featured species (written by the science lead). Filled in: shown; otherwise "Not reviewed yet". */
function TraditionalPreparations({ prep }: { prep: Preparations }) {
  const { t, locale } = useI18n();
  const text = locale === "el" ? prep.el || prep.en : prep.en || prep.el;
  const tag = text && locale === "el" && !prep.el && prep.en ? "EN" : text && locale === "en" && !prep.en && prep.el ? "EL" : null;
  return (
    <div className="mt-3 rounded-[12px] border border-paper-ink/30 bg-white/40 p-4">
      <p className="text-xs font-semibold"><span className="inline-flex items-center gap-1.5 rounded-full border border-paper-ink/50 px-2.5 py-1"><LeafIcon className="h-4 w-4" />{t.evidence.kinds.traditional_use}</span></p>
      <h3 className="mt-2 font-display text-lg font-semibold">{t.species.prepTitle}</h3>
      {text ? (
        <>
          <p className="mt-2 font-serif leading-relaxed">{text}{tag && <span className="ml-1 rounded border border-paper-ink/40 px-1 font-mono text-[10px]">{tag}</span>}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs">
            {prep.reviewedBy ? <CheckIcon className="h-4 w-4 shrink-0" /> : <ClockIcon className="h-4 w-4 shrink-0" />}
            {prep.reviewedBy ? fillText(t.species.prepReviewedBy, { name: prep.reviewedBy }) : t.species.prepNotSpecialist}
          </p>
        </>
      ) : (
        <p className="mt-2">{t.species.prepNotReviewed}</p>
      )}
    </div>
  );
}

function Cards({ slug }: { slug: string }) {
  const { t, locale } = useI18n();
  const file = use(loadJson<EvidenceFile>(`evidence/${slug}.json`));
  const entries = file.entries.map((e) => localizeEvidence(e, locale));
  const safety = [...new Set(entries.flatMap((e) => (e.safetyNote ? [e.safetyNote] : [])))];
  const untranslated = locale === "el" && file.entries.some((e) => !evidenceEl[e.sourceId]);
  return (
    <div className="mt-3 flex flex-col gap-4">
      {safety.map((text) => (
        <aside key={text} role="note" className="rounded-[12px] border-2 border-[#B3262E] bg-[#B3262E]/10 p-4">
          <p className="flex items-center gap-2 font-semibold"><ShieldIcon className="h-5 w-5 shrink-0 text-[#B3262E]" />{t.evidence.safetyTitle}</p>
          <p className="mt-1 text-sm">{text}</p>
          {untranslated && <p className="mt-1 text-[11px] opacity-70">{t.evidence.sourceEnglish}</p>}
        </aside>
      ))}
      <ol className="flex flex-col gap-4">
        {entries.map((e) => <li key={`${e.sourceType}-${e.sourceId}`}><Card e={e} /></li>)}
      </ol>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</dt><dd className="mt-0.5 text-sm">{children}</dd></div>;
}

function Card({ e }: { e: EvidenceEntry }) {
  const { t, locale } = useI18n();
  const KindIcon = KIND_ICON[e.kind];
  const val = (v: string) => (v === "unknown" ? t.evidence.unknown : v);
  const verified = e.verification === "checked against linked source";
  const date = new Date(`${e.verifiedAt}T00:00:00`).toLocaleDateString(locale);
  const reviewPending = e.specialistReview === "pending";
  return (
    <article className="rounded-[12px] border border-paper-ink/30 bg-white/40 p-4">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-paper-ink/50 px-2.5 py-1"><KindIcon className="h-4 w-4" />{t.evidence.kinds[e.kind]}</span>
        {locale === "el" && !evidenceEl[e.sourceId] && <span className="font-normal opacity-70">{t.evidence.sourceEnglish}</span>}
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold leading-snug">{e.title}</h3>
      <p className="mt-2 font-serif leading-relaxed">{e.finding}</p>

      <div className="mt-3 rounded-[10px] border-l-4 border-[#8A5A00] bg-[#F6B93B]/25 p-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><WarnIcon className="h-4 w-4 shrink-0" />{t.evidence.limitations}</p>
        <p className="mt-1 text-sm">{e.limitations}</p>
      </div>

      <details className="mt-3 rounded-[10px] border border-paper-ink/30 px-3">
        <summary className="min-h-[44px] cursor-pointer py-2.5 text-sm font-semibold">{t.evidence.details}</summary>
        <dl className="grid gap-3 pb-3 pt-1 sm:grid-cols-2">
          <Detail label={t.evidence.design}>{val(e.design)}</Detail>
          <Detail label={t.evidence.plantPart}>{val(e.plantPart)}</Detail>
          <Detail label={t.evidence.preparation}>{val(e.preparation)}</Detail>
          <Detail label={t.evidence.source}>{t.evidence.sourceTypes[e.sourceType]} · <span className="font-mono text-xs">{val(locale === "el" ? e.sourceId.split(" (")[0] : e.sourceId)}</span></Detail>
          <Detail label={t.evidence.verification}>
            <span className="inline-flex items-start gap-1.5">{verified ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <HelpIcon className="mt-0.5 h-4 w-4 shrink-0" />}{verified ? fillText(t.evidence.verifiedOn, { date }) : t.evidence.unverified}</span>
          </Detail>
          <Detail label={t.evidence.specialist}>
            <span className="inline-flex items-start gap-1.5">{reviewPending ? <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}{reviewPending ? t.evidence.reviewPending : fillText(t.evidence.reviewed, { text: e.specialistReview })}</span>
          </Detail>
        </dl>
        {e.sourceUrl !== "unknown" && (
          <a href={e.sourceUrl} target="_blank" rel="noreferrer noopener" className="mb-3 inline-flex min-h-[44px] items-center underline">{t.evidence.readSource} ↗</a>
        )}
      </details>
    </article>
  );
}

/** Matches the final layout so nothing jumps: the same number of safety notes and cards as the loaded file
    (counts come from meta.json), with heights measured on a phone (about 19 rem per safety note, 44 rem per card)
    and a laptop (about 11.5 rem and 28 rem). */
function EvidenceSkeleton({ entries, safety }: { entries: number; safety: number }) {
  return (
    <SkeletonScreen className="mt-3 flex flex-col gap-4">
      {Array.from({ length: safety }, (_, i) => (
        <div key={`s${i}`} className="flex min-h-[19rem] flex-col gap-3 rounded-[12px] border-2 border-paper-ink/20 p-4 md:min-h-[11.5rem]">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
        </div>
      ))}
      {Array.from({ length: entries }, (_, i) => (
        <div key={i} className="flex min-h-[43rem] flex-col gap-3 rounded-[12px] border border-paper-ink/20 p-4 md:min-h-[28rem]">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-1 h-32 w-full rounded-[10px]" />
          <Skeleton className="mt-auto h-11 w-full rounded-[10px]" />
        </div>
      ))}
    </SkeletonScreen>
  );
}

/** Keeps a failed evidence download (for example offline, not cached yet) from breaking the whole plant page. */
class Boundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
