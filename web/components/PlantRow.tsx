"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { displayName } from "@/lib/species";
import type { Species } from "@/lib/types";
import type { Verdict } from "@/lib/verdict";
import { IucnBadge } from "./IucnBadge";
import { VerdictChip } from "./Verdict";

/** One plant in a list: verdict first, then the common name, then the Latin name; the score is a small detail. */
export function PlantRow({ s, verdict, native = false }: { s: Species; verdict: Verdict; native?: boolean }) {
  const { t, locale } = useI18n();
  const n = displayName(s, locale);
  const content = (
    <>
      <span className="flex items-center justify-between gap-2">
        <VerdictChip verdict={verdict} />
        <span className="font-mono text-[11px] text-dim">{t.risk.scoreLabel} {s.risk.score}</span>
      </span>
      <span className={`block truncate text-base ${n.isFallback ? "font-display italic" : "font-medium"}`}>
        {n.title}{n.enTag && <span className="ml-1 rounded border border-line px-1 font-mono text-[10px] text-dim">{t.species.enTag}</span>}
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {!n.isFallback && <span className="mr-1 max-w-full truncate font-serif text-sm italic text-dim">{s.name}</span>}
        {(s.iucn === "CR" || s.iucn === "EN" || s.iucn === "VU") && <IucnBadge code={s.iucn} />}
        {s.endemic && <span className="rounded-full border border-lavender px-2 py-0.5 text-[11px] text-lavender">{t.species.endemic}</span>}
      </span>
    </>
  );
  const className = "flex h-full min-h-[104px] flex-col justify-center gap-1 rounded-[14px] border border-line bg-surface px-3 hover:bg-surface-2";
  // A full navigation avoids stale client-route state for the lower, virtualized section.
  if (native) return <a href={`/species/${s.slug}`} className={className}>{content}</a>;
  return <Link href={`/species/${s.slug}`} className={className}>{content}</Link>;
}
