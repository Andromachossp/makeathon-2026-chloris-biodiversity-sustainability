/* Prints how many plants fall into each verdict, using the same code as the app. Run: npx tsx scripts/verdict-stats.ts */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verdictFor } from "../lib/verdict";
import type { Meta, Species } from "../lib/types";

const dir = join(__dirname, "..", "public", "data");
const species = JSON.parse(readFileSync(join(dir, "species.json"), "utf8")) as Species[];
const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")) as Meta;
const counts: Record<string, number> = {};
const reasons: Record<string, number> = {};
for (const s of species) {
  const v = verdictFor(s, meta.verdicts);
  counts[v.key] = (counts[v.key] ?? 0) + 1;
  reasons[v.reason] = (reasons[v.reason] ?? 0) + 1;
}
console.log("config:", JSON.stringify(meta.verdicts));
console.log("verdicts:", counts);
console.log("reasons:", reasons);
const pick = (key: string, reason?: string) => species.find((s) => verdictFor(s, meta.verdicts).key === key && (!reason || verdictFor(s, meta.verdicts).reason === reason));
for (const [k, r] of [["protect", "protectIucn"], ["protect", "protectScore"], ["care", "careModerate"], ["care", "careEndemic"], ["notThreatened"], ["nodata"]] as const) {
  const s = pick(k, r); console.log("example", k, r ?? "", "->", s?.slug, s ? `(records ${s.stats.records}, iucn ${s.iucn}, level ${s.risk.level}, endemic ${s.endemic})` : "none");
}
