"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { deleteSighting, listSightings, cellIdOf, type Sighting } from "@/lib/sightings";
import { RowsSkeleton } from "./Skeleton";
import { cellLabel } from "./CellSheet";
import { ClientOnly } from "./ClientOnly";

export function SightingsView() {
  return (
    <ClientOnly fallback={<RowsSkeleton rows={3} />}>
      <List />
    </ClientOnly>
  );
}

function List() {
  const { t, locale } = useI18n();
  const [items, setItems] = useState<Sighting[] | null>(null);
  useEffect(() => {
    let alive = true;
    listSightings().then((l) => alive && setItems(l)).catch(() => alive && setItems([]));
    return () => { alive = false; };
  }, []);

  if (items === null) return <RowsSkeleton rows={3} />;
  return (
    <section className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="font-display text-4xl font-semibold">{t.pages.sightings.title}</h1>
      <p className="mt-1 text-sm text-dim">{t.sightings.deviceOnly}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-dim">{t.sightings.empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface p-3">
              <div className="min-w-0">
                <p className="truncate font-serif italic">{s.scientificName}{!s.slug && <span className="ml-2 font-sans text-xs not-italic text-dim">· {t.sightings.unknownPlant}</span>}</p>
                <p className="mt-0.5 font-mono text-xs text-dim">
                  {new Date(s.capturedAt).toLocaleDateString(locale)} · {s.lat === null || s.lng === null ? t.sightings.noLocation : `${t.sightings.area} ${cellLabel(cellIdOf(s.lat, s.lng), 0.1)}`}
                </p>
              </div>
              <button type="button" onClick={async () => { await deleteSighting(s.id); setItems((cur) => (cur ?? []).filter((x) => x.id !== s.id)); }} className="min-h-[44px] rounded-full border border-line px-4 text-sm">{t.sightings.delete}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
