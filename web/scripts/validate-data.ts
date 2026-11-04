/* Validates public/data/*.json against the zod schemas and checks cross-file consistency.
   Run: npm run validate-data */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CellsSchema, MetaSchema, NamesSchema, OccSchema, SpeciesSchema } from "../lib/schemas";
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
check("meta.json", MetaSchema, read("meta.json"));

const slugs = new Set(species?.map((s) => s.slug));
if (species) {
  if (slugs.size !== species.length) errors.push("species.json: duplicate slugs");
  if (new Set(species.map((s) => s.cat)).size !== species.length) errors.push("species.json: duplicate catalogue numbers");
  for (const s of species) {
    if (s.iucn === "NE" && s.iucnLabel.en !== "Not assessed") errors.push(`${s.slug}: NE must read "Not assessed"`);
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

if (errors.length) {
  console.error(`Data validation FAILED (${errors.length}):\n- ${errors.slice(0, 25).join("\n- ")}`);
  process.exit(1);
}
console.log(`OK: ${species?.length} species, ${cells?.cells.length} cells, ${occFiles} occ files, names ${Object.keys(names!.byName).length} validated.`);
