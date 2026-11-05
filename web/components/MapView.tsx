"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { setWorkerUrl, type GeoJSONSource, type StyleImageMetadata } from "maplibre-gl";
import MapGL, { Layer, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { deviceIsCapable } from "@/lib/device";
import { iconBucket, iconDefs, rasterise, svgDataUrl } from "@/lib/flowers";
import { useI18n } from "@/lib/i18n";
import { loadNatura, loadOcc, useCells, useSpecies } from "@/lib/data";
import { terrainStyle } from "@/lib/mapStyle";
import { AEGEAN, POPPY, RICH_RAMP, RISK_RAMP, SAFFRON, gradientCss, interpolateOn, quantile, type Stop } from "@/lib/ramps";
import { displayName } from "@/lib/species";
import { CellList, type CellRow } from "./CellList";
import { CellSheet, cellLabel } from "./CellSheet";
import { CloseIcon, LocateIcon } from "./Icons";
import { MapSkeleton } from "./Skeleton";

setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

type Mode = "risk" | "richness" | "hotspots";
const MIN_SPECIES_FOR_RISK = 5;
const EXAGGERATION = 1.3;
const RING_MUTED = "#6B7694";
const iconCache = new Map<string, ImageData>();

export default function MapView() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapInner />
    </Suspense>
  );
}

interface CellStat { id: string; n: number; r: number; hot: boolean; mean: number | null; }

/** Exact centre of a 0.1 degree cell. Pins are never jittered or offset: this is the generalised public location. */
function centre(id: string, size: number): [number, number] {
  const [i, j] = id.split("_").map(Number);
  return [(j + 0.5) * size, (i + 0.5) * size];
}

function squareFeature(id: string, size: number) {
  const [i, j] = id.split("_").map(Number);
  const [s, w, n, e] = [i * size, j * size, (i + 1) * size, (j + 1) * size];
  return { type: "Feature" as const, properties: { kind: "square" }, geometry: { type: "Polygon" as const, coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } };
}

/** Legend swatch: the real flower icon as an inline background image. */
function Sample({ svg, w, h }: { svg: string; w: number; h: number }) {
  return <span aria-hidden="true" className="inline-block shrink-0" style={{ width: w, height: h, backgroundImage: `url("${svgDataUrl(svg)}")`, backgroundSize: "contain", backgroundRepeat: "no-repeat" }} />;
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

  const [initialRelief] = useState(() => deviceIsCapable()); // low-end: no terrain, flat map, no intro move
  const [terrainOn, setTerrainOn] = useState(initialRelief);
  const [ready, setReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("risk");
  const [showNatura, setShowNatura] = useState(true);
  const [listOpen, setListOpen] = useState(false);
  const [period, setPeriod] = useState<"then" | "now">("now");
  const [natura, setNatura] = useState<GeoJSON.FeatureCollection | null>(null);
  const [me, setMe] = useState<{ lng: number; lat: number } | null>(null);
  const [locError, setLocError] = useState(false);

  const size = cells.size;
  const focus = species.find((s) => s.slug === speciesSlug);
  const style = useMemo(() => terrainStyle(locale, initialRelief), [locale, initialRelief]);

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

  const riskStops = useMemo<Stop[]>(() => {
    const v = stats.flatMap((c) => (c.mean === null ? [] : [c.mean])).sort((a, b) => a - b);
    return [0.05, 0.4, 0.75, 0.98].map((q, i) => [quantile(v, q), RISK_RAMP[i]] as Stop);
  }, [stats]);
  const richStops = useMemo<Stop[]>(() => [1, 8, 30, 80, 160, maxN].map((n, i) => [n, RICH_RAMP[i]] as Stop), [maxN]);
  const [riskLo, riskHi] = [riskStops[0][0], riskStops[riskStops.length - 1][0]];

  // one flower per occupied cell, exactly at the cell centre; icon (colour + shape) follows the active layer
  const pins = useMemo(() => {
    const features = [...stats].sort((a, b) => a.n - b.n).map((c) => {
      let icon: string;
      if (mode === "risk") icon = c.mean === null ? "nodata" : `risk-${iconBucket((c.mean - riskLo) / Math.max(riskHi - riskLo, 1e-6))}`;
      else if (mode === "richness") icon = `rich-${iconBucket(Math.log(c.n) / Math.log(maxN))}`;
      else icon = c.hot ? "hot" : "nodata";
      return {
        type: "Feature" as const,
        properties: { id: c.id, n: c.n, icon, mv: c.mean ?? 0, mc: c.mean === null ? 0 : 1, hot: c.hot ? 1 : 0 },
        geometry: { type: "Point" as const, coordinates: centre(c.id, size) },
      };
    });
    return { type: "FeatureCollection" as const, features };
  }, [stats, mode, riskLo, riskHi, maxN, size]);

  // cluster badge: dark disc, ring coloured by the active layer's average for the group
  const ringColour = useMemo(() => {
    if (mode === "richness") return interpolateOn(["/", ["get", "sumN"], ["get", "point_count"]], richStops);
    if (mode === "hotspots") return ["case", [">", ["get", "hotN"], 0], POPPY, RING_MUTED];
    return ["case", [">", ["get", "cntM"], 0], interpolateOn(["/", ["get", "sumM"], ["max", 1, ["get", "cntM"]]], riskStops), RING_MUTED];
  }, [mode, richStops, riskStops]);

  useEffect(() => { loadNatura().then(setNatura).catch(() => setNatura(null)); }, []);

  // species mode: only that species' cells
  const occ = speciesSlug && focus && focus.stats.cells > 0 ? use(loadOcc(speciesSlug)) : null;
  const speciesPins = useMemo(() => {
    if (!occ) return null;
    const features = occ.flatMap((o) => {
      const present = period === "then" ? o.o > 0 : o.w > 0;
      const lost = period === "now" && o.o > 0 && o.w === 0;
      if (!present && !lost) return [];
      return [{ type: "Feature" as const, properties: { id: o.c, icon: lost ? "lost" : period }, geometry: { type: "Point" as const, coordinates: centre(o.c, size) } }];
    });
    return { type: "FeatureCollection" as const, features };
  }, [occ, period, size]);

  // selection: the square outline + an enlarged flower
  const selectionGeo = useMemo(() => {
    if (!selected) return { type: "FeatureCollection" as const, features: [] };
    const f = pins.features.find((p) => p.properties.id === selected);
    const icon = f?.properties.icon ?? "now";
    return { type: "FeatureCollection" as const, features: [squareFeature(selected, size), { type: "Feature" as const, properties: { kind: "pin", icon }, geometry: { type: "Point" as const, coordinates: centre(selected, size) } }] };
  }, [selected, pins, size]);

  const meGeo = useMemo(() => (me ? { type: "FeatureCollection" as const, features: [{ type: "Feature" as const, properties: {}, geometry: { type: "Point" as const, coordinates: [me.lng, me.lat] } }] } : null), [me]);

  async function addIcons() {
    const map = mapRef.current?.getMap();
    if (!map) return;
    await Promise.all(iconDefs().map(async (d) => {
      if (!iconCache.has(d.name)) iconCache.set(d.name, await rasterise(d.svg));
      if (!map.hasImage(d.name)) map.addImage(d.name, iconCache.get(d.name)!, { pixelRatio: 2 } as Partial<StyleImageMetadata>);
    }));
    setIconsReady(true);
  }

  const onLoad = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const c = map.getCenter();
    baseView.current = { lng: c.lng, lat: c.lat, zoom: map.getZoom() };
    // a style reload (language switch) drops images: re-add them from the cache
    map.on("styleimagemissing", (e) => {
      const img = iconCache.get(e.id);
      if (img && !map.hasImage(e.id)) map.addImage(e.id, img, { pixelRatio: 2 } as Partial<StyleImageMetadata>);
    });
    addIcons();
    setReady(true);
  };

  // terrain + gentle intro camera move (capable devices only); toggling 3D off flattens the camera
  const introDone = useRef(false);
  useEffect(() => {
    const map = mapRef.current?.getMap();
    const base = baseView.current;
    if (!ready || !map || !base) return;
    map.setLayoutProperty("hillshade", "visibility", terrainOn ? "visible" : "none");
    if (speciesSlug) return; // species mode frames its own cells
    if (terrainOn) {
      const slow = !introDone.current;
      introDone.current = true;
      map.easeTo({ pitch: 60, bearing: -10, zoom: base.zoom + 0.3, center: [base.lng, base.lat - 0.2], duration: slow ? 6500 : 1200, easing: (x) => x * x * (3 - 2 * x) });
    } else {
      map.easeTo({ pitch: 0, bearing: 0, zoom: base.zoom, center: [base.lng, base.lat], duration: 600 });
    }
  }, [terrainOn, ready, speciesSlug]);

  // species mode: fly the camera to that species' cells
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!ready || !map || !occ || occ.length === 0) return;
    const pts = occ.map((o) => centre(o.c, size));
    const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
    map.fitBounds([[Math.min(...lons) - 0.15, Math.min(...lats) - 0.15], [Math.max(...lons) + 0.15, Math.max(...lats) + 0.15]], {
      padding: { top: 170, bottom: 110, left: 40, right: 40 }, maxZoom: 8.8, pitch: terrainOn ? 60 : 0, bearing: terrainOn ? -10 : 0, duration: 2600,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, occ, size]);

  const onClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) { setSelected(null); return; }
    const map = mapRef.current?.getMap();
    if (f.properties?.cluster_id !== undefined && map) {
      const src = map.getSource("pins") as GeoJSONSource;
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      src.getClusterExpansionZoom(f.properties.cluster_id as number).then((z) => map.easeTo({ center: coords, zoom: z + 0.4, duration: 700 }));
      return;
    }
    setListOpen(false);
    setSelected((f.properties?.id as string | undefined) ?? null);
  };

  const pickFromList = (id: string) => {
    setSelected(id);
    setListOpen(false);
    const [lng, lat] = centre(id, size);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 9, duration: 900 });
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
  const spMode = !!focus && !!speciesPins;
  // small to medium by species count; the muted bud is drawn a little larger so it stays visible
  const iconSize = ["*", ["interpolate", ["linear"], ["get", "n"], 1, 0.34, 5, 0.4, 60, 0.56, 371, 0.78], ["case", ["==", ["get", "icon"], "nodata"], 1.45, 1]] as never;
  const sampleIcon = (name: string) => iconDefs().find((d) => d.name === name)?.svg ?? "";

  return (
    <div className="relative h-[calc(100dvh-3.5rem-6rem)] overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      {!ready && <div className="absolute inset-0 z-30 bg-ink"><MapSkeleton /></div>}
      <MapGL
        ref={mapRef}
        initialViewState={{ bounds: [19.2, 34.6, 29.8, 41.9], fitBoundsOptions: { padding: { top: 70, bottom: 20, left: 12, right: 12 } } }}
        maxBounds={[15, 30.5, 34, 45.5]}
        minZoom={4}
        maxPitch={75}
        mapStyle={style}
        terrain={terrainOn ? { source: "dem", exaggeration: EXAGGERATION } : undefined}
        onLoad={onLoad}
        onClick={onClick}
        interactiveLayerIds={iconsReady ? (spMode ? ["sp-pins"] : ["pins", "clusters"]) : []}
        cursor="pointer"
        attributionControl={{ compact: true }}
        aria-label={t.map.mapLabel}
      >
        {natura && showNatura && (
          <Source id="natura" type="geojson" data={natura}>
            <Layer id="natura-line" type="line" paint={{ "line-color": AEGEAN, "line-width": 1.4, "line-dasharray": [3, 2], "line-opacity": 0.95 }} />
          </Source>
        )}

        {iconsReady && !spMode && (
          <Source id="pins" type="geojson" data={pins} cluster clusterRadius={46} clusterMaxZoom={8}
            clusterProperties={{ sumM: ["+", ["get", "mv"]], cntM: ["+", ["get", "mc"]], sumN: ["+", ["get", "n"]], hotN: ["+", ["get", "hot"]] }}>
            <Layer id="clusters" type="circle" filter={["has", "point_count"]}
              paint={{ "circle-color": "#151B2E", "circle-radius": ["step", ["get", "point_count"], 15, 10, 19, 50, 23], "circle-stroke-width": 4, "circle-stroke-color": ringColour as never, "circle-pitch-alignment": "viewport" }} />
            <Layer id="cluster-count" type="symbol" filter={["has", "point_count"]}
              layout={{ "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 12, "text-allow-overlap": true, "text-pitch-alignment": "viewport" }}
              paint={{ "text-color": "#F4EFE6" }} />
            <Layer id="pins" type="symbol" filter={["!", ["has", "point_count"]]}
              layout={{ "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-size": iconSize, "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport", "symbol-z-order": "source" }} />
          </Source>
        )}

        {iconsReady && spMode && speciesPins && (
          <Source id="sp" type="geojson" data={speciesPins}>
            <Layer id="sp-pins" type="symbol"
              layout={{ "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.28, 7, 0.4, 9, 0.68] as never, "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport" }} />
          </Source>
        )}

        {iconsReady && (
          <Source id="selection" type="geojson" data={selectionGeo}>
            <Layer id="sel-fill" type="fill" filter={["==", ["get", "kind"], "square"]} paint={{ "fill-color": SAFFRON, "fill-opacity": 0.18 }} />
            <Layer id="sel-line" type="line" filter={["==", ["get", "kind"], "square"]} paint={{ "line-color": "#1A2036", "line-width": 3.5 }} />
            <Layer id="sel-line-2" type="line" filter={["==", ["get", "kind"], "square"]} paint={{ "line-color": SAFFRON, "line-width": 1.8 }} />
            <Layer id="sel-pin" type="symbol" filter={["==", ["get", "kind"], "pin"]}
              layout={{ "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-size": 0.95, "icon-allow-overlap": true, "icon-ignore-placement": true, "icon-pitch-alignment": "viewport" }} />
          </Source>
        )}

        {meGeo && (
          <Source id="me" type="geojson" data={meGeo}>
            <Layer id="me-dot" type="circle" paint={{ "circle-radius": 7, "circle-color": SAFFRON, "circle-stroke-width": 3, "circle-stroke-color": "#0D1220", "circle-pitch-alignment": "viewport" }} />
          </Source>
        )}
      </MapGL>

      {/* layer chips: one of Risk / Richness / Medicinal hotspots (species mode shows only that species) */}
      {!spMode && (
        <div role="radiogroup" aria-label={t.map.modeLabel} className="absolute left-3 right-3 top-3 z-10 flex gap-2 overflow-x-auto pb-1 md:right-24">
          {modes.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
              className={`min-h-[44px] whitespace-nowrap rounded-full border px-4 text-sm font-medium backdrop-blur ${mode === m ? "border-saffron bg-saffron text-ink" : "border-line bg-ink/85 text-text"}`}>
              {mode === m && <span aria-hidden="true">✓ </span>}{t.map.modes[m]}
            </button>
          ))}
        </div>
      )}

      {/* tools */}
      <div className={`absolute left-3 right-3 top-[4.25rem] z-10 flex flex-wrap items-center gap-2 md:left-auto md:top-3 md:flex-col md:items-end ${spMode ? "top-3" : ""} ${panelOpen ? "md:right-[25rem]" : "md:right-3"}`}>
        <button type="button" onClick={locate} aria-label={t.map.locate} className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-ink/85 backdrop-blur">
          <LocateIcon className="h-5 w-5" />
        </button>
        <Chip on={terrainOn} onClick={() => setTerrainOn(!terrainOn)} label={`${t.map.threeD} / ${t.map.flat}`}>{terrainOn ? t.map.threeD : t.map.flat}</Chip>
        {natura && <Chip on={showNatura} onClick={() => setShowNatura(!showNatura)} label={t.map.natura}>Natura</Chip>}
        <Chip on={listOpen} onClick={() => { setListOpen(!listOpen); setSelected(null); }}>{t.map.cellList}</Chip>
      </div>
      {locError && <p role="status" className="absolute left-3 top-[8.5rem] z-10 rounded-lg bg-ink/90 px-3 py-1.5 text-xs text-saffron md:left-auto md:right-3 md:top-[17rem]">{t.map.locateFail}</p>}

      {/* selected species: Then / Now */}
      {focus && (
        <div className={`absolute left-3 right-3 z-10 flex items-center gap-2 rounded-[14px] border border-line bg-ink/90 p-1.5 backdrop-blur md:right-auto md:top-3 ${spMode ? "top-[4.25rem]" : "top-[8.25rem]"}`}>
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

      {/* legend: the active ramp with its real range, plus the 10 km note */}
      {!panelOpen && (
        <div className="absolute bottom-14 left-3 z-10 w-[16rem] md:bottom-8 rounded-[14px] border border-line bg-ink/90 p-3 text-xs backdrop-blur">
          {!spMode && mode === "risk" && (
            <>
              <p className="text-text">{t.map.riskLegend}</p>
              <div className="mt-2 h-2.5 rounded-full" style={{ background: gradientCss(RISK_RAMP) }} aria-hidden="true" />
              <div className="mt-1 flex justify-between font-mono text-dim"><span>{riskLo.toFixed(0)}</span><span>{riskHi.toFixed(0)}</span></div>
              <div className="flex justify-between text-dim"><span>{t.map.lowRisk}</span><span>{t.map.highRisk}</span></div>
              <p className="mt-2 flex items-center gap-2 text-dim"><Sample svg={sampleIcon("nodata")} w={14} h={19} />{t.map.noData}</p>
            </>
          )}
          {!spMode && mode === "richness" && (
            <>
              <p className="text-text">{t.map.richnessLegend}</p>
              <div className="mt-2 h-2.5 rounded-full" style={{ background: gradientCss(RICH_RAMP) }} aria-hidden="true" />
              <div className="mt-1 flex justify-between font-mono text-dim"><span>1</span><span>{maxN}</span></div>
              <div className="flex justify-between text-dim"><span>{t.map.fewer}</span><span>{t.map.more}</span></div>
            </>
          )}
          {!spMode && mode === "hotspots" && (
            <>
              <p className="flex items-center gap-2 text-text"><Sample svg={sampleIcon("hot")} w={18} h={25} />{t.map.hotspotLegend}</p>
              <p className="mt-2 flex items-center gap-2 text-dim"><Sample svg={sampleIcon("nodata")} w={14} h={19} />{t.map.notHotspot}</p>
            </>
          )}
          {spMode && (
            <>
              <p className="flex items-center gap-2 text-text"><Sample svg={sampleIcon(period)} w={18} h={25} />{period === "then" ? t.species.thenHelp : t.species.nowHelp}</p>
              {period === "now" && <p className="mt-2 flex items-center gap-2 text-dim"><Sample svg={sampleIcon("lost")} w={18} h={25} />{t.map.speciesGone}</p>}
            </>
          )}
          {natura && showNatura && (
            <p className="mt-2 flex items-center gap-2 text-dim"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: AEGEAN }} aria-hidden="true" />{t.map.naturaLine}</p>
          )}
          <p className="mt-2 text-dim">{t.map.legendNote}</p>
        </div>
      )}

      {selectedCell && <CellSheet cell={selectedCell} size={size} species={species} onClose={() => setSelected(null)} />}
      {listOpen && <CellList rows={listRows} onPick={pickFromList} onClose={() => setListOpen(false)} hint={t.map.cellListHelp} />}
    </div>
  );
}


