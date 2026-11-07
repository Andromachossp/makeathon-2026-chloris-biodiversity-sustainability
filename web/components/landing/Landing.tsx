"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import { canWebGL, deviceIsCapable, prefersReducedMotion } from "@/lib/device";
import { useI18n, type Locale } from "@/lib/i18n";
import { loadJson } from "@/lib/data";
import { RISK_RAMP, gradientCss } from "@/lib/ramps";
import type { CellsFile, Meta, Species } from "@/lib/types";
import { buildLandscape } from "./geometry";
import { Poster } from "./Poster";

// Three.js is loaded only here, on "/", and only when the browser can run it.
const LandscapeScene = dynamic(() => import("./Landscape"), { ssr: false });

const SECTIONS = ["flora", "where", "risk", "keep", "install"] as const;

function useLandingData() {
  const [data, setData] = useState<{ cells: CellsFile; meta: Meta; species: Species[] } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([loadJson<CellsFile>("cells.json"), loadJson<Meta>("meta.json"), loadJson<Species[]>("species.json")])
      .then(([cells, meta, species]) => alive && setData({ cells, meta, species }))
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return data;
}

function Loader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const { t } = useI18n();
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      // creep to 90 while loading, then finish quickly; never longer than 2.5 s in total
      const target = ready || now - t0 > 2200 ? 100 : 90;
      setN((v) => Math.min(target, v + (target === 100 ? 4 : 1.2)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);
  useEffect(() => {
    if (n >= 100) { const id = setTimeout(onDone, 250); return () => clearTimeout(id); }
  }, [n, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-ink p-6" role="status">
      <button type="button" onClick={onDone} className="min-h-[44px] self-end rounded-full border border-line px-4 text-sm text-dim">{t.landing.skip}</button>
      <div>
        <p className="font-mono text-7xl font-light tabular-nums text-saffron md:text-9xl">{String(Math.round(n)).padStart(3, "0")}</p>
        <p className="mt-3 font-sans text-sm font-medium tracking-wide text-dim">{t.landing.loader}</p>
      </div>
    </div>
  );
}

export function Landing() {
  const { t, locale, setLocale } = useI18n();
  const data = useLandingData();
  const progress = useRef(0);
  const [mode, setMode] = useState<"pending" | "animated" | "static" | "poster">("pending");
  const [intro, setIntro] = useState(false);
  const [dim, setDim] = useState(false);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    // animated 3D only on capable devices without reduced motion; otherwise one still render; no WebGL: SVG poster
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(!canWebGL() ? "poster" : !prefersReducedMotion() && deviceIsCapable() ? "animated" : "static");
    setSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin);
    let seen = false;
    try { seen = sessionStorage.getItem("chloris.intro") === "1"; } catch { /* ignore */ }
    if (!seen) setIntro(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      progress.current = Math.max(0, Math.min(window.scrollY / vh, 3));
      setDim(window.scrollY > vh * 3.3);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  const landscape = useMemo(() => (data ? buildLandscape(data.cells, data.species) : null), [data]);

  const finishIntro = () => {
    try { sessionStorage.setItem("chloris.intro", "1"); } catch { /* ignore */ }
    setIntro(false);
  };

  const medicinal = data?.meta.counts.medicinal;
  const atRisk = data?.meta.counts.atRisk;
  const hotspots = data ? data.cells.cells.filter((c) => c.hotspot === true).length : 0;
  const hotspotsKnown = data ? data.cells.cells.some((c) => c.hotspot !== null) : false;
  const locales: Locale[] = ["el", "en"];
  const panel = "rounded-[14px] bg-ink/75 p-4 backdrop-blur-sm";

  return (
    <div className="relative bg-ink text-text">
      {intro && <Loader ready={!!data && mode !== "pending"} onDone={finishIntro} />}

      {/* background: instanced 3D landscape, one column per occupied cell */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-700 ${dim ? "opacity-25" : "opacity-100"}`}>
        {landscape && (mode === "animated" || mode === "static") && <LandscapeScene data={landscape} progress={progress} animate={mode === "animated"} />}
        {data && mode === "poster" && <div className="flex h-full items-center justify-center p-6"><Poster cells={data.cells} species={data.species} label={t.landing.poster} /></div>}
      </div>

      {/* nav */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 px-4 py-3">
        <nav aria-label={t.nav.label} className="hidden gap-5 font-sans text-xs font-semibold uppercase tracking-wide md:flex">
          {SECTIONS.map((s, i) => (
            <a key={s} href={`#${s}`} className="text-dim hover:text-saffron"><span className="text-saffron">{String(i + 1).padStart(2, "0")}</span> {t.landing.menu[s]}</a>
          ))}
        </nav>
        <span className="flex items-center gap-2 md:hidden">
          <Image src="/chloris-logo.png" alt="" width={40} height={40} className="rounded-lg bg-white" />
          <span className="font-sans text-lg font-semibold tracking-tight">{t.appName}</span>
        </span>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t.language} className="flex rounded-full border border-line bg-ink/70 p-0.5 backdrop-blur">
            {locales.map((l) => (
              <button key={l} type="button" aria-pressed={locale === l} onClick={() => setLocale(l)}
                className={`min-h-[44px] min-w-[44px] rounded-full px-3 font-mono text-xs uppercase ${locale === l ? "bg-saffron text-ink" : "text-dim"}`}>{l}</button>
            ))}
          </div>
          <Link href="/home" className="flex min-h-[44px] items-center rounded-full bg-saffron px-5 text-sm font-semibold text-ink">{t.landing.openApp}</Link>
        </div>
      </header>

      <main className="relative z-10">
        {/* 01 hero */}
        <section id="flora" className="flex min-h-dvh flex-col justify-end px-5 pb-8 md:px-10">
          <Image src="/chloris-logo.png" alt="Chloris logo" width={128} height={128} priority className="mb-5 h-24 w-24 rounded-2xl bg-white md:h-32 md:w-32" />
          <p className="max-w-md rounded-[14px] bg-ink/55 p-2 text-base text-text backdrop-blur-sm md:text-lg">{t.tagline}</p>
          <h1 className="mt-4 select-none font-display font-semibold leading-[0.95] tracking-tight text-text"
            style={{ fontSize: "clamp(3.5rem, 17vw, 14rem)" }}>{t.appName}</h1>
          <p className="mt-4 font-sans text-xs font-semibold uppercase tracking-wide text-dim">↓ {t.landing.scroll}</p>
        </section>

        {/* 02 where */}
        <section id="where" className="flex min-h-dvh flex-col justify-between px-5 py-24 md:px-10">
          <div className={`max-w-xl ${panel}`}>
            <p className="font-mono text-sm text-saffron">02</p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-5xl">{t.landing.whereTitle}</h2>
            <p className="mt-3 text-dim">{t.landing.whereBody}</p>
            <div className="mt-4 max-w-xs text-xs text-dim">
              <div className="h-2.5 rounded-full" style={{ background: gradientCss(RISK_RAMP) }} aria-hidden="true" />
              <div className="mt-1 flex justify-between"><span>{t.landing.keyLow}</span><span>{t.landing.keyHigh}</span></div>
              <p className="mt-2">{t.landing.keyColour} · {t.landing.keyHeight}</p>
            </div>
          </div>
          <div className={`self-start ${panel}`}>
            <p className="font-sans text-[26vw] font-black leading-none tabular-nums text-saffron md:text-[11rem]">{medicinal?.toLocaleString(locale) ?? "—"}</p>
            <p className="mt-1 text-text">{t.landing.speciesCount}</p>
          </div>
        </section>

        {/* 03 risk */}
        <section id="risk" className="flex min-h-dvh flex-col justify-between px-5 py-24 md:px-10">
          <div className={`max-w-xl ${panel}`}>
            <p className="font-mono text-sm text-saffron">03</p>
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight md:text-5xl">{t.landing.riskTitle}</h2>
            <p className="mt-3 text-dim">{t.landing.riskBody}</p>
          </div>
          <div className={`self-start ${panel}`}>
            <p className="font-sans text-[26vw] font-black leading-none tabular-nums text-saffron md:text-[11rem]">{atRisk ?? "—"}</p>
            <p className="mt-1 text-text">{t.landing.atRiskCount}</p>
            {hotspotsKnown && <p className="mt-1 font-mono text-sm text-dim">{hotspots} {t.map.modes.hotspots.toLowerCase()}</p>}
          </div>
        </section>

        {/* 04 keep: sideways panels */}
        <section id="keep" className="min-h-dvh py-24">
          <div className="px-5 md:px-10">
            <p className="font-mono text-sm text-saffron">04</p>
            <h2 className="mt-2 font-display text-3xl font-semibold md:text-5xl">{t.landing.keepTitle}</h2>
          </div>
          <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:px-10" tabIndex={0} aria-label={t.landing.keepTitle}>
            {t.landing.keep.map((k) => (
              <li key={k.n} className="flex h-[22rem] w-[78vw] max-w-sm shrink-0 snap-start flex-col justify-between rounded-[14px] border border-line bg-surface/90 p-6 backdrop-blur">
                <span className="font-sans text-7xl font-black text-saffron">{k.n}</span>
                <div>
                  <h3 className="font-display text-2xl font-semibold">{k.t}</h3>
                  <p className="mt-2 text-dim">{k.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 05 install */}
        <section id="install" className="flex min-h-dvh flex-col justify-between px-5 py-24 md:px-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-mono text-sm text-saffron">05</p>
              <h2 className="mt-2 font-display text-3xl font-semibold md:text-5xl">{t.landing.installTitle}</h2>
              <p className="mt-3 max-w-md text-dim">{t.landing.installBody}</p>
              <ul className="mt-4 space-y-1 text-sm text-dim"><li>{t.landing.ios}</li><li>{t.landing.android}</li></ul>
              <Link href="/home" className="mt-6 inline-flex min-h-[44px] items-center rounded-full bg-saffron px-6 py-3 font-semibold text-ink">{t.landing.openApp}</Link>
            </div>
            <div className="justify-self-start rounded-[14px] bg-paper p-4 md:justify-self-center">
              {siteUrl && <QRCodeSVG value={siteUrl} size={176} bgColor="#F4EFE6" fgColor="#1A2036" title={siteUrl} />}
              <p className="mt-2 max-w-[11rem] break-all text-center font-mono text-[10px] text-paper-ink">{siteUrl}</p>
            </div>
          </div>
          <footer className="mt-16 text-xs text-dim">
            <p>{t.landing.credits}</p>
            <p className="mt-1">{t.safety.notice}</p>
          </footer>
        </section>
      </main>
    </div>
  );
}
