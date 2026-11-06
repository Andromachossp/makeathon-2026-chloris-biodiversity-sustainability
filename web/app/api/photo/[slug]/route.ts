import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PhotoResponse } from "@/lib/photo";

// Server route: finds one openly licensed photo of a species from GBIF.
// Privacy: only { url, creator, licence, licenceUrl } leaves this file. Coordinates, record IDs
// and occurrence/photo page links from GBIF are dropped here and never returned, stored or linked.
export const runtime = "nodejs";

const GBIF = "https://api.gbif.org/v1/occurrence/search";
const INAT_DATASET = "50c9509d-22c7-4a22-a47d-8c48425ef4a7"; // iNaturalist Research-grade Observations (verified from a real response)
const TIMEOUT_MS = 5000;
const OK_CACHE = "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800";
const MISS_CACHE = "public, max-age=3600, s-maxage=86400";

interface GbifMedia {
  type?: string;
  identifier?: string;
  creator?: string;
  rightsHolder?: string;
  license?: string;
}
interface GbifRecord {
  basisOfRecord?: string;
  media?: GbifMedia[];
}

let keys: Promise<Map<string, number>> | null = null;
function gbifKeys(): Promise<Map<string, number>> {
  keys ??= readFile(path.join(process.cwd(), "public", "data", "species.json"), "utf8")
    .then((txt) => {
      const m = new Map<string, number>();
      for (const s of JSON.parse(txt) as { slug: string; gbifKey: number | null }[]) if (s.gbifKey) m.set(s.slug, s.gbifKey);
      return m;
    })
    .catch((e) => {
      keys = null;
      throw e;
    });
  return keys;
}

/** CC0 and CC BY only (any version). NC, ND, SA and "all rights reserved" are rejected. */
function parseLicence(raw: string | undefined): { licence: string; licenceUrl: string; attribution: boolean } | null {
  if (!raw) return null;
  const zero = /^https?:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/i.exec(raw.trim());
  if (zero) return { licence: "CC0 1.0", licenceUrl: "https://creativecommons.org/publicdomain/zero/1.0/", attribution: false };
  const by = /^https?:\/\/creativecommons\.org\/licenses\/by\/(\d\.\d)\/?$/i.exec(raw.trim());
  if (by) return { licence: `CC BY ${by[1]}`, licenceUrl: `https://creativecommons.org/licenses/by/${by[1]}/`, attribution: true };
  return null;
}

function pick(records: GbifRecord[]): PhotoResponse | null {
  for (const r of records) {
    if (r.basisOfRecord !== "HUMAN_OBSERVATION") continue;
    for (const m of r.media ?? []) {
      if (m.type !== "StillImage") continue;
      const lic = parseLicence(m.license);
      if (!lic) continue;
      let url: URL;
      try {
        url = new URL(m.identifier ?? "");
      } catch {
        continue;
      }
      if (url.protocol !== "https:") continue;
      const creator = (m.creator || m.rightsHolder || "").trim().slice(0, 120);
      if (lic.attribution && !creator) continue; // CC BY needs a name to credit
      // iNaturalist open data serves several sizes; the "original" file is far too heavy for a header.
      const href = url.hostname === "inaturalist-open-data.s3.amazonaws.com" ? url.href.replace(/\/original\.(jpe?g|png)$/i, "/medium.$1") : url.href;
      return { url: href, creator, licence: lic.licence, licenceUrl: lic.licenceUrl };
    }
  }
  return null;
}

async function search(taxonKey: number, dataset: string | null, signal: AbortSignal): Promise<PhotoResponse | null> {
  // GBIF returns every media item in each occurrence; a 20-record response can exceed
  // the five-second budget on Vercel. Five records still allow skipping unsuitable media.
  const q = new URLSearchParams({ taxonKey: String(taxonKey), mediaType: "StillImage", basisOfRecord: "HUMAN_OBSERVATION", occurrenceStatus: "PRESENT", limit: "5" });
  q.append("license", "CC0_1_0");
  q.append("license", "CC_BY_4_0");
  if (dataset) q.set("datasetKey", dataset);
  const res = await fetch(`${GBIF}?${q}`, { signal, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`gbif ${res.status}`);
  const body = (await res.json()) as { results?: GbifRecord[] };
  return pick(body.results ?? []);
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const miss = () => new Response(null, { status: 404, headers: { "Cache-Control": MISS_CACHE } });
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return miss();

  let taxonKey: number | undefined;
  try {
    taxonKey = (await gbifKeys()).get(slug);
  } catch {
    return new Response(null, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  if (!taxonKey) return miss();

  try {
    const signal = AbortSignal.timeout(TIMEOUT_MS); // one 5 s budget for both lookups
    // Prefer research-grade iNaturalist; fall back to any other human observation with a CC0 / CC BY photo.
    const photo = (await search(taxonKey, INAT_DATASET, signal)) ?? (await search(taxonKey, null, signal));
    if (!photo) return miss();
    return Response.json(photo, { headers: { "Cache-Control": OK_CACHE } });
  } catch {
    // Timeout or GBIF trouble: not a "no photo" answer, so it must not be cached.
    return new Response(null, { status: 504, headers: { "Cache-Control": "no-store" } });
  }
}
