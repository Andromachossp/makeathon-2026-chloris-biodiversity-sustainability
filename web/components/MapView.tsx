"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Suspense, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setWorkerUrl } from "maplibre-gl";
import MapGL, { Layer, Marker, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { useI18n } from "@/lib/i18n";
import { loadNatura, loadOcc, useCells, useSpecies } from "@/lib/data";
import { darkStyle } from "@/lib/mapStyle";
import { displayName } from "@/lib/species";
import { CellSheet } from "./CellSheet";
import { CloseIcon, LocateIcon } from "./Icons";
import { MapSkeleton } from "./Skeleton";

const EMBER = "#F0533A";
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export default function MapView() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapInner />
    </Suspense>
  );
}

function squares(cells: { id: string }[], size: number, props: (i: number) => Record<string, unknown>) {
  return {
    type: "FeatureCollection" as const,
    features: cells.map((c, idx) => {
      const [i, j] = c.id.split("_").map(Number);
      const [s, w, n, e] = [i * size, j * size, (i + 1) * size, (j + 1) * size];
      return {
        type: "Feature" as const,
        properties: { id: c.id, ...props(idx) },
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
      d.data[k] = 224; d.data[k + 1] = 101; d.data[k + 2] = 58; d.data[k + 3] = on ? 200 : 0;
    }
  return d;
}

function Pill({ on, onClick, children, disabled, title }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} disabled={disabled} title={title}
      className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm backdrop-blur ${disabled ? "border-dashed border-line bg-ink/80 text-dim" : on ? "border-saffron bg-saffron text-ink" : "border-line bg-ink/80 text-text"}`}>
      {on && !disabled && <span aria-hidden="true">✓ </span>}{children}
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

  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [showDiversity, setShowDiversity] = useState(true);
  const [showAtRisk, setShowAtRisk] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showNatura, setShowNatura] = useState(true);
  const [period, setPeriod] = useState<"then" | "now">("now");
  const [natura, setNatura] = useState<GeoJSON.FeatureCollection | null>(null);
  const [me, setMe] = useState<{ lng: number; lat: number } | null>(null);
  const [locError, setLocError] = useState(false);

  const size = cells.size;
  const maxN = useMemo(() => cells.cells.reduce((m, c) => Math.max(m, c.s.length), 1), [cells]);
  const cellGeo = useMemo(
    () => squares(cells.cells, size, (i) => ({ n: cells.cells[i].s.length, r: cells.cells[i].nAtRisk, h: cells.cells[i].hotspot ? 1 : 0 })),
    [cells, size],
  );
  const hotspotsAvailable = cells.cells.some((c) => c.hotspot !== null);
  const style = useMemo(() => darkStyle(locale), [locale]);
  const focus = species.find((s) => s.slug === speciesSlug);

  useEffect(() => {
    loadNatura().then(setNatura).catch(() => setNatura(null));
  }, []);

  // species layer data (Then / Now)
  const occ = speciesSlug && focus && focus.stats.cells > 0 ? use(loadOcc(speciesSlug)) : null;
  const speciesGeo = useMemo(
    () => (occ ? squares(occ.map((o) => ({ id: o.c })), size, (i) => ({ then: occ[i].o > 0 ? 1 : 0, now: occ[i].w > 0 ? 1 : 0 })) : null),
    [occ, size],
  );

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && !map.hasImage("hatch")) map.addImage("hatch", hatchImage(), { pixelRatio: 2 });
    setReady(true);
  }, []);

  const onClick = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id as string | undefined;
    setSelected(id ?? null);
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

  const selectedCell = selected ? cells.cells.find((c) => c.id === selected) : undefined;
  return (
    <div className="relative h-[calc(100dvh-3.5rem-6rem)] overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      {!ready && <div className="absolute inset-0 z-30 bg-ink"><MapSkeleton /></div>}
      <MapGL
        ref={mapRef}
        initialViewState={{ bounds: [19.2, 34.6, 29.8, 41.9], fitBoundsOptions: { padding: { top: 70, bottom: 20, left: 12, right: 12 } } }}
        maxBounds={[15, 30.5, 34, 45.5]}
        minZoom={4}
        mapStyle={style}
        onLoad={onLoad}
        onClick={onClick}
        interactiveLayerIds={["diversity-fill"]}
        cursor="pointer"
        attributionControl={{ compact: true }}
        aria-label={t.map.mapLabel}
      >
        {natura && showNatura && (
          <Source id="natura" type="geojson" data={natura}>
            <Layer id="natura-fill" type="fill" paint={{ "fill-color": "#7BE495", "fill-opacity": 0.07 }} />
            <Layer id="natura-line" type="line" paint={{ "line-color": "#7BE495", "line-opacity": 0.45, "line-width": 0.8 }} />
          </Source>
        )}
        <Source id="cells" type="geojson" data={cellGeo}>
          <Layer id="diversity-fill" type="fill" layout={{ visibility: showDiversity ? "visible" : "none" }}
            paint={{
              "fill-opacity": focus ? 0.3 : 1, // dim the background layer while one species is shown
              "fill-color": ["interpolate", ["linear"], ["get", "n"], 1, "rgba(123,228,149,0.14)", 10, "rgba(123,228,149,0.32)", 40, "rgba(123,228,149,0.55)", 120, "rgba(123,228,149,0.78)", maxN, "rgba(233,217,139,0.95)"],
            }} />
          <Layer id="diversity-line" type="line" layout={{ visibility: showDiversity ? "visible" : "none" }} paint={{ "line-color": "rgba(233,240,228,0.10)", "line-width": 0.5 }} />
          <Layer id="atrisk-fill" type="fill" filter={["==", ["get", "h"], 1]} layout={{ visibility: showHotspots ? "visible" : "none" }} paint={{ "fill-pattern": "hatch" }} />
          <Layer id="atrisk-line" type="line" filter={["==", ["get", "h"], 1]} layout={{ visibility: showHotspots ? "visible" : "none" }} paint={{ "line-color": EMBER, "line-width": 2 }} />
          <Layer id="atrisk-cells-fill" type="fill" filter={[">", ["get", "r"], 0]} layout={{ visibility: showAtRisk ? "visible" : "none" }} paint={{ "fill-pattern": "hatch" }} />
          <Layer id="atrisk-cells-line" type="line" filter={[">", ["get", "r"], 0]} layout={{ visibility: showAtRisk ? "visible" : "none" }} paint={{ "line-color": EMBER, "line-width": 1.4 }} />
          <Layer id="selected-line" type="line" filter={["==", ["get", "id"], selected ?? ""]} paint={{ "line-color": "#E9F0E4", "line-width": 3 }} />
        </Source>
        {speciesGeo && (
          <Source id="species" type="geojson" data={speciesGeo}>
            <Layer id="species-fill" type="fill" filter={["==", ["get", period], 1]} paint={{ "fill-color": period === "then" ? "#E9D98B" : "#7BE495", "fill-opacity": 1 }} />
            <Layer id="species-outline" type="line" filter={["==", ["get", period], 1]} paint={{ "line-color": "#E9F0E4", "line-width": 1.6 }} />
            {period === "now" && <Layer id="species-lost" type="line" filter={["all", ["==", ["get", "then"], 1], ["==", ["get", "now"], 0]]} paint={{ "line-color": "#E9D98B", "line-width": 2, "line-dasharray": [2, 2] }} />}
          </Source>
        )}
        {me && <Marker longitude={me.lng} latitude={me.lat}><div className="h-4 w-4 rounded-full border-2 border-ink bg-lavender" aria-hidden="true" /></Marker>}
      </MapGL>

      {/* layer toggles */}
      <div role="group" aria-label={t.map.layers} className="absolute left-3 right-16 top-3 z-10 flex gap-2 overflow-x-auto pb-1">
        <Pill on={showDiversity} onClick={() => setShowDiversity(!showDiversity)}>{t.map.diversity}</Pill>
        <Pill on={showHotspots} onClick={() => setShowHotspots(!showHotspots)} disabled={!hotspotsAvailable} title={hotspotsAvailable ? undefined : t.map.hotspotsOff}>{t.map.hotspots}</Pill>
        <Pill on={showAtRisk} onClick={() => setShowAtRisk(!showAtRisk)}>{t.map.atRiskCells}</Pill>
        {natura && <Pill on={showNatura} onClick={() => setShowNatura(!showNatura)}>{t.map.natura}</Pill>}
      </div>
      {!hotspotsAvailable && <p className="absolute left-3 top-16 z-10 max-w-[16rem] rounded-lg bg-ink/85 px-3 py-1.5 text-xs text-dim">{t.map.hotspotsOff}</p>}

      <button type="button" onClick={locate} aria-label={t.map.locate}
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/85 backdrop-blur">
        <LocateIcon className="h-5 w-5" />
      </button>
      {locError && <p role="status" className="absolute right-3 top-16 z-10 rounded-lg bg-ink/90 px-3 py-1.5 text-xs text-lavender">{t.map.locateFail}</p>}

      {/* selected species: Then / Now */}
      {focus && (
        <div className="absolute left-3 right-3 top-[4.25rem] z-10 flex items-center gap-2 rounded-[14px] border border-line bg-ink/90 p-1.5 backdrop-blur md:right-auto md:top-20">
          <span className="min-w-0 flex-1 truncate pl-2 text-sm">
            <span className="hidden text-dim sm:inline">{t.map.speciesLayer}: </span>
            <Link className="font-serif italic text-saffron" href={`/species/${focus.slug}`}>{displayName(focus, locale).isFallback ? focus.name : displayName(focus, locale).title}</Link>
          </span>
          <div role="radiogroup" aria-label={t.species.mapTitle} className="inline-flex shrink-0 rounded-full border border-line p-0.5 text-sm">
            {(["then", "now"] as const).map((p) => (
              <button key={p} type="button" role="radio" aria-checked={period === p} onClick={() => setPeriod(p)}
                className={`min-h-[44px] rounded-full px-4 ${period === p ? "bg-saffron text-ink" : "text-text"}`}>{t.species[p]}</button>
            ))}
          </div>
          <Link href="/map" aria-label={t.map.clearSpecies} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line"><CloseIcon className="h-5 w-5" /></Link>
        </div>
      )}

      {/* legend */}
      {!selectedCell && (
        <div className="absolute bottom-8 left-3 z-10 w-[14rem] rounded-[14px] border border-line bg-ink/90 p-3 text-xs backdrop-blur">
          <div className="h-2 rounded-full" style={{ background: "linear-gradient(90deg, rgba(123,228,149,0.14), rgba(123,228,149,0.78) 70%, rgba(233,217,139,0.95))" }} aria-hidden="true" />
          <div className="mt-1 flex justify-between font-mono text-dim"><span>1</span><span>{maxN}</span></div>
          <div className="flex justify-between text-dim"><span>{t.map.fewer}</span><span>{t.map.more}</span></div>
          <p className="mt-1 text-dim">{t.map.perSquare}</p>
          <p className="mt-2 flex items-center gap-2 text-dim">
            <span className="inline-block h-3 w-4 border" style={{ borderColor: EMBER, background: `repeating-linear-gradient(45deg, ${EMBER} 0 1px, transparent 1px 4px)` }} aria-hidden="true" />
            {t.map.atRiskCells}
          </p>
          <p className="mt-2 text-text">{t.map.tapHint}</p>
        </div>
      )}

      {selectedCell && <CellSheet cell={selectedCell} size={size} species={species} onClose={() => setSelected(null)} />}
    </div>
  );
}
