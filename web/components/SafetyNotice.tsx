"use client";

import { useI18n } from "@/lib/i18n";
import { ShieldIcon } from "./Icons";

/** The one standard safety notice (t.safety.notice, EN and EL). Shown wherever uses or evidence appear, and on /about.
    Do not write other "not medical advice" variants: this is the single source of the wording. */
export function SafetyNotice({ tone = "dark", size = "sm" }: { tone?: "dark" | "paper"; size?: "sm" | "md" }) {
  const { t } = useI18n();
  const box = tone === "paper" ? "bg-paper-ink/10 text-paper-ink" : "border border-line bg-surface text-text";
  return (
    <aside role="note" aria-label={t.safety.title} className={`flex gap-3 rounded-[12px] p-3 ${box} ${size === "md" ? "text-base" : "text-xs"}`}>
      <ShieldIcon className={`shrink-0 ${size === "md" ? "h-6 w-6" : "h-5 w-5"}`} />
      <p><strong>{t.safety.title}.</strong> {t.safety.notice}</p>
    </aside>
  );
}
