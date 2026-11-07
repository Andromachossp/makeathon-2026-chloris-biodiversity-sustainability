// Fill gaps with Wikimedia Commons files carrying CC0 or CC BY.
// Run from web/: node scripts/build-commons-photo-catalog.mjs [--deep|--category] [--limit=N]
// --category checks files in an exact species category even when their filename uses a common name.
// The catalog deliberately stores only a display URL and attribution.
import { readFile, writeFile } from "node:fs/promises";

const species = JSON.parse(await readFile("public/data/species.json", "utf8"));
const file = "public/data/photo-catalog.json";
const catalog = JSON.parse(await readFile(file, "utf8"));
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice(8)) : Infinity;
const slugArg = process.argv.find((arg) => arg.startsWith("--slug="));
const slug = slugArg?.slice(7);
const targets = species.filter((s) => !catalog[s.slug] && (!slug || s.slug === slug)).slice(0, limit);
const api = "https://commons.wikimedia.org/w/api.php";

function plain(html = "") {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ").trim();
}

function choose(pages, name, categoryMode = false) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exactName = new RegExp(`^File:${escaped}(?:[ ._(-]|$)`, "i");
  const candidates = Object.values(pages ?? {}).filter((page) => categoryMode || exactName.test(page.title))
    .filter((page) => /\.(jpe?g|png|webp)$/i.test(page.title));
  for (const page of candidates) {
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (!info?.thumburl || !meta) continue;
    const title = page.title.toLowerCase();
    if (/(?:gbif|inaturalist)[_ -]*(?:occurrence[_ -]*)?\d{5,}/i.test(title)) continue;
    const description = plain(meta.ImageDescription?.value).toLowerCase();
    if (/herbarium|herbier|spécimen|specimen|sheet|illustration|drawing|painting|diagram|cultivar|hybrid|flora of/.test(`${title} ${description}`)) continue;
    // File title and Commons category must both identify the species.
    const categories = (meta.Categories?.value ?? "").split("|").map((c) => c.trim().toLowerCase());
    if (categories.some((c) => /herbarium|herbier|specimen|spécimen|botanical illustration/.test(c))) continue;
    if (!categories.includes(name.toLowerCase())) continue;
    const rawLicense = meta.LicenseShortName?.value ?? "";
    const cc0 = rawLicense === "CC0" || rawLicense === "CC0 1.0";
    const by = /^CC BY (\d\.\d)$/.exec(rawLicense);
    if (!cc0 && !by) continue;
    const creator = plain(meta.Artist?.value);
    if (creator.length > 500) continue; // Never truncate a list of credited creators.
    if (by && (!creator || /^(unknown|anonymous)$/i.test(creator))) continue;
    const licence = cc0 ? "CC0 1.0" : `CC BY ${by[1]}`;
    const licenceUrl = cc0 ? "https://creativecommons.org/publicdomain/zero/1.0/"
      : `https://creativecommons.org/licenses/by/${by[1]}/`;
    const url = new URL(info.thumburl);
    if (url.protocol !== "https:" || !url.hostname.endsWith("wikimedia.org")) continue;
    return { url: url.href, creator, licence, licenceUrl };
  }
  return null;
}

async function lookup(name) {
  const u = new URL(api);
  const categoryMode = process.argv.includes("--category");
  const query = categoryMode
    ? { action: "query", format: "json", generator: "categorymembers", gcmtitle: `Category:${name}`,
      gcmtype: "file", gcmlimit: "50", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1200" }
    : { action: "query", format: "json", generator: "search", gsrsearch: `intitle:${name}`,
      gsrnamespace: "6", gsrlimit: process.argv.includes("--deep") ? "50" : "20",
      prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1200" };
  for (const [key, value] of Object.entries(query)) u.searchParams.set(key, value);
  const response = await fetch(u, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "ChlorisPhotoCatalog/1.0 (https://github.com/Andromachossp/chloris)" } });
  if (!response.ok) throw new Error(`Commons ${response.status}`);
  return choose((await response.json()).query?.pages, name, categoryMode);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let checked = 0;
let added = 0;
for (let start = 0; start < targets.length; start += 5) {
  await Promise.all(targets.slice(start, start + 5).map(async (s) => {
    try {
      const photo = await lookup(s.name);
      if (photo) { catalog[s.slug] = photo; added++; }
    } catch (error) { console.warn(`${s.slug}: ${error.message}`); }
  }));
  checked = Math.min(start + 5, targets.length);
  if (checked % 25 === 0 || checked === targets.length) {
    await writeFile(file, `${JSON.stringify(Object.fromEntries(Object.entries(catalog).sort()), null, 2)}\n`);
    console.log(`${checked}/${targets.length} checked; ${added} new; ${Object.keys(catalog).length} total`);
  }
  await sleep(1000); // At most five Commons requests per second.
}
