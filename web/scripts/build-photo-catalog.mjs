// Refresh openly licensed GBIF photos ahead of deployment. Run from web/:
// node scripts/build-photo-catalog.mjs [--all]
// The output contains only image URLs and credits, never occurrence data.
import { readFile, writeFile } from "node:fs/promises";

const species = JSON.parse(await readFile("public/data/species.json", "utf8"));
const file = "public/data/photo-catalog.json";
const catalog = JSON.parse(await readFile(file, "utf8"));
const targets = species.filter((s) => s.gbifKey && (process.argv.includes("--all") || s.featured));
const dataset = "50c9509d-22c7-4a22-a47d-8c48425ef4a7";

function choose(results) {
  for (const record of results) {
    if (record.basisOfRecord !== "HUMAN_OBSERVATION") continue;
    for (const media of record.media ?? []) {
      if (media.type !== "StillImage") continue;
      const raw = (media.license ?? "").trim();
      const cc0 = /^https?:\/\/creativecommons\.org\/publicdomain\/zero\/1\.0\/?$/i.test(raw);
      const by = /^https?:\/\/creativecommons\.org\/licenses\/by\/(\d\.\d)\/?$/i.exec(raw);
      if (!cc0 && !by) continue;
      const creator = (media.creator || media.rightsHolder || "").trim().slice(0, 120);
      if (by && !creator) continue;
      let url;
      try { url = new URL(media.identifier); } catch { continue; }
      if (url.protocol !== "https:") continue;
      const href = url.hostname === "inaturalist-open-data.s3.amazonaws.com"
        ? url.href.replace(/\/original\.(jpe?g|png)$/i, "/medium.$1") : url.href;
      return { url: href, creator, licence: cc0 ? "CC0 1.0" : `CC BY ${by[1]}`,
        licenceUrl: cc0 ? "https://creativecommons.org/publicdomain/zero/1.0/" : `https://creativecommons.org/licenses/by/${by[1]}/` };
    }
  }
  return null;
}

async function lookup(key, inat) {
  const q = new URLSearchParams({ taxonKey: String(key), mediaType: "StillImage", basisOfRecord: "HUMAN_OBSERVATION", occurrenceStatus: "PRESENT", limit: "5" });
  q.append("license", "CC0_1_0");
  q.append("license", "CC_BY_4_0");
  if (inat) q.set("datasetKey", dataset);
  const response = await fetch(`https://api.gbif.org/v1/occurrence/search?${q}`, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GBIF ${response.status}`);
  return choose((await response.json()).results ?? []);
}

async function fill(s) {
  if (catalog[s.slug]) return;
  try {
    const photo = (await lookup(s.gbifKey, true)) ?? (await lookup(s.gbifKey, false));
    if (photo) catalog[s.slug] = photo;
  } catch (error) { console.warn(`${s.slug}: ${error.message}`); }
}

// Limit load on GBIF. A failed lookup stays absent; the app can still try live.
for (let i = 0; i < targets.length; i += 3) {
  await Promise.all(targets.slice(i, i + 3).map(fill));
  await writeFile(file, `${JSON.stringify(Object.fromEntries(Object.entries(catalog).sort()), null, 2)}\n`);
  console.log(`${Math.min(i + 3, targets.length)}/${targets.length}; ${Object.keys(catalog).length} photos`);
}
