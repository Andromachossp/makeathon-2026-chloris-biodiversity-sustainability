import { createStore, del, entries, set } from "idb-keyval";

/** Sightings saved ON THIS DEVICE only (IndexedDB). Nothing is sent anywhere yet.
    Privacy: plants that may be at risk (and plants not in our catalogue, which we cannot judge) are rounded to a 0.1 degree
    square (about 10 km) BEFORE saving; the exact spot is never stored. Other plants are rounded to 0.001 degrees (about 100 m). */
export interface Sighting {
  id: string;
  slug: string | null;
  scientificName: string;
  confidence: number;
  lat: number | null;
  lng: number | null;
  generalised: boolean;
  capturedAt: string;
}

const store = () => createStore("chloris", "sightings");

export function roundCoord(v: number, step: number): number {
  return Math.round((Math.round(v / step) * step) * 1e6) / 1e6;
}

export function generalise(lat: number, lng: number, atRisk: boolean) {
  const step = atRisk ? 0.1 : 0.001;
  return { lat: roundCoord(lat, step), lng: roundCoord(lng, step), generalised: atRisk };
}

export async function saveSighting(s: Omit<Sighting, "id" | "capturedAt">): Promise<Sighting> {
  const full: Sighting = { ...s, id: crypto.randomUUID(), capturedAt: new Date().toISOString() };
  await set(full.id, full, store());
  return full;
}

export async function listSightings(): Promise<Sighting[]> {
  const all = (await entries<string, Sighting>(store())).map(([, v]) => v);
  return all.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

export const deleteSighting = (id: string) => del(id, store());

export { cellIdOf } from "./geo";

/** One-shot location lookup for saving a sighting. Resolves null if denied or unavailable. Not stored beyond the sighting. */
export function getPosition(timeoutMs = 10_000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition((p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }), () => resolve(null), { timeout: timeoutMs, maximumAge: 60_000 });
  });
}
