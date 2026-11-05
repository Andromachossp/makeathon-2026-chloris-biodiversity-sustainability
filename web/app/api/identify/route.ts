import { MAX_UPLOAD_BYTES, type IdentifyResponse, type ScanCandidate } from "@/lib/scan";

// Server route: the Pl@ntNet key never reaches the browser. Node runtime (multipart upload).
export const runtime = "nodejs";

const ORGANS = new Set(["auto", "leaf", "flower", "fruit", "bark", "habit", "other"]);
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>(); // in-memory per-IP limiter (resets on deploy; enough for a prototype)

function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  return recent.length > MAX_PER_WINDOW;
}

const fail = (error: string, status: number) => Response.json({ error }, { status });

interface PlantNetResult {
  score: number;
  species: { scientificNameWithoutAuthor: string; commonNames?: string[] };
  gbif?: { id?: string };
  powo?: { id?: string };
  images?: { organ?: string; url?: { m?: string }; citation?: string; author?: string; license?: string }[];
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return fail("rate_limited", 429);

  const key = process.env.PLANTNET_API_KEY;
  if (!key) return fail("identify_failed", 500);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("bad_request", 400);
  }
  const image = form.get("image");
  if (!(image instanceof File) || !image.type.startsWith("image/") || image.size === 0 || image.size > MAX_UPLOAD_BYTES) return fail("bad_image", 400);
  const organRaw = String(form.get("organ") ?? "auto");
  const organ = ORGANS.has(organRaw) ? organRaw : "auto";

  const out = new FormData();
  out.append("images", image, "photo.jpg");
  out.append("organs", organ);
  try {
    const res = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(key)}&nb-results=5&lang=en&include-related-images=true`, {
      method: "POST", body: out, signal: AbortSignal.timeout(25_000),
    });
    if (res.status === 404) return Response.json({ candidates: [] } satisfies IdentifyResponse); // Pl@ntNet: no species found in the photo
    if (res.status === 429) return fail("rate_limited", 429);
    if (!res.ok) return fail("identify_failed", 502);
    const data = (await res.json()) as { results?: PlantNetResult[]; remainingIdentificationRequests?: number };
    const candidates: ScanCandidate[] = (data.results ?? []).slice(0, 5).map((r) => ({
      name: r.species.scientificNameWithoutAuthor,
      score: Math.round(r.score * 10000) / 10000,
      commonNames: (r.species.commonNames ?? []).slice(0, 3),
      powoId: r.powo?.id ?? null,
      gbifKey: r.gbif?.id ? Number(r.gbif.id) || null : null,
      images: (r.images ?? []).slice(0, 2).flatMap((i) => (i.url?.m ? [{ url: i.url.m, credit: i.citation || `${i.author ?? ""} / Pl@ntNet, ${i.license ?? ""}`, organ: i.organ ?? null }] : [])),
    }));
    return Response.json({ candidates, remaining: data.remainingIdentificationRequests ?? null } satisfies IdentifyResponse);
  } catch {
    return fail("identify_failed", 502); // never include the upstream URL or key in an error
  }
}
