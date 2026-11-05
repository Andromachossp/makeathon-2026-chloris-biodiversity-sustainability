"use client";

import { useI18n } from "@/lib/i18n";
import type { Species } from "@/lib/types";
import { reasonText, type Verdict, type VerdictKey } from "@/lib/verdict";
import { HelpIcon, LeafIcon, ShieldIcon, TriangleIcon } from "./Icons";

const STYLE: Record<VerdictKey, { Icon: typeof LeafIcon; chip: string; banner: string }> = {
  protect: { Icon: ShieldIcon, chip: "bg-risk-high text-risk-high-on", banner: "bg-risk-high text-risk-high-on" },
  care: { Icon: TriangleIcon, chip: "bg-risk-moderate text-risk-moderate-on", banner: "bg-risk-moderate text-risk-moderate-on" },
  notThreatened: { Icon: LeafIcon, chip: "bg-risk-low text-risk-low-on", banner: "bg-risk-low text-risk-low-on" },
  nodata: { Icon: HelpIcon, chip: "border border-dashed border-dim text-text", banner: "border-2 border-dashed border-dim bg-surface text-text" },
};

/** Coloured verdict: always icon + words, never colour alone. */
export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();
  const { Icon, chip } = STYLE[verdict.key];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${chip}`}>
      <Icon className="h-4 w-4" />
      {t.verdict[verdict.key]}
    </span>
  );
}

/** Big verdict at the top of a plant page, with one plain sentence of reason and the "not advice" line. */
export function VerdictBanner({ verdict, species }: { verdict: Verdict; species: Species }) {
  const { t } = useI18n();
  const { Icon, banner } = STYLE[verdict.key];
  return (
    <section aria-label={t.verdict.label} className={`rounded-[14px] p-4 ${banner}`}>
      <p className="flex items-center gap-3 font-display text-2xl font-semibold leading-tight">
        <Icon className="h-8 w-8 shrink-0" />
        {t.verdict[verdict.key]}
      </p>
      <p className="mt-2 text-base">{reasonText(verdict, species, t)}</p>
      <p className="mt-2 text-xs opacity-80">{t.verdict.notAdvice}</p>
    </section>
  );
}
