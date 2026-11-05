"use client";

import Link from "next/link";
import { Suspense, use, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";
import { loadJson, useMeta, useSpecies, useVerdictConfig } from "@/lib/data";
import { SAMPLES, type SampleDef } from "@/lib/samples";
import { MAX_UPLOAD_BYTES, RESIZE_MAX_PX, confidenceTier, matchCandidate, type IdentifyResponse, type ScanCandidate } from "@/lib/scan";
import { generalise, getPosition, saveSighting } from "@/lib/sightings";
import { displayName, harvestState } from "@/lib/species";
import type { Names } from "@/lib/types";
import { fillText, verdictFor } from "@/lib/verdict";
import { useOnline } from "@/lib/useOnline";
import { ClientOnly } from "./ClientOnly";
import { CheckIcon, HelpIcon, WarnIcon } from "./Icons";
import { HarvestBanner } from "./Risk";
import { ScanSkeleton, Skeleton, SkeletonScreen } from "./Skeleton";
import { VerdictBanner } from "./Verdict";

type View =
  | { kind: "idle" }
  | { kind: "working"; preview: string }
  | { kind: "result"; preview: string; candidates: ScanCandidate[]; sample?: SampleDef }
  | { kind: "error"; code: "offline" | "failed" | "rate_limited" | "bad_image" };

const subscribeCoarse = (cb: () => void) => {
  const m = window.matchMedia("(pointer: coarse)");
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

/** Resize in a canvas to at most RESIZE_MAX_PX on the long side, JPEG 0.8. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, RESIZE_MAX_PX / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")?.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.8));
}

export function ScanView() {
  return (
    <ClientOnly fallback={<ScanSkeleton />}>
      <Scan />
    </ClientOnly>
  );
}

function Scan() {
  const { t } = useI18n();
  const online = useOnline();
  const coarse = useSyncExternalStore(subscribeCoarse, () => window.matchMedia("(pointer: coarse)").matches, () => false);
  const [view, setView] = useState<View>({ kind: "idle" });
  const [drag, setDrag] = useState(false);
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const reset = () => setView({ kind: "idle" });

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 25 * 1024 * 1024) return setView({ kind: "error", code: "bad_image" });
    if (!online) return setView({ kind: "error", code: "offline" });
    const preview = URL.createObjectURL(file);
    setView({ kind: "working", preview });
    try {
      const blob = await shrink(file);
      if (blob.size > MAX_UPLOAD_BYTES) return setView({ kind: "error", code: "bad_image" });
      const form = new FormData();
      form.append("image", blob, "photo.jpg");
      form.append("organ", "auto");
      const res = await fetch("/api/identify", { method: "POST", body: form });
      if (res.status === 429) return setView({ kind: "error", code: "rate_limited" });
      if (res.status === 400) return setView({ kind: "error", code: "bad_image" });
      if (!res.ok) return setView({ kind: "error", code: "failed" });
      const data = (await res.json()) as IdentifyResponse;
      setView({ kind: "result", preview, candidates: data.candidates });
    } catch {
      setView({ kind: "error", code: "failed" });
    }
  }

  async function trySample(sample: SampleDef) {
    setView({ kind: "working", preview: sample.file });
    try {
      const res = await fetch(sample.result);
      const data = (await res.json()) as IdentifyResponse; // cached once from Pl@ntNet: no API call, no quota
      setView({ kind: "result", preview: sample.file, candidates: data.candidates, sample });
    } catch {
      setView({ kind: "error", code: "failed" });
    }
  }

  const errText = { offline: t.scan.errOffline, failed: t.scan.errFailed, rate_limited: t.scan.errRateLimited, bad_image: t.scan.errBadImage };

  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
      <h1 className="font-display text-4xl font-semibold">{t.scan.title}</h1>

      {(view.kind === "idle" || view.kind === "error") && (
        <>
          <p className="text-dim">{t.scan.intro}</p>
          {view.kind === "error" && <p role="alert" className="rounded-[14px] border border-risk-high-line bg-risk-high-line/10 p-3 text-sm text-risk-high-line">{errText[view.code]}</p>}

          {/* phones: camera and gallery; laptops: file picker with drag and drop */}
          <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only-label" tabIndex={-1} onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          <input ref={gallery} type="file" accept="image/*" className="sr-only-label" tabIndex={-1} onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
          {coarse ? (
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => camera.current?.click()} className="min-h-[64px] rounded-[18px] bg-saffron px-6 text-xl font-semibold text-ink">{t.scan.takePhoto}</button>
              <button type="button" onClick={() => gallery.current?.click()} className="min-h-[52px] rounded-[18px] border border-line px-6 text-base">{t.scan.choosePhoto}</button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files?.[0]); }}
              className={`flex flex-col items-center gap-4 rounded-[18px] border-2 border-dashed p-10 text-center ${drag ? "border-saffron bg-saffron/10" : "border-line bg-surface"}`}
            >
              <p className="text-lg text-text">{t.scan.dropHere}</p>
              <button type="button" onClick={() => camera.current?.click()} className="min-h-[48px] rounded-full bg-saffron px-6 font-semibold text-ink">{t.scan.chooseFile}</button>
            </div>
          )}

          <div className="mt-2">
            <h2 className="font-display text-xl font-semibold">{t.scan.trySample}</h2>
            <ul className="mt-3 grid grid-cols-3 gap-3">
              {SAMPLES.map((s) => (
                <li key={s.id}>
                  <button type="button" onClick={() => trySample(s)} className="flex min-h-[44px] w-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface text-left hover:bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.file} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <span className="px-2 py-2 text-xs">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-dim">{t.scan.sampleNote}</p>
          </div>
        </>
      )}

      {view.kind === "working" && (
        <SkeletonScreen className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={view.preview} alt={t.scan.yourPhoto} className="max-h-72 w-full rounded-[14px] object-cover" />
          <p className="text-dim" aria-live="polite">{t.scan.identifying}</p>
          <Skeleton className="h-24 w-full rounded-[14px]" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-14 w-full" />
        </SkeletonScreen>
      )}

      {view.kind === "result" && (
        <Suspense fallback={<ScanSkeleton />}>
          <Result view={view} onReset={reset} />
        </Suspense>
      )}
    </section>
  );
}

function Result({ view, onReset }: { view: Extract<View, { kind: "result" }>; onReset: () => void }) {
  const { t, locale } = useI18n();
  const species = useSpecies();
  const meta = useMeta();
  const vcfg = useVerdictConfig();
  const names = use(loadJson<Names>("names.json"));
  const [saved, setSaved] = useState<null | "saving" | { generalised: boolean; located: boolean }>(null);

  const best = view.candidates[0];
  const noPlant = !best;
  const tier = best ? confidenceTier(best.score) : "unsure";
  const matched = best && tier !== "unsure" ? matchCandidate(best, names, species) : null;
  const pct = (n: number) => Math.round(n * 100);
  const latinName = (c: ScanCandidate) => c.name;

  async function onSave() {
    if (!best || saved) return;
    setSaved("saving");
    // location only now, only if allowed; plants that may be at risk (or unknown to us) are rounded to a 10 km square before saving
    const atRisk = matched ? verdictFor(matched, vcfg).key === "protect" || matched.risk.atRisk : true;
    const pos = await getPosition();
    const g = pos ? generalise(pos.lat, pos.lng, atRisk) : null;
    await saveSighting({ slug: matched?.slug ?? null, scientificName: matched?.name ?? best.name, confidence: best.score, lat: g?.lat ?? null, lng: g?.lng ?? null, generalised: g?.generalised ?? false });
    setSaved({ generalised: !!g?.generalised, located: !!g });
  }

  const tierChip = (
    <p className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${tier === "likely" ? "border-ok text-ok" : tier === "possible" ? "border-risk-moderate-line text-risk-moderate-line" : "border-dashed border-dim text-dim"}`}>
      {tier === "likely" ? <CheckIcon className="h-4 w-4" /> : tier === "possible" ? <WarnIcon className="h-4 w-4" /> : <HelpIcon className="h-4 w-4" />}
      {tier === "likely" ? t.scan.tierLikely : tier === "possible" ? t.scan.tierPossible : t.scan.tierUnsure}
      {best && <span className="font-mono text-xs opacity-80">· {fillText(t.scan.confidence, { n: pct(best.score) })}</span>}
    </p>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={view.preview} alt={t.scan.yourPhoto} className="max-h-60 w-full rounded-[14px] object-cover" />
      {view.sample && (
        <p className="text-xs text-dim">
          {t.scan.sampleCredit}: <a className="underline" href={view.sample.source} target="_blank" rel="noreferrer">{view.sample.title}</a>, {view.sample.author},{" "}
          <a className="underline" href={view.sample.licenceUrl} target="_blank" rel="noreferrer">{view.sample.licence}</a>
        </p>
      )}

      {noPlant && <p className="rounded-[14px] border border-dashed border-dim p-4 text-text">{t.scan.noPlant}</p>}

      {/* not sure: names only. No verdict, no uses, no harvest content, no links into plant pages. */}
      {best && tier === "unsure" && (
        <>
          <div className="rounded-[14px] border-2 border-dashed border-dim p-4">{tierChip}</div>
          <ul className="flex flex-col gap-2">
            {view.candidates.slice(0, 3).map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2">
                <span className="font-serif italic">{latinName(c)}</span>
                <span className="font-mono text-xs text-dim">{pct(c.score)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* likely / possible, and in our catalogue: verdict first */}
      {best && tier !== "unsure" && matched && (
        <>
          <VerdictBanner verdict={verdictFor(matched, vcfg)} species={matched} />
          <header>
            <h2 className={`font-display text-3xl font-semibold leading-tight ${displayName(matched, locale).isFallback ? "italic" : ""}`}>{displayName(matched, locale).title}</h2>
            {!displayName(matched, locale).isFallback && <p className="font-serif text-lg italic text-dim">{matched.name}</p>}
          </header>
          {tierChip}
          <HarvestBanner state={harvestState(matched)} />
        </>
      )}

      {/* likely / possible, but not in our catalogue: say so plainly */}
      {best && tier !== "unsure" && !matched && (
        <>
          <div className="rounded-[14px] border-2 border-dashed border-dim p-4">
            <p className="flex items-center gap-3 font-display text-2xl font-semibold"><HelpIcon className="h-8 w-8 shrink-0" />{t.scan.notInCatalogueTitle}</p>
            <p className="mt-2">{fillText(t.scan.notInCatalogue, { n: meta.counts.medicinal.toLocaleString(locale) })}</p>
          </div>
          <header>
            <h2 className="font-serif text-2xl italic">{best.name}</h2>
            {best.commonNames.length > 0 && <p className="text-dim">{best.commonNames.join(", ")}</p>}
          </header>
          {tierChip}
        </>
      )}

      {/* possible match: compare with reference photos */}
      {best && tier === "possible" && best.images.length > 0 && (
        <div>
          <h3 className="font-display text-lg font-semibold">{t.scan.referencePhotos}</h3>
          <ul className="mt-2 grid grid-cols-2 gap-3">
            {best.images.map((im) => (
              <li key={im.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt={best.name} className="aspect-[4/3] w-full rounded-[10px] object-cover" loading="lazy" />
                <p className="mt-1 text-[11px] text-dim">{im.credit}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {best && tier !== "unsure" && view.candidates.length > 1 && (
        <div>
          <h3 className="font-display text-lg font-semibold">{t.scan.otherCandidates}</h3>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm">
            {view.candidates.slice(1, 3).map((c) => (
              <li key={c.name} className="flex justify-between gap-3"><span className="font-serif italic">{c.name}</span><span className="font-mono text-xs text-dim">{pct(c.score)}%</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* always */}
      <p role="note" className="rounded-[14px] border border-risk-moderate-line bg-risk-moderate-line/10 p-3 text-sm text-text">{t.scan.warning}</p>

      <div className="flex flex-wrap gap-3">
        {matched && tier !== "unsure" && <Link href={`/species/${matched.slug}`} className="flex min-h-[48px] items-center rounded-full border border-saffron px-5 text-saffron">{t.scan.seeFull}</Link>}
        {best && tier !== "unsure" && (
          <button type="button" onClick={onSave} disabled={!!saved} className="min-h-[48px] rounded-full bg-saffron px-6 font-semibold text-ink disabled:opacity-60">
            {saved === "saving" ? t.scan.saving : t.scan.saveSighting}
          </button>
        )}
        <button type="button" onClick={onReset} className="min-h-[48px] rounded-full border border-line px-5">{t.scan.scanAnother}</button>
      </div>
      {saved && saved !== "saving" && (
        <p role="status" className="text-sm text-ok">
          {t.scan.saved} {saved.generalised ? t.scan.savedGeneralised : ""} {saved.located ? "" : t.scan.savedNoLocation}
        </p>
      )}
    </div>
  );
}
