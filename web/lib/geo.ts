/** 0.1 degree cell id used by the map and the data ("382_237" = lat 38.2-38.3, lng 23.7-23.8). */
export function cellIdOf(lat: number, lng: number, size = 0.1): string {
  return `${Math.floor(Math.round((lat / size) * 1e6) / 1e6)}_${Math.floor(Math.round((lng / size) * 1e6) / 1e6)}`;
}

/** Greece's bounding box, the same one the pipeline uses to clean records. */
export const GREECE_BBOX = { latMin: 34.5, latMax: 42.0, lngMin: 19.0, lngMax: 30.0 };
export const inGreeceBox = (lat: number, lng: number) =>
  lat >= GREECE_BBOX.latMin && lat <= GREECE_BBOX.latMax && lng >= GREECE_BBOX.lngMin && lng <= GREECE_BBOX.lngMax;

export type LocateFailure = "denied" | "unavailable" | "timeout" | "unsupported";

/** One-shot browser location. The caller must reduce it to a cell id straight away and drop the coordinates:
    nothing here stores or sends the position. */
export function locateOnce(timeoutMs = 12_000): Promise<{ lat: number; lng: number } | { failure: LocateFailure }> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve({ failure: "unsupported" });
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => resolve({ failure: e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable" }),
      { timeout: timeoutMs, maximumAge: 60_000, enableHighAccuracy: false }, // a coarse fix is enough for a 10 km square
    );
  });
}
