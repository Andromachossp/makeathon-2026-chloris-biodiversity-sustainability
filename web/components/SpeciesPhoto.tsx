"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fillText } from "@/lib/verdict";
import type { PhotoResponse } from "@/lib/photo";
import { FlowerIcon } from "./Icons";
import { Skeleton } from "./Skeleton";

type State = { slug: string; photo: PhotoResponse | null; done: boolean };

/**
 * Header photo for the species page only. The frame has a fixed aspect ratio and the caption
 * area is a fixed height, so skeleton, photo and flower-icon states never shift the page.
 */
export function SpeciesPhoto({ slug, alt, powoId }: { slug: string; alt: string; powoId: string | null }) {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ slug, photo: null, done: false });
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/photo/${encodeURIComponent(slug)}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? (r.json() as Promise<PhotoResponse>) : null))
      .then((photo) => setState({ slug, photo, done: true }))
      .catch((e) => {
        if (e?.name !== "AbortError") setState({ slug, photo: null, done: true }); // offline or failed: show the icon
      });
    return () => ctrl.abort();
  }, [slug]);

  const current = state.slug === slug ? state : { slug, photo: null, done: false };
  const photo = current.photo && current.photo.url !== failedUrl ? current.photo : null;
  const pending = !current.done || (photo !== null && loadedUrl !== photo.url);
  const p = t.species.photo;

  return (
    <figure className="mb-4">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] border border-line bg-surface">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- remote GBIF contributor image, sized by the host
          <img
            src={photo.url}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
            onLoad={() => setLoadedUrl(photo.url)}
            onError={() => setFailedUrl(photo.url)}
          />
        )}
        {pending && <Skeleton className="absolute inset-0" />}
        {current.done && !photo && (
          <div role="img" aria-label={p.none} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-dim">
            <FlowerIcon className="h-12 w-12" />
            <span className="text-xs">{p.none}</span>
          </div>
        )}
      </div>
      <figcaption className="mt-2 min-h-[5rem] text-xs text-dim">
        {photo && loadedUrl === photo.url && (
          <>
            <span className="block">
              {photo.creator ? (
                <>
                  {p.credit.split("{creator}")[0]}
                  <a className="underline" href={photo.url} target="_blank" rel="noreferrer">{photo.creator}</a>
                  {p.credit.split("{creator}")[1].split("{licence}")[0]}
                </>
              ) : fillText(p.creditNoName.split("{licence}")[0], {})}
              <a className="underline" href={photo.licenceUrl} target="_blank" rel="noreferrer license">{photo.licence}</a>
            </span>
          </>
        )}
        {pending && <Skeleton className="h-3 w-2/3" />}
        <span className="mt-0.5 block">{p.note}</span>
        {photo?.licence === "CC BY-NC 4.0" && loadedUrl === photo.url && <span className="block">{p.nonCommercial}</span>}
        {current.done && !photo && powoId && (
          <span className="mt-1 block">
            <a className="font-medium text-saffron underline" href={`https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:${encodeURIComponent(powoId)}/images`} target="_blank" rel="noreferrer">{p.kewImages} ↗</a>
            <span className="block">{p.identificationCaution}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
