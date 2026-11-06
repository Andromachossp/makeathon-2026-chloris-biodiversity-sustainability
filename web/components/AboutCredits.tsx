"use client";

import { useI18n } from "@/lib/i18n";
import { SAMPLES } from "@/lib/samples";

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
        <li>{t.credits.plantnet}</li>
        <li>{t.credits.photos} <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0 ↗</a> · <a className="underline" href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">CC0 1.0 ↗</a> · <a className="underline" href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noreferrer">CC BY-NC 4.0 ↗</a></li>
        <li>{t.credits.evidence} <a className="underline" href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noreferrer">PubMed ↗</a> · <a className="underline" href="https://www.ema.europa.eu/en/human-regulatory-overview/herbal-medicinal-products" target="_blank" rel="noreferrer">EMA ↗</a></li>
        <li>
          {t.credits.samples}
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {SAMPLES.map((x) => (
              <li key={x.id}>
                <a className="underline" href={x.source} target="_blank" rel="noreferrer">{x.title}</a>, {x.author}, <a className="underline" href={x.licenceUrl} target="_blank" rel="noreferrer">{x.licence}</a>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </section>
  );
}
