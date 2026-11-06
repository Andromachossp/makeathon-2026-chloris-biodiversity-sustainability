"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fillText } from "@/lib/verdict";
import type { PhotoResponse } from "@/lib/photo";
import { FlowerIcon } from "./Icons";
import { Skeleton } from "./Skeleton";

type State = { slug: string; photo: PhotoResponse | null; done: boolean };

/** The credit template up to the licence, so the licence itself can be rendered as a link. */
function creditPrefix(photo: PhotoResponse, p: { credit: string; creditNoName: string }): string {
  const template = photo.creator ? p.credit : p.creditNoName;
  return fillText(template.split("{licence}")[0], { creator: photo.creator });
}

/**
 * Header photo for the species page only. The frame has a fixed aspect ratio and the caption
 * area is a fixed height, so skeleton, photo and flower-icon states never shift the page.
 */
export function SpeciesPhoto({ slug, alt }: { slug: string; alt: string }) {
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
      <figcaption className="mt-2 min-h-[2.75rem] text-xs text-dim">
        {photo && loadedUrl === photo.url && (
          <>
            <span className="block">
              {creditPrefix(photo, p)}
              <a className="underline" href={photo.licenceUrl} target="_blank" rel="noreferrer license">{photo.licence}</a>
            </span>
          </>
        )}
        {pending && <Skeleton className="h-3 w-2/3" />}
        <span className="mt-0.5 block">{p.note}</span>
      </figcaption>
    </figure>
  );
}
