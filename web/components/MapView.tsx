"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LngLat, setWorkerUrl, type GeoJSONSource, type StyleImageMetadata } from "maplibre-gl";
import MapGL, { Layer, Source, type MapLayerMouseEvent, type MapRef } from "react-map-gl/maplibre";
import { deviceIsCapable } from "@/lib/device";
import { iconBucket, iconDefs, rasterise, svgDataUrl } from "@/lib/flowers";
import { useI18n } from "@/lib/i18n";
import { loadNatura, loadOcc, useCells, useSpecies } from "@/lib/data";
import { terrainStyle } from "@/lib/mapStyle";
import landAnchors from "@/public/data/land-anchors.json";
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
const LAND_ANCHORS: Record<string, number[]> = landAnchors;

/** Greece: lat 34.5 to 41.8, lng 19.3 to 28.4. The map opens framed on this box. */
const GREECE: [[number, number], [number, number]] = [[19.3, 34.5], [28.4, 41.8]];
const GREECE_CORNERS: [number, number][] = [[19.3, 34.5], [28.4, 34.5], [19.3, 41.8], [28.4, 41.8]];

/** Camera (centre + zoom) that keeps all four corners of Greece on screen at the given pitch and bearing.
    cameraForBounds only frames a flat map, so we project the corners and zoom out until they fit. */
function frameGreece(map: import("maplibre-gl").Map, pitch: number, bearing: number) {
  const w = map.getContainer().clientWidth, h = map.getContainer().clientHeight;
  const pad = { top: w < 640 ? 150 : 80, bottom: 70, left: 14, right: w < 640 ? 14 : 110 };
  const flat = map.cameraForBounds(GREECE, { padding: pad });
  let center = LngLat.convert(flat?.center ?? map.getCenter());
  let zoom = flat?.zoom ?? map.getZoom();
  const mid = (a: number, b: number) => (a + b) / 2;
  let recentred = 0;
  for (let i = 0; i < 60; i++) {
    map.jumpTo({ center, zoom, pitch, bearing });
    const pts = GREECE_CORNERS.map((c) => map.project(c));
    const fits = pts.every((p) => p.x >= pad.left && p.x <= w - pad.right && p.y >= pad.top && p.y <= h - pad.bottom);
    const dy = mid(pad.top, h - pad.bottom) - mid(Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y)));
    const dx = mid(pad.left, w - pad.right) - mid(Math.min(...pts.map((p) => p.x)), Math.max(...pts.map((p) => p.x)));
    if (fits && (Math.abs(dy) < 8 && Math.abs(dx) < 8 || recentred >= 6)) break;
    if (Math.abs(dx) >= 8 || Math.abs(dy) >= 8) { center = map.unproject([w / 2 - dx, h / 2 - dy]); recentred++; } // centre the box on the usable area
    if (!fits) zoom -= 0.06;
  }
  return { center: [center.lng, center.lat] as [number, number], zoom };
}

export default function MapView() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapInner />
    </Suspense>
  );
}

interface CellStat { id: string; n: number; r: number; hot: boolean; mean: number | null; }

/** Exact centre of a 0.1 degree cell, used for framing grid squares only. */
function centre(id: string, size: number): [number, number] {
  const [i, j] = id.split("_").map(Number);
  return [(j + 0.5) * size, (i + 0.5) * size];
}

/** Representative point of land inside a public cell; never an occurrence location. */
function anchor(id: string): [number, number] | undefined {
  const point = LAND_ANCHORS[id];
  return point ? [point[0], point[1]] : undefined;
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
  const tiltView = useRef<{ center: [number, number]; zoom: number; pitch: number; bearing: number } | null>(null);

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
  const [legendOpen, setLegendOpen] = useState(false);

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

  // One flower per occupied cell with mapped land. Cells without mapped land remain in the list.
  const pins = useMemo(() => {
    const features = [...stats].sort((a, b) => a.n - b.n).flatMap((c) => {
      const point = anchor(c.id);
      if (!point) return [];
      let icon: string;
      if (mode === "risk") icon = c.mean === null ? "nodata" : `risk-${iconBucket((c.mean - riskLo) / Math.max(riskHi - riskLo, 1e-6))}`;
      else if (mode === "richness") icon = `rich-${iconBucket(Math.log(c.n) / Math.log(maxN))}`;
      else icon = c.hot ? "hot" : "nodata";
      return [{
        type: "Feature" as const,
        properties: { id: c.id, n: c.n, icon, mv: c.mean ?? 0, mc: c.mean === null ? 0 : 1, hot: c.hot ? 1 : 0 },
        geometry: { type: "Point" as const, coordinates: point },
      }];
    });
    return { type: "FeatureCollection" as const, features };
  }, [stats, mode, riskLo, riskHi, maxN]);

  // cluster badge: small translucent disc coloured by the active layer's average for the group
  const clusterColour = useMemo(() => {
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
      const point = anchor(o.c);
      if (!point) return [];
      return [{ type: "Feature" as const, properties: { id: o.c, icon: lost ? "lost" : period }, geometry: { type: "Point" as const, coordinates: point } }];
    });
    return { type: "FeatureCollection" as const, features };
  }, [occ, period]);

  // selection: the square outline + an enlarged flower
  const selectionGeo = useMemo(() => {
    if (!selected) return { type: "FeatureCollection" as const, features: [] };
    const f = pins.features.find((p) => p.properties.id === selected);
    const icon = f?.properties.icon ?? "now";
    const point = anchor(selected);
    return { type: "FeatureCollection" as const, features: [squareFeature(selected, size), ...(point ? [{ type: "Feature" as const, properties: { kind: "pin", icon }, geometry: { type: "Point" as const, coordinates: point } }] : [])] };
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
    // narrow screens: a gentler tilt and no rotation, so Greece stays large; computed while the skeleton still covers the map
    const narrow = map.getContainer().clientWidth < 640;
    const pitch = narrow ? 50 : 60, bearing = narrow ? 0 : -10;
    tiltView.current = { ...frameGreece(map, pitch, bearing), pitch, bearing };
    map.jumpTo({ center: c, zoom: baseView.current.zoom, pitch: 0, bearing: 0 });
    // a style reload (language switch) drops images: re-add them from the cache
    map.on("styleimagemissing", (e) => {
      const img = iconCache.get(e.id);
      if (img && !map.hasImage(e.id)) map.addImage(e.id, img, { pixelRatio: 2 } as Partial<StyleImageMetadata>);
    });
    addIcons();
    setTimeout(() => { const a = map.getContainer().querySelector(".maplibregl-ctrl-attrib"); a?.classList.remove("maplibregl-compact-show"); a?.removeAttribute("open"); }, 600);
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
      const tilt = tiltView.current;
      map.easeTo({ pitch: tilt?.pitch ?? 60, bearing: tilt?.bearing ?? -10, zoom: tilt?.zoom ?? base.zoom, center: tilt?.center ?? [base.lng, base.lat], duration: slow ? 6500 : 1200, easing: (x) => x * x * (3 - 2 * x) });
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
    const [lng, lat] = anchor(id) ?? centre(id, size);
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
  // Icon size scales with zoom (flowers start at zoom 7, where clusters end); species count nudges it up a little,
  // and the muted bud is drawn slightly larger so it stays visible. Collision hides overlapping flowers.
  const sizeFactor = ["*", ["interpolate", ["linear"], ["get", "n"], 1, 0.85, 60, 1, 371, 1.25], ["case", ["==", ["get", "icon"], "nodata"], 1.3, 1]];
  const iconSize = ["interpolate", ["linear"], ["zoom"], 7, ["*", 0.3, sizeFactor], 9, ["*", 0.5, sizeFactor], 11, ["*", 0.78, sizeFactor]] as never;
  const sampleIcon = (name: string) => iconDefs().find((d) => d.name === name)?.svg ?? "";

  return (
    <div className="relative h-[calc(100dvh-3.5rem-6rem)] overflow-hidden md:h-[calc(100dvh-3.5rem)]">
      {!ready && <div className="absolute inset-0 z-30 bg-ink"><MapSkeleton /></div>}
      <MapGL
        ref={mapRef}
        initialViewState={{ bounds: [GREECE[0][0], GREECE[0][1], GREECE[1][0], GREECE[1][1]], fitBoundsOptions: { padding: { top: 70, bottom: 20, left: 12, right: 12 } } }}
        maxBounds={[6, 24, 42, 52]}
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
          <Source id="pins" type="geojson" data={pins} cluster clusterRadius={38} clusterMaxZoom={6}
            clusterProperties={{ sumM: ["+", ["get", "mv"]], cntM: ["+", ["get", "mc"]], sumN: ["+", ["get", "n"]], hotN: ["+", ["get", "hot"]] }}>
            <Layer id="clusters" type="circle" filter={["has", "point_count"]}
              paint={{ "circle-color": clusterColour as never, "circle-opacity": 0.6, "circle-radius": ["step", ["get", "point_count"], 9, 10, 12, 40, 15], "circle-stroke-width": 1.2, "circle-stroke-color": clusterColour as never, "circle-stroke-opacity": 0.9, "circle-pitch-alignment": "viewport" }} />
            <Layer id="cluster-count" type="symbol" filter={["has", "point_count"]}
              layout={{ "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 10, "text-allow-overlap": true, "text-pitch-alignment": "viewport" }}
              paint={{ "text-color": "#1A2036", "text-halo-color": "#F4EFE6", "text-halo-width": 1.6 }} />
            <Layer id="pins" type="symbol" filter={["!", ["has", "point_count"]]}
              layout={{ "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-size": iconSize, "icon-allow-overlap": false, "icon-ignore-placement": false, "icon-pitch-alignment": "viewport", "icon-rotation-alignment": "viewport", "symbol-sort-key": ["-", ["get", "n"]] }} />
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

      {/* legend: a small chip that opens on tap; the panel never covers more than a third of the map */}
      {!panelOpen && (
        <div className="absolute bottom-14 left-3 z-10 w-[min(16rem,calc(100%-1.5rem))] md:bottom-8">
          {legendOpen && (
            <div id="map-legend" className="mb-2 max-h-[33vh] overflow-y-auto rounded-[14px] border border-line bg-ink/92 p-3 text-xs backdrop-blur">
              <p className="text-text">{spMode ? (period === "then" ? t.species.thenHelp : t.species.nowHelp) : mode === "risk" ? t.map.legendRisk : mode === "richness" ? t.map.legendRichness : t.map.legendHotspots}</p>
              <p className="mt-2 text-dim">{t.map.landAnchorNote}</p>
              {!spMode && mode !== "hotspots" && (
                <>
                  <div className="mt-2 h-2 rounded-full" style={{ background: gradientCss(mode === "risk" ? RISK_RAMP : RICH_RAMP) }} aria-hidden="true" />
                  <div className="mt-1 flex justify-between font-mono text-dim"><span>{mode === "risk" ? riskLo.toFixed(0) : 1}</span><span>{mode === "risk" ? riskHi.toFixed(0) : maxN}</span></div>
                </>
              )}
              {spMode && period === "now" && <p className="mt-2 flex items-center gap-2 text-dim"><Sample svg={sampleIcon("lost")} w={14} h={19} />{t.map.speciesGone}</p>}
              {natura && showNatura && <p className="mt-2 flex items-center gap-2 text-dim"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: AEGEAN }} aria-hidden="true" />{t.map.naturaLine}</p>}
            </div>
          )}
          <Chip on={legendOpen} onClick={() => setLegendOpen(!legendOpen)} label={t.map.legend}>
            <span aria-expanded={legendOpen} aria-controls="map-legend">{t.map.legend}</span>
          </Chip>
        </div>
      )}

      {selectedCell && <CellSheet cell={selectedCell} size={size} species={species} onClose={() => setSelected(null)} />}
      {listOpen && <CellList rows={listRows} onPick={pickFromList} onClose={() => setListOpen(false)} hint={t.map.cellListHelp} />}
    </div>
  );
}


