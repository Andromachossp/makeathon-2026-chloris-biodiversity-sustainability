"use client";

import { useI18n } from "@/lib/i18n";

/** Map and terrain credits required by the open data we use (Mapzen/AWS Terrain Tiles, OpenMapTiles, OSM). */
export function AboutCredits() {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-2xl px-4 pb-8">
      <h2 className="font-display text-2xl font-semibold">{t.credits.title}</h2>
      <ul className="mt-3 space-y-3 text-sm text-dim">
        <li>{t.credits.terrain} <a className="underline" href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Attribution ↗</a></li>
        <li>{t.credits.vectors}</li>
        <li>{t.credits.library}</li>
      </ul>
    </section>
  );
}
