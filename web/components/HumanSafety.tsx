"use client";

import { useI18n } from "@/lib/i18n";
import { HUMAN_POISONING } from "@/lib/human-safety";
import { ShieldIcon, WarnIcon } from "./Icons";

export function HumanSafety({ slug }: { slug: string }) {
  const { t } = useI18n();
  const record = HUMAN_POISONING[slug];

  return (
    <section aria-labelledby="human-safety-title" className={`rounded-[10px] border p-4 ${record ? "border-[#B3262E] bg-[#B3262E]/10" : "border-paper-ink/30"}`}>
      <h2 id="human-safety-title" className="flex items-center gap-2 font-display text-xl font-semibold">
        {record ? <WarnIcon className="h-6 w-6 shrink-0" /> : <ShieldIcon className="h-6 w-6 shrink-0" />}
        {t.humanSafety.title}
      </h2>
      {record ? (
        <>
          <p className="mt-2 font-semibold">{t.humanSafety.high}</p>
          <p className="mt-1 text-sm">{t.humanSafety.highDetail}</p>
          <a href={record.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block min-h-[44px] py-2 text-sm underline">{t.humanSafety.source} ↗</a>
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
