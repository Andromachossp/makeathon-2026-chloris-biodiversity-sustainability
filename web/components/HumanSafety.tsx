"use client";

import { useI18n } from "@/lib/i18n";
import { HUMAN_HAZARDS } from "@/lib/human-safety";
import { ShieldIcon, WarnIcon } from "./Icons";

export function HumanSafety({ slug }: { slug: string }) {
  const { t } = useI18n();
  const record = HUMAN_HAZARDS[slug];

  return (
    <section aria-labelledby="human-safety-title" className={`rounded-[10px] border p-4 ${record?.kind === "poison" ? "border-[#B3262E] bg-[#B3262E]/10" : record ? "border-amber-700 bg-amber-100/50" : "border-paper-ink/30"}`}>
      <h2 id="human-safety-title" className="flex items-center gap-2 font-display text-xl font-semibold">
        {record ? <WarnIcon className="h-6 w-6 shrink-0" /> : <ShieldIcon className="h-6 w-6 shrink-0" />}
        {t.humanSafety.title}
      </h2>
      {record ? (
        <>
          <p className="mt-2 font-semibold">{t.humanSafety.hazards[record.kind].label}</p>
          <p className="mt-1 text-sm">{t.humanSafety.hazards[record.kind].detail}</p>
          <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block min-h-[44px] py-2 text-sm underline">{t.humanSafety.source[record.source]} ↗</a>
          <p className="text-xs opacity-80">{t.humanSafety.pending}</p>
        </>
      ) : (
        <>
          <p className="mt-2 font-semibold">{t.humanSafety.unknown}</p>
          <p className="mt-1 text-sm">{t.humanSafety.unknownDetail}</p>
        </>
      )}
    </section>
  );
}
