"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setWorkerUrl } from "maplibre-gl";
import MapGL, { Layer, Marker, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { useI18n } from "@/lib/i18n";
import { loadNatura, loadOcc, useCells, useSpecies } from "@/lib/data";
import { slateStyle } from "@/lib/mapStyle";
import { AEGEAN, LAVENDER, NODATA, POPPY, RICH_RAMP, RISK_RAMP, SAFFRON, gradientCss, interpolateExpr, quantile, type Stop } from "@/lib/ramps";
import { displayName } from "@/lib/species";
import { CellList, type CellRow } from "./CellList";
import { CellSheet, cellLabel } from "./CellSheet";
import { CloseIcon, LocateIcon } from "./Icons";
import { MapSkeleton } from "./Skeleton";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type Mode = "risk" | "richness" | "hotspots";
const MIN_SPECIES_FOR_RISK = 5;

export default function MapView() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapInner />
    </Suspense>
  );
}

interface CellStat { id: string; n: number; r: number; hot: boolean; mean: number | null; }

function squares(stats: CellStat[], size: number, inset: number, props: (c: CellStat) => Record<string, unknown>) {
  return {
    type: "FeatureCollection" as const,
    features: stats.map((c) => {
      const [i, j] = c.id.split("_").map(Number);
      const g = size * inset;
      const [s, w, n, e] = [i * size + g, j * size + g, (i + 1) * size - g, (j + 1) * size - g];
      return {
        type: "Feature" as const,
        properties: { id: c.id, ...props(c) },
        geometry: { type: "Polygon" as const, coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] },
      };
    }),
  };
}

function hatchImage(): ImageData {
  const n = 16;
  const d = new ImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const on = (x + y) % 8 < 2;
      const k = (y * n + x) * 4;
      d.data[k] = 244; d.data[k + 1] = 239; d.data[k + 2] = 230; d.data[k + 3] = on ? 210 : 0;
    }
  return d;
}

/** Flat by default on low-end devices: few cores, little memory, data saver or reduced motion. */
function deviceIsCapable(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cores = nav.hardwareConcurrency ?? 4;
  return !reduce && !nav.connection?.saveData && cores >= 6 && (nav.deviceMemory === undefined || nav.deviceMemory >= 4);
}

function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-medium backdrop-blur ${on ? "border-saffron bg-saffron text-ink" : "border-line bg-ink/85 text-text"}`}>
      {children}
    </button>
  );
}

function MapInner() {
  const { t, locale } = useI18n();
  const cells = useCells();
  const species = useSpecies();
  const params = useSearchParams();
  const speciesSlug = params.get("species");
  const mapRef = useRef<MapRef>(null);
  const baseView = useRef<{ lng: number; lat: number; zoom: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("risk");
  const [threeD, setThreeD] = useState(() => deviceIsCapable());
  const [showNatura, setShowNatura] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [period, setPeriod] = useState<"then" | "now">("now");
  const [natura, setNatura] = useState<GeoJSON.FeatureCollection | null>(null);
  const [me, setMe] = useState<{ lng: number; lat: number } | null>(null);
  const [locError, setLocError] = useState(false);

  const size = cells.size;
  const focus = species.find((s) => s.slug === speciesSlug);
  const is3d = threeD && !focus; // a focused species is always shown flat so its cells stay visible
  const style = useMemo(() => slateStyle(locale), [locale]);

  // per-cell numbers: richness, at-risk count, hotspot flag, mean species risk (only with enough species)
  const stats = useMemo<CellStat[]>(
    () => cells.cells.map((c) => ({
      id: c.id, n: c.s.length, r: c.nAtRisk, hot: c.hotspot === true,
      mean: c.s.length >= MIN_SPECIES_FOR_RISK ? c.s.reduce((a, i) => a + species[i].risk.score, 0) / c.s.length : null,
    })),
    [cells, species],
  );
  const maxN = useMemo(() => stats.reduce((m, c) => Math.max(m, c.n), 1), [stats]);
  const hotspotsAvailable = cells.cells.some((c) => c.hotspot !== null);

  // ramp domains from the data (risk), so the colours spread over the real range
  const riskStops = useMemo<Stop[]>(() => {
    const v = stats.flatMap((c) => (c.mean === null ? [] : [c.mean])).sort((a, b) => a - b);
    const qs = [0.05, 0.4, 0.75, 0.98].map((q) => quantile(v, q));
    return qs.map((q, i) => [q, RISK_RAMP[i]] as Stop);
  }, [stats]);
  const richStops = useMemo<Stop[]>(() => {
    const at = [1, 8, 30, 80, 160, maxN];
    return at.map((n, i) => [n, RICH_RAMP[i]] as Stop);
  }, [maxN]);

  const geo = useMemo(
    () => squares(stats, size, is3d ? 0.1 : 0, (c) => ({
      m: c.mean ?? -1, n: c.n, hot: c.hot ? 1 : 0,
      h: mode === "hotspots" ? (c.hot ? 18000 + c.r * 12000 : 1500) : c.n * 90, // metres
    })),
    [stats, size, is3d, mode],
  );

  const colour = useMemo(() => {
    if (mode === "richness") return interpolateExpr("n", richStops);
    if (mode === "hotspots") return ["case", ["==", ["get", "hot"], 1], POPPY, NODATA];
    return ["case", ["<", ["get", "m"], 0], NODATA, interpolateExpr("m", riskStops)];
  }, [mode, richStops, riskStops]);
  const opacity = useMemo(() => {
    const base = mode === "hotspots" ? ["case", ["==", ["get", "hot"], 1], 0.95, 0.3] : 0.9;
    return focus ? 0.25 : base;
  }, [mode, focus]);

  useEffect(() => { loadNatura().then(setNatura).catch(() => setNatura(null)); }, []);

  useEffect(() => {
    const base = baseView.current;
    if (!ready || !base) return;
    // tilt the camera and shift it south so the pitched view keeps Greece centred and large
    mapRef.current?.getMap().easeTo({
      pitch: is3d ? 48 : 0, bearing: is3d ? -14 : 0,
      zoom: is3d ? base.zoom + 0.45 : base.zoom, center: is3d ? [base.lng, base.lat - 0.8] : [base.lng, base.lat], duration: 900,
    });
  }, [is3d, ready]);

  const occ = speciesSlug && focus && focus.stats.cells > 0 ? use(loadOcc(speciesSlug)) : null;
  const speciesGeo = occ
    ? squares(occ.map((o) => ({ id: o.c, n: 0, r: 0, hot: false, mean: null })), size, 0, (c) => {
        const o = occ.find((x) => x.c === c.id);
        return { then: o && o.o > 0 ? 1 : 0, now: o && o.w > 0 ? 1 : 0 };
      })
    : null;

  const onLoad = () => {
    const map = mapRef.current?.getMap();
    if (map && !map.hasImage("hatch")) map.addImage("hatch", hatchImage(), { pixelRatio: 2 });
    if (map) { const c = map.getCenter(); baseView.current = { lng: c.lng, lat: c.lat, zoom: map.getZoom() }; }
    setReady(true);
  };

  const onClick = (e: MapLayerMouseEvent) => {
    setListOpen(false);
    setSelected((e.features?.[0]?.properties?.id as string | undefined) ?? null);
  };

  const pickFromList = (id: string) => {
    const [i, j] = id.split("_").map(Number);
    setSelected(id);
    setListOpen(false);
    mapRef.current?.flyTo({ center: [(j + 0.5) * size, (i + 0.5) * size], zoom: 8, duration: 800 });
  };

  const locate = () => {
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lng: p.coords.longitude, lat: p.coords.latitude };
        setMe(pos);
        mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: 9 });
      },
      () => setLocError(true),
      { timeout: 10000 },
    );
  };

  const listRows = useMemo<CellRow[]>(() => {
    const val = (c: CellStat) => (mode === "richness" ? c.n : mode === "hotspots" ? (c.hot ? 1000 + c.n : c.n / 1000) : c.mean ?? -1);
    return [...stats].sort((a, b) => val(b) - val(a)).map((c) => ({
      id: c.id, label: cellLabel(c.id, size), n: c.n, hot: mode === "hotspots" && c.hot,
      value: mode === "richness" ? String(c.n) : mode === "hotspots" ? `${c.r} ${t.map.atRiskIn}` : c.mean === null ? "—" : `${c.mean.toFixed(1)} ${t.map.meanRisk}`,
    }));
  }, [stats, mode, size, t.map.meanRisk, t.map.atRiskIn]);

  const selectedCell = selected ? cells.cells.find((c) => c.id === selected) : undefined;
  const modes: Mode[] = hotspotsAvailable ? ["risk", "richness", "hotspots"] : ["risk", "richness"];
  const panelOpen = !!selectedCell || listOpen;

  return (
    <div className="relative h-[calc(100dvh-3.5rem-6rem)] overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      {!ready && <div className="absolute inset-0 z-30 bg-ink"><MapSkeleton /></div>}
      <MapGL
        ref={mapRef}
        initialViewState={{ bounds: [19.2, 34.6, 29.8, 41.9], fitBoundsOptions: { padding: { top: 70, bottom: 20, left: 12, right: 12 } } }}
        maxBounds={[15, 30.5, 34, 45.5]}
        minZoom={4}
        maxPitch={70}
        mapStyle={style}
        onLoad={onLoad}
        onClick={onClick}
        interactiveLayerIds={[is3d ? "cells-3d" : "cells-fill"]}
        cursor="pointer"
        attributionControl={{ compact: true }}
        aria-label={t.map.mapLabel}
      >
        <Source id="cells" type="geojson" data={geo}>
          <Layer id="cells-fill" type="fill" layout={{ visibility: is3d ? "none" : "visible" }}
            paint={{ "fill-color": colour as never, "fill-opacity": opacity as never, "fill-antialias": false }} />
          <Layer id="cells-hatch" type="fill" filter={["==", ["get", "hot"], 1]} layout={{ visibility: !is3d && mode === "hotspots" && !focus ? "visible" : "none" }}
            paint={{ "fill-pattern": "hatch" }} />
          <Layer id="cells-3d" type="fill-extrusion" layout={{ visibility: is3d ? "visible" : "none" }}
            paint={{ "fill-extrusion-color": colour as never, "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": 0.92, "fill-extrusion-vertical-gradient": true }} />
          <Layer id="selected-line" type="line" filter={["==", ["get", "id"], selected ?? ""]} paint={{ "line-color": "#F4EFE6", "line-width": 2.5 }} />
        </Source>
        {natura && showNatura && (
          <Source id="natura" type="geojson" data={natura}>
            <Layer id="natura-line" type="line" paint={{ "line-color": AEGEAN, "line-width": 1, "line-dasharray": [3, 2], "line-opacity": 0.85 }} />
          </Source>
        )}
        {speciesGeo && (
          <Source id="species" type="geojson" data={speciesGeo}>
            <Layer id="species-fill" type="fill" filter={["==", ["get", period], 1]} paint={{ "fill-color": period === "then" ? SAFFRON : AEGEAN, "fill-opacity": 1, "fill-antialias": false }} />
            {period === "now" && <Layer id="species-lost" type="line" filter={["all", ["==", ["get", "then"], 1], ["==", ["get", "now"], 0]]} paint={{ "line-color": LAVENDER, "line-width": 2, "line-dasharray": [2, 2] }} />}
          </Source>
        )}
        {me && <Marker longitude={me.lng} latitude={me.lat}><div className="h-4 w-4 rounded-full border-2 border-ink bg-saffron" aria-hidden="true" /></Marker>}
      </MapGL>

      {/* layer chips: one of Risk / Richness / Medicinal hotspots */}
      <div role="radiogroup" aria-label={t.map.modeLabel} className="absolute left-3 right-3 top-3 z-10 flex gap-2 overflow-x-auto pb-1 md:right-24">
        {modes.map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
            className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-medium backdrop-blur ${mode === m ? "border-saffron bg-saffron text-ink" : "border-line bg-ink/85 text-text"}`}>
            {mode === m && <span aria-hidden="true">✓ </span>}{t.map.modes[m]}
          </button>
        ))}
      </div>

      {/* tools */}
      <div className={`absolute left-3 right-3 top-[4.25rem] z-10 flex flex-wrap items-center gap-2 md:left-auto md:top-3 md:flex-col md:items-end ${panelOpen ? "md:right-[25rem]" : "md:right-3"}`}>
        <button type="button" onClick={locate} aria-label={t.map.locate} className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/85 backdrop-blur">
          <LocateIcon className="h-5 w-5" />
        </button>
        <Chip on={threeD} onClick={() => setThreeD(!threeD)} label={`${t.map.threeD} / ${t.map.flat}`}>{threeD ? t.map.threeD : t.map.flat}</Chip>
        {natura && <Chip on={showNatura} onClick={() => setShowNatura(!showNatura)} label={t.map.natura}>Natura</Chip>}
        <Chip on={listOpen} onClick={() => { setListOpen(!listOpen); setSelected(null); }}>{t.map.cellList}</Chip>
      </div>
      {locError && <p role="status" className="absolute left-3 top-[8.5rem] z-10 rounded-lg md:left-auto md:right-3 md:top-[17rem] bg-ink/90 px-3 py-1.5 text-xs text-saffron">{t.map.locateFail}</p>}

      {/* selected species: Then / Now */}
      {focus && (
        <div className="absolute left-3 right-3 top-[8.25rem] z-10 flex items-center gap-2 rounded-[14px] border border-line bg-ink/90 p-1.5 backdrop-blur md:right-auto md:top-20">
          <span className="min-w-0 flex-1 truncate pl-2 text-sm">
            <span className="hidden text-dim sm:inline">{t.map.speciesLayer}: </span>
            <Link className="font-display italic text-saffron" href={`/species/${focus.slug}`}>{displayName(focus, locale).isFallback ? focus.name : displayName(focus, locale).title}</Link>
          </span>
          <div role="radiogroup" aria-label={t.species.mapTitle} className="inline-flex shrink-0 rounded-full border border-line p-0.5 text-sm">
            {(["then", "now"] as const).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}
                className={`min-h-[44px] rounded-full px-3 ${period === p ? "bg-saffron text-ink" : "text-text"}`}>{t.species[p]}</button>
            ))}
          </div>
          <Link href="/map" aria-label={t.map.clearSpecies} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line"><CloseIcon className="h-5 w-5" /></Link>
        </div>
      )}

      {/* legend */}
      {!panelOpen && (
        <div className="absolute bottom-8 left-3 z-10 w-[15.5rem] rounded-[14px] border border-line bg-ink/90 p-3 text-xs backdrop-blur">
          {mode === "risk" && (
            <>
              <p className="text-text">{t.map.riskLegend}</p>
              <div className="mt-2 h-2.5 rounded-full" style={{ background: gradientCss(RISK_RAMP) }} aria-hidden="true" />
              <div className="mt-1 flex justify-between font-mono text-dim"><span>{riskStops[0][0].toFixed(0)}</span><span>{riskStops[riskStops.length - 1][0].toFixed(0)}</span></div>
              <div className="flex justify-between text-dim"><span>{t.map.lowRisk}</span><span>{t.map.highRisk}</span></div>
              <p className="mt-2 flex items-center gap-2 text-dim"><span className="inline-block h-3 w-4 rounded-sm" style={{ background: NODATA }} aria-hidden="true" />{t.map.noData}</p>
            </>
          )}
          {mode === "richness" && (
            <>
              <p className="text-text">{t.map.richnessLegend}</p>
              <div className="mt-2 h-2.5 rounded-full" style={{ background: gradientCss(RICH_RAMP) }} aria-hidden="true" />
              <div className="mt-1 flex justify-between font-mono text-dim"><span>1</span><span>{maxN}</span></div>
              <div className="flex justify-between text-dim"><span>{t.map.fewer}</span><span>{t.map.more}</span></div>
            </>
          )}
          {mode === "hotspots" && (
            <>
              <p className="flex items-center gap-2 text-text"><span className="inline-block h-3.5 w-5 rounded-sm" style={{ background: is3d ? POPPY : `repeating-linear-gradient(45deg, #F4EFE6 0 1.5px, ${POPPY} 1.5px 5px)` }} aria-hidden="true" />{t.map.hotspotLegend}</p>
              <p className="mt-2 flex items-center gap-2 text-dim"><span className="inline-block h-3.5 w-5 rounded-sm opacity-40" style={{ background: NODATA }} aria-hidden="true" />{t.map.notHotspot}</p>
            </>
          )}
          {is3d && <p className="mt-2 text-dim">{mode === "hotspots" ? t.map.heightAtRisk : t.map.heightRichness}</p>}
          {natura && showNatura && (
            <p className="mt-2 flex items-center gap-2 text-dim"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: AEGEAN }} aria-hidden="true" />{t.map.naturaLine}</p>
          )}
          <p className="mt-2 text-text">{t.map.tapHint}</p>
        </div>
      )}

      {selectedCell && <CellSheet cell={selectedCell} size={size} species={species} onClose={() => setSelected(null)} />}
      {listOpen && <CellList rows={listRows} onPick={pickFromList} onClose={() => setListOpen(false)} hint={t.map.cellListHelp} />}
    </div>
  );
}
