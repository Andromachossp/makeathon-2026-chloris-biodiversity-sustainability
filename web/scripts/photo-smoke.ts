import assert from "node:assert/strict";
import { GET } from "../app/api/photo/[slug]/route";

const originalFetch = globalThis.fetch;
const context = (slug: string) => ({ params: Promise.resolve({ slug }) });

async function main() {
try {
  globalThis.fetch = async () => Response.json({ results: [{
    basisOfRecord: "HUMAN_OBSERVATION",
    media: [{ type: "StillImage", identifier: "https://example.org/flower.jpg", creator: "Test photographer", license: "https://creativecommons.org/licenses/by/4.0/" }],
  }] });
  const photo = await GET(new Request("http://localhost"), context("acanthus-mollis"));
  assert.equal(photo.status, 200);
  assert.deepEqual(await photo.json(), { url: "https://example.org/flower.jpg", creator: "Test photographer", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0/" });

  const missing = await GET(new Request("http://localhost"), context("elaeoselinum-garganicum"));
  assert.equal(missing.status, 404);

  globalThis.fetch = async () => { throw new Error("offline"); };
  const catalogued = await GET(new Request("http://localhost"), context("origanum-dictamnus"));
  assert.equal(catalogued.status, 200);
  assert.equal((await catalogued.json()).creator, "Skjold Søndergaard");
  const offline = await GET(new Request("http://localhost"), context("acanthus-mollis"));
  assert.equal(offline.status, 504);
  assert.equal(offline.headers.get("Cache-Control"), "no-store");
  console.log("Photo route: licensed image, missing key, catalogued image, offline fallback passed.");
} finally {
  globalThis.fetch = originalFetch;
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
