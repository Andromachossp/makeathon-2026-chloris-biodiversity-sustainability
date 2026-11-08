import assert from "node:assert/strict";
import { GET } from "../app/api/photo/[slug]/route";
import species from "../public/data/species.json";
import catalog from "../public/data/photo-catalog.json";

const originalFetch = globalThis.fetch;
const context = (slug: string) => ({ params: Promise.resolve({ slug }) });
const photos = catalog as Record<string, unknown>;
const liveSlug = species.find((s) => s.gbifKey && !photos[s.slug])?.slug ?? "";
const missingKeySlug = species.find((s) => !s.gbifKey && !photos[s.slug])?.slug ?? "";
assert.ok(liveSlug && missingKeySlug);

async function main() {
try {
  globalThis.fetch = async () => Response.json({ results: [{
    basisOfRecord: "HUMAN_OBSERVATION",
    media: [{ type: "StillImage", identifier: "https://example.org/flower.jpg", creator: "Test photographer", license: "https://creativecommons.org/licenses/by/4.0/" }],
  }] });
  const photo = await GET(new Request("http://localhost"), context(liveSlug));
  assert.equal(photo.status, 200);
  assert.deepEqual(await photo.json(), { url: "https://example.org/flower.jpg", creator: "Test photographer", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/" });

  const missing = await GET(new Request("http://localhost"), context(missingKeySlug));
  assert.equal(missing.status, 404);

  globalThis.fetch = async () => { throw new Error("offline"); };
  const catalogued = await GET(new Request("http://localhost"), context("origanum-dictamnus"));
  assert.equal(catalogued.status, 200);
  assert.equal((await catalogued.json()).creator, "Skjold Søndergaard");
  const snowdrop = await GET(new Request("http://localhost"), context("galanthus-ikariae"));
  assert.equal(snowdrop.status, 200);
  assert.deepEqual(await snowdrop.json(), {
    url: "https://inaturalist-open-data.s3.amazonaws.com/photos/174945713/medium.jpeg",
    creator: "Thanasis Papanikolaou",
    licence: "CC BY-NC 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-nc/4.0/",
  });
  const commonsWithoutGbifKey = await GET(new Request("http://localhost"), context("epilobium-angustifolium"));
  assert.equal(commonsWithoutGbifKey.status, 200);
  assert.match((await commonsWithoutGbifKey.json()).url, /^https:\/\/(?:thumb|upload)\.wikimedia\.org\//);
  const offline = await GET(new Request("http://localhost"), context(liveSlug));
  assert.equal(offline.status, 504);
  assert.equal(offline.headers.get("Cache-Control"), "no-store");
  console.log("Photo route: licensed image, missing key, GBIF and Commons catalogues, offline fallback passed.");
} finally {
  globalThis.fetch = originalFetch;
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
