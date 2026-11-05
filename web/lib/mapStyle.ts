import type { StyleSpecification } from "maplibre-gl";
import type { Locale } from "./i18n";

/** Calm natural basemap: warm sand land with soft hillshade, clear blue-grey sea, quiet labels.
    OpenFreeMap vector tiles for the vectors, AWS "Terrarium" open elevation tiles for relief (no API keys). */
export const LAND = "#D9CEB7";
export const SEA = "#9DB3C2";

// Short form on the map; the full required credit list is on /about.
export const DEM_ATTRIBUTION =
  'Terrain: <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Mapzen / AWS Terrain Tiles</a> (Copernicus EU-DEM, USGS, NOAA)';

export function terrainStyle(locale: Locale, withRelief: boolean): StyleSpecification {
  const name: unknown = locale === "el" ? ["coalesce", ["get", "name:el"], ["get", "name"]] : ["coalesce", ["get", "name_en"], ["get", "name"]];
  const label = (id: string, cls: string, size: number | unknown[], minzoom?: number, maxzoom?: number) => ({
    id, type: "symbol" as const, source: "ofm", "source-layer": "place",
    ...(minzoom !== undefined ? { minzoom } : {}), ...(maxzoom !== undefined ? { maxzoom } : {}),
    filter: ["==", ["get", "class"], cls] as unknown as never,
    layout: { "text-field": name as never, "text-font": ["Noto Sans Regular"], "text-size": size as never, "text-max-width": 7 },
    paint: { "text-color": "#5B5346", "text-halo-color": "#EFE7D6", "text-halo-width": 1.4, "text-opacity": 0.9 },
  });
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: {
      ofm: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
      // raster-dem tiles are only requested while terrain or the hillshade layer is active
      dem: { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], encoding: "terrarium", tileSize: 256, maxzoom: 15, attribution: DEM_ATTRIBUTION },
    },
    sky: {
      "sky-color": "#A9C7DE",
      "horizon-color": "#EFE7D6",
      "fog-color": "#EFE7D6",
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.8,
      "fog-ground-blend": 0.45,
      "atmosphere-blend": 0.3,
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": LAND } },
      { id: "wood", type: "fill", source: "ofm", "source-layer": "landcover", filter: ["==", ["get", "class"], "wood"], paint: { "fill-color": "#CFC9A9", "fill-opacity": 0.55 } },
      {
        id: "hillshade", type: "hillshade", source: "dem", layout: { visibility: withRelief ? "visible" : "none" },
        paint: {
          "hillshade-method": "multidirectional",
          "hillshade-exaggeration": 0.4,
          "hillshade-shadow-color": "#6B5B45",
          "hillshade-highlight-color": "#FFF8E6",
          "hillshade-accent-color": "#8C7B62",
        },
      },
      { id: "water", type: "fill", source: "ofm", "source-layer": "water", paint: { "fill-color": SEA } },
      { id: "waterway", type: "line", source: "ofm", "source-layer": "waterway", paint: { "line-color": SEA, "line-width": 1 } },
      { id: "boundary", type: "line", source: "ofm", "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]] as never,
        paint: { "line-color": "#8C806B", "line-width": 1, "line-dasharray": [3, 2] } },
      { id: "water-name", type: "symbol", source: "ofm", "source-layer": "water_name",
        layout: { "text-field": name as never, "text-font": ["Noto Sans Italic"], "text-size": 11, "text-letter-spacing": 0.2 },
        paint: { "text-color": "#5F7F96", "text-halo-color": SEA, "text-halo-width": 1 } },
      label("city", "city", ["interpolate", ["linear"], ["zoom"], 4, 11, 10, 16], 4),
      label("town", "town", 12, 7),
      label("village", "village", 11, 9),
      label("country", "country", 13, 3, 6),
    ],
  };
}
