/* Validates public/data/*.json against the zod schemas and checks cross-file consistency.
   Run: npm run validate-data */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CellsSchema, EvidenceFileSchema, MetaSchema, NamesSchema, OccSchema, SpeciesSchema } from "../lib/schemas";
import { z } from "zod";

const dir = join(__dirname, "..", "public", "data");
const read = (f: string) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const errors: string[] = [];
const check = <T extends z.ZodTypeAny>(label: string, schema: T, data: unknown): z.infer<T> | null => {
  const r = schema.safeParse(data);
  if (!r.success) {
    errors.push(`${label}: ${r.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ")}`);
    return null;
  }
  return r.data;
};

const species = check("species.json", z.array(SpeciesSchema), read("species.json"));
const names = check("names.json", NamesSchema, read("names.json"));
const cells = check("cells.json", CellsSchema, read("cells.json"));
const meta = check("meta.json", MetaSchema, read("meta.json"));

const slugs = new Set(species?.map((s) => s.slug));
const PhotoSchema = z.strictObject({
  url: z.string().refine((value) => /^https:\/\//.test(value) || /^\/photos\/[a-z0-9-]+\.(?:jpe?g|png|webp)$/.test(value), "image URL must be HTTPS or a local /photos/ image"),
  creator: z.string().max(500),
  licence: z.string().regex(/^CC0 1\.0$|^CC BY \d\.\d$|^CC BY-NC 4\.0$/),
  licenceUrl: z.url(),
});
const photos = check("photo-catalog.json", z.record(z.string(), PhotoSchema), read("photo-catalog.json"));
if (photos) for (const [slug, photo] of Object.entries(photos)) {
  if (!slugs.has(slug)) errors.push(`photo-catalog.json: unknown species ${slug}`);
  if (photo.url.startsWith("/photos/") && !existsSync(join(dir, "..", photo.url.slice(1)))) errors.push(`photo-catalog.json: missing local photo ${photo.url}`);
  if (photo.url.includes("wikimedia.org") && /(?:gbif|inaturalist)[_ -]*(?:occurrence[_ -]*)?\d{5,}/i.test(decodeURIComponent(photo.url))) errors.push(`photo-catalog.json: ${slug} image URL includes an occurrence ID`);
  if (photo.licence.startsWith("CC BY") && !photo.creator) errors.push(`photo-catalog.json: ${slug} lacks creator`);
  if (photo.licence.includes("-NC") && slug !== "galanthus-ikariae") errors.push(`photo-catalog.json: NC exception is only approved for Galanthus ikariae`);
  const expected = photo.licence === "CC0 1.0" ? "https://creativecommons.org/publicdomain/zero/1.0/"
    : photo.licence === "CC BY-NC 4.0" ? "https://creativecommons.org/licenses/by-nc/4.0/"
    : `https://creativecommons.org/licenses/by/${photo.licence.slice(6)}/`;
  if (photo.licenceUrl !== expected) errors.push(`photo-catalog.json: ${slug} has mismatched licence URL`);
}
if (species) {
  if (slugs.size !== species.length) errors.push("species.json: duplicate slugs");
  if (new Set(species.map((s) => s.cat)).size !== species.length) errors.push("species.json: duplicate catalogue numbers");
  for (const s of species) {
    if (s.iucn === "NE" && s.iucnLabel.en !== "Not assessed yet") errors.push(`${s.slug}: NE must read "Not assessed yet"`);
    for (const sub of s.curated?.substitutes ?? []) if (!slugs.has(sub)) errors.push(`${s.slug}: unknown substitute ${sub}`);
  }
}
if (names) for (const [k, v] of [...Object.entries(names.byName), ...Object.entries(names.byPowo), ...Object.entries(names.byGbif)]) {
  if (!slugs.has(v)) { errors.push(`names.json: ${k} -> unknown slug ${v}`); break; }
}
if (cells && species) for (const c of cells.cells) {
  if (c.s.some((i) => i >= species.length)) { errors.push(`cells.json: ${c.id} has an index out of range`); break; }
}
let occFiles = 0;
if (existsSync(join(dir, "occ"))) {
  for (const f of readdirSync(join(dir, "occ"))) {
    occFiles++;
    if (!slugs.has(f.replace(/\.json$/, ""))) errors.push(`occ/${f}: no such species`);
    check(`occ/${f}`, OccSchema, JSON.parse(readFileSync(join(dir, "occ", f), "utf8")));
  }
}

// evidence cards: every file must validate, belong to a featured species, and be listed in meta.json (and the reverse)
let evidenceFiles = 0;
const evDir = join(dir, "evidence");
const evOnDisk = existsSync(evDir) ? readdirSync(evDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort() : [];
for (const slug of evOnDisk) {
  evidenceFiles++;
  const file = check(`evidence/${slug}.json`, EvidenceFileSchema, JSON.parse(readFileSync(join(evDir, `${slug}.json`), "utf8")));
  const want = meta?.evidenceCounts[slug];
  if (file && (!want || want.entries !== file.entries.length || want.safetyNotes !== new Set(file.entries.flatMap((e) => (e.safetyNote ? [e.safetyNote] : []))).size)) errors.push(`evidence/${slug}.json: meta.json evidenceCounts does not match the file`);
  if (file && file.slug !== slug) errors.push(`evidence/${slug}.json: slug inside the file is ${file.slug}`);
  const sp = species?.find((s) => s.slug === slug);
  if (!sp) errors.push(`evidence/${slug}.json: no such species`);
  else if (!sp.featured) errors.push(`evidence/${slug}.json: evidence is only allowed for featured species`);
}
if (meta && JSON.stringify([...meta.evidenceSlugs].sort()) !== JSON.stringify(evOnDisk)) errors.push(`meta.json evidenceSlugs (${meta.evidenceSlugs.join(",")}) does not match evidence/ files (${evOnDisk.join(",")})`);

if (errors.length) {
  console.error(`Data validation FAILED (${errors.length}):\n- ${errors.slice(0, 25).join("\n- ")}`);
  process.exit(1);
}
console.log(`OK: ${species?.length} species, ${cells?.cells.length} cells, ${occFiles} occ files, ${evidenceFiles} evidence files, names ${Object.keys(names!.byName).length} validated.`);
