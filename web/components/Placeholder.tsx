"use client";

import { useI18n } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/en";

type PageKey = Exclude<keyof Dictionary["pages"], "home">;

export function Placeholder({ page }: { page: PageKey }) {
  const { t } = useI18n();
  const p = t.pages[page];
  return (
    <section className="mx-auto max-w-2xl p-4">
      <h1 className="font-display text-3xl font-semibold">{p.title}</h1>
      <p className="mt-3 text-dim">{p.placeholder}</p>
    </section>
  );
}
