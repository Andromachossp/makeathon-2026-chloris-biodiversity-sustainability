import type { StyleSpecification } from "maplibre-gl";
import type { Locale } from "./i18n";

/** "Night herbarium" basemap built on OpenFreeMap's OpenMapTiles vector tiles (no API key). */
export function darkStyle(locale: Locale): StyleSpecification {
  const name: unknown = locale === "el" ? ["coalesce", ["get", "name:el"], ["get", "name"]] : ["coalesce", ["get", "name_en"], ["get", "name"]];
  const label = (id: string, cls: string, size: number | unknown[], minzoom?: number, maxzoom?: number) => ({
    id, type: "symbol" as const, source: "ofm", "source-layer": "place",
    ...(minzoom !== undefined ? { minzoom } : {}), ...(maxzoom !== undefined ? { maxzoom } : {}),
    filter: ["==", ["get", "class"], cls] as unknown as never,
    layout: { "text-field": name as never, "text-font": ["Noto Sans Regular"], "text-size": size as never, "text-max-width": 7 },
    paint: { "text-color": "#A9B8AC", "text-halo-color": "#0B1410", "text-halo-width": 1.4 },
  });
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { ofm: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id: "background", type: "background", paint: { "background-color": "#15281e" } },
      { id: "wood", type: "fill", source: "ofm", "source-layer": "landcover", filter: ["==", ["get", "class"], "wood"], paint: { "fill-color": "#1a3326", "fill-opacity": 0.6 } },
      { id: "park", type: "fill", source: "ofm", "source-layer": "park", paint: { "fill-color": "#1a3326", "fill-opacity": 0.5 } },
      { id: "water", type: "fill", source: "ofm", "source-layer": "water", paint: { "fill-color": "#070e0c" } },
      { id: "waterway", type: "line", source: "ofm", "source-layer": "waterway", paint: { "line-color": "#070e0c", "line-width": 1 } },
      { id: "roads", type: "line", source: "ofm", "source-layer": "transportation", minzoom: 7,
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]] as never,
        paint: { "line-color": "#2c4a39", "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 12, 2] } },
      { id: "boundary", type: "line", source: "ofm", "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]] as never,
        paint: { "line-color": "#5b7a67", "line-width": 1, "line-dasharray": [3, 2] } },
      { id: "water-name", type: "symbol", source: "ofm", "source-layer": "water_name",
        layout: { "text-field": name as never, "text-font": ["Noto Sans Italic"], "text-size": 11, "text-letter-spacing": 0.2 },
        paint: { "text-color": "#5f7a69", "text-halo-color": "#070e0c", "text-halo-width": 1 } },
      label("city", "city", ["interpolate", ["linear"], ["zoom"], 4, 11, 10, 16], 4),
      label("town", "town", 12, 7),
      label("village", "village", 11, 9),
      label("country", "country", 13, 3, 6),
    ],
  };
}
