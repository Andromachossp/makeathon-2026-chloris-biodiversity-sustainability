"use client";

import { useI18n } from "@/lib/i18n";
import type { HarvestState } from "@/lib/species";
import type { RiskLevel } from "@/lib/types";
import { CheckIcon, CrossIcon, FlameIcon, LeafIcon, OctagonIcon, TriangleIcon, WarnIcon } from "./Icons";

const LEVEL_ICON = { low: LeafIcon, moderate: TriangleIcon, high: FlameIcon, critical: OctagonIcon } as const;
/** Filled chip: the ramp colour is the background, the label colour is chosen for contrast (>= 4.5:1). */
const LEVEL_CHIP = {
  low: "bg-risk-low text-risk-low-on",
  moderate: "bg-risk-moderate text-risk-moderate-on",
  high: "bg-risk-high text-risk-high-on",
  critical: "bg-risk-critical text-risk-critical-on",
} as const;

/** Risk level: always icon + text (+ optional score), never colour alone. */
export function RiskChip({ level, score }: { level: RiskLevel; score?: number }) {
  const { t } = useI18n();
  const Icon = LEVEL_ICON[level];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${LEVEL_CHIP[level]}`}>
      <Icon className="h-4 w-4" />
      {t.risk[level]}
      {score !== undefined && <span className="font-mono">{score}</span>}
    </span>
  );
}

const HARVEST_STYLE: Record<HarvestState, { Icon: typeof CheckIcon; cls: string }> = {
  safe: { Icon: CheckIcon, cls: "border-ok bg-ok/15 text-ok" },
  careful: { Icon: WarnIcon, cls: "border-risk-moderate-line bg-risk-moderate-line/15 text-risk-moderate-line" },
  "do-not-harvest": { Icon: CrossIcon, cls: "border-risk-high-line bg-risk-high-line/15 text-risk-high-line" },
  unknown: { Icon: WarnIcon, cls: "border-line bg-surface text-dim border-dashed" },
};

export function HarvestBanner({ state }: { state: HarvestState }) {
  const { t } = useI18n();
  const { Icon, cls } = HARVEST_STYLE[state];
  const label = t.harvest[state];
  return (
    <div role="note" className={`flex items-center gap-3 rounded-[14px] border px-4 py-4 text-lg font-semibold ${cls}`}>
      <Icon className="h-7 w-7 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

/** Round "seal" with the 0-100 score; stroke tones are darker variants that read on paper. */
export function Seal({ score, level }: { score: number; level: RiskLevel }) {
  const { t } = useI18n();
  const r = 34;
  const c = 2 * Math.PI * r;
  const stroke = { low: "#a88b00", moderate: "#c26a00", high: "#c7303a", critical: "#7b2a8c" }[level];
  return (
    <div className="relative h-[84px] w-[84px] shrink-0" role="img" aria-label={`${t.risk.scoreLabel}: ${score} ${t.risk.outOf}, ${t.risk[level]}`}>
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(26,32,54,0.15)" strokeWidth="6" />
        <circle cx="42" cy="42" r={r} fill="none" stroke={stroke} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-paper-ink">
        <span className="font-mono text-2xl font-bold leading-none">{score}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wide">{t.risk[level]}</span>
      </div>
    </div>
  );
}
