import type { z } from "zod";
import type {
  CellsSchema, DataQualityFlag as DataQualityFlagSchema, EvidenceEntrySchema, EvidenceFileSchema, EmaStatus as EmaStatusSchema, Harvest as HarvestSchema,
  MetaSchema, NamesSchema, OccSchema, ReviewFlag as ReviewFlagSchema, RiskLevel as RiskLevelSchema, SpeciesSchema,
} from "./schemas";

export type { IucnCode } from "./iucn";
export type Harvest = z.infer<typeof HarvestSchema>;
export type EmaStatus = z.infer<typeof EmaStatusSchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type DataQualityFlag = z.infer<typeof DataQualityFlagSchema>;
export type ReviewFlag = z.infer<typeof ReviewFlagSchema>;
export type Species = z.infer<typeof SpeciesSchema>;
export type Names = z.infer<typeof NamesSchema>;
export type CellsFile = z.infer<typeof CellsSchema>;
export type Cell = CellsFile["cells"][number];
export type OccRow = z.infer<typeof OccSchema>[number];
export type Meta = z.infer<typeof MetaSchema>;
export type EvidenceEntry = z.infer<typeof EvidenceEntrySchema>;
export type EvidenceFile = z.infer<typeof EvidenceFileSchema>;
