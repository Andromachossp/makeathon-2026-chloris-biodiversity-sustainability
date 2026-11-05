import type { StyleSpecification } from "maplibre-gl";
import type { Locale } from "./i18n";

/** Desaturated slate-blue basemap on OpenFreeMap's OpenMapTiles vector tiles (no API key).
    Land is slightly lighter than sea, labels are muted, roads are left out. */
export const LAND = "#2A3552";
export const SEA = "#131A2E";

export function slateStyle(locale: Locale): StyleSpecification {
  const name: unknown = locale === "el" ? ["coalesce", ["get", "name:el"], ["get", "name"]] : ["coalesce", ["get", "name_en"], ["get", "name"]];
  const label = (id: string, cls: string, size: number | unknown[], minzoom?: number, maxzoom?: number) => ({
    id, type: "symbol" as const, source: "ofm", "source-layer": "place",
    ...(minzoom !== undefined ? { minzoom } : {}), ...(maxzoom !== undefined ? { maxzoom } : {}),
    filter: ["==", ["get", "class"], cls] as unknown as never,
    layout: { "text-field": name as never, "text-font": ["Noto Sans Regular"], "text-size": size as never, "text-max-width": 7 },
    paint: { "text-color": "#8590B0", "text-halo-color": LAND, "text-halo-width": 1.2 },
  });
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { ofm: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": LAND } },
      { id: "wood", type: "fill", source: "ofm", "source-layer": "landcover", filter: ["==", ["get", "class"], "wood"], paint: { "fill-color": "#2F3B5B", "fill-opacity": 0.55 } },
      { id: "water", type: "fill", source: "ofm", "source-layer": "water", paint: { "fill-color": SEA } },
      { id: "waterway", type: "line", source: "ofm", "source-layer": "waterway", paint: { "line-color": SEA, "line-width": 1 } },
      { id: "boundary", type: "line", source: "ofm", "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]] as never,
        paint: { "line-color": "#4A5578", "line-width": 1, "line-dasharray": [3, 2] } },
      { id: "water-name", type: "symbol", source: "ofm", "source-layer": "water_name",
        layout: { "text-field": name as never, "text-font": ["Noto Sans Italic"], "text-size": 11, "text-letter-spacing": 0.2 },
        paint: { "text-color": "#56628A", "text-halo-color": SEA, "text-halo-width": 1 } },
      label("city", "city", ["interpolate", ["linear"], ["zoom"], 4, 11, 10, 16], 4),
      label("town", "town", 12, 7),
      label("village", "village", 11, 9),
      label("country", "country", 13, 3, 6),
    ],
  };
}
