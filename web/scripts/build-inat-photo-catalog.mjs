// Fill photo gaps from directly verified iNaturalist research-grade observations.
// Run from web/: node scripts/build-inat-photo-catalog.mjs [--limit=N] [--slug=species-slug]
// Only the photo URL and credit fields are saved. Observation IDs and coordinates are discarded.
import { readFile, writeFile } from "node:fs/promises";

const species = JSON.parse(await readFile("public/data/species.json", "utf8"));
const names = JSON.parse(await readFile("public/data/names.json", "utf8")).byName;
const file = "public/data/photo-catalog.json";
const catalog = JSON.parse(await readFile(file, "utf8"));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const slugArg = process.argv.find((arg) => arg.startsWith("--slug="));
const slug = slugArg?.slice(7);
const targets = species.filter((s) => !catalog[s.slug] && (!slug || s.slug === slug)).slice(0, limit);
const api = "https://api.inaturalist.org/v1/observations";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pick(results, species) {
  for (const observation of results) {
    // iNaturalist may use a different accepted name. The pipeline's Kew synonym
    // index must map that exact name back to this Chloris species.
    if (names[observation.taxon?.name?.toLowerCase()] !== species.slug || observation.taxon?.rank !== "species") continue;
    if (observation.quality_grade !== "research" || observation.captive === true) continue;
    if (/herbarium|herbier|specimen|spécimen|pressed plant/i.test(observation.description ?? "")) continue;
    for (const photo of observation.photos ?? []) {
      const cc0 = photo.license_code === "cc0";
      const by = photo.license_code === "cc-by";
      if (!cc0 && !by) continue;
      let url;
      try { url = new URL(photo.url); } catch { continue; }
      if (url.protocol !== "https:") continue;
      if (!/^(?:inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)$/.test(url.hostname)) continue;
      if (!/^\/photos\/\d+\/square\.(?:jpe?g|png)$/i.test(url.pathname)) continue;
      const attribution = (photo.attribution ?? "").trim();
      const creator = by
        ? attribution.replace(/^(?:\(c\)|©)\s*/i, "").replace(/,\s*some rights reserved\s*\(CC BY\).*$/i, "").trim()
        : "";
      if (by && (!/some rights reserved\s*\(CC BY\)/i.test(attribution) || !creator || creator.length > 500)) continue;
      // The S3 medium image is documented by iNaturalist and avoids the tiny square crop.
      const href = url.href.replace(/\/square\.(jpe?g|png)$/i, "/medium.$1");
      return { url: href, creator, licence: cc0 ? "CC0 1.0" : "CC BY 4.0",
        licenceUrl: cc0 ? "https://creativecommons.org/publicdomain/zero/1.0/" : "https://creativecommons.org/licenses/by/4.0/" };
    }
  }
  return null;
}

async function lookup(species) {
  const u = new URL(api);
  for (const [key, value] of Object.entries({ taxon_name: species.name, quality_grade: "research", photos: "true",
    photo_license: "cc0,cc-by", per_page: "10" })) u.searchParams.set(key, value);
  const response = await fetch(u, { signal: AbortSignal.timeout(12000),
    headers: { "User-Agent": "ChlorisPhotoCatalog/1.0 (https://github.com/Andromachossp/chloris)" } });
  if (response.status === 429) throw new Error("iNaturalist rate limit (429)");
  if (!response.ok) throw new Error(`iNaturalist ${response.status}`);
  return pick((await response.json()).results ?? [], species);
}

let checked = 0;
let added = 0;
const pending = new Set();
let lastStart = Date.now() - 1100;
async function fill(s) {
  try {
    const photo = await lookup(s);
    if (photo) { catalog[s.slug] = photo; added++; }
  } catch (error) { console.warn(`${s.slug}: ${error.message}`); }
  checked++;
}
let started = 0;
for (const s of targets) {
  await sleep(Math.max(0, lastStart + 1100 - Date.now()));
  lastStart = Date.now();
  const task = fill(s);
  pending.add(task);
  task.finally(() => pending.delete(task));
  started++;
  if (pending.size >= 3) await Promise.race(pending);
  if (started % 10 === 0 || started === targets.length) {
    await Promise.all(pending);
    await writeFile(file, `${JSON.stringify(Object.fromEntries(Object.entries(catalog).sort()), null, 2)}\n`);
    console.log(`${checked}/${targets.length} checked; ${added} new; ${Object.keys(catalog).length} total`);
  }
}
