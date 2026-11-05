import { z } from "zod";

/** Zod schemas for every file in public/data/. They mirror docs/DATA_MODEL.md; types.ts infers from them. */
export const IucnCode = z.enum(["CR", "EN", "VU", "NT", "LC", "DD", "NE"]);
export const Harvest = z.enum(["safe", "careful", "do-not-harvest", "unknown"]);
export const EmaStatus = z.enum(["well-established", "traditional", "none", "unknown"]);
export const RiskLevel = z.enum(["low", "moderate", "high", "critical"]);
export const DataQualityFlag = z.enum(["gbif_synonym_match", "gbif_shared_key", "gbif_no_match"]);
export const ReviewFlag = z.enum(["name_only_match", "native_status_check"]);

const LocalisedLabel = z.object({ en: z.string().min(1), el: z.string().min(1) }).strict();

export const SpeciesSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    cat: z.string().regex(/^CHL-\d{4}$/),
    name: z.string().min(1),
    authors: z.string(),
    family: z.string().min(1),
    nameEl: z.string().nullable(),
    nameEn: z.string().nullable(),
    powoId: z.string().nullable(),
    gbifKey: z.number().int().nullable(),
    endemic: z.boolean(),
    iucn: IucnCode,
    iucnLabel: LocalisedLabel,
    dataQuality: z.array(DataQualityFlag),
    review: z.array(ReviewFlag),
    reviewNote: z.string().nullable(),
    medicinalSource: z.enum(["wcups", "curated"]),
    risk: z
      .object({
        score: z.number().int().min(0).max(100),
        level: RiskLevel,
        atRisk: z.boolean(),
        parts: z
          .object({
            iucn: z.number(),
            endemic: z.number(),
            rarity: z.number().nullable(),
            decline: z.number().nullable(),
            unprotected: z.number().nullable(),
            fire: z.number().nullable(),
          })
          .strict(),
      })
      .strict(),
    stats: z
      .object({
        records: z.number().int().min(0),
        cells: z.number().int().min(0),
        recordsOld: z.number().int().min(0),
        recordsNew: z.number().int().min(0),
        declineRatio: z.number().nullable(),
        protectedShare: z.number().min(0).max(1).nullable(),
        fireShare: z.number().min(0).max(1).nullable(),
        firstYear: z.number().int().nullable(),
        lastYear: z.number().int().nullable(),
      })
      .strict(),
    featured: z.boolean(),
    curated: z
      .object({
        usesEn: z.string(),
        usesEl: z.string(),
        ema: EmaStatus,
        emaUrl: z.string().nullable(),
        harvest: Harvest,
        substitutes: z.array(z.string()),
        reviewedBy: z.string().nullable(),
      })
      .strict()
      .optional(),
    photo: z
      .object({ url: z.string(), credit: z.string(), licence: z.string(), source: z.string() })
      .strict()
      .optional(),
  })
  .strict();

export const NamesSchema = z
  .object({
    byName: z.record(z.string(), z.string()),
    byPowo: z.record(z.string(), z.string()),
    byGbif: z.record(z.string(), z.string()),
  })
  .strict();

export const CellsSchema = z
  .object({
    size: z.number(),
    cells: z.array(
      z
        .object({
          id: z.string().regex(/^\d+_\d+$/),
          s: z.array(z.number().int().min(0)),
          nAtRisk: z.number().int().min(0),
          nEndemic: z.number().int().min(0),
          protected: z.number().min(0).max(1).nullable(),
          hotspot: z.boolean().nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export const OccSchema = z.array(
  z
    .object({
      c: z.string().regex(/^\d+_\d+$/),
      n: z.number().int().min(1),
      f: z.number().int().nullable(),
      l: z.number().int().nullable(),
      o: z.number().int().min(0),
      w: z.number().int().min(0),
    })
    .strict(),
);

export const MetaSchema = z
  .object({
    generatedAt: z.string(),
    sources: z.array(
      z
        .object({ name: z.string(), version: z.string(), url: z.string(), licence: z.string(), doi: z.string().optional() })
        .strict(),
    ),
    counts: z
      .object({
        greekNatives: z.number().int(),
        medicinal: z.number().int(),
        featured: z.number().int(),
        records: z.number().int(),
        cells: z.number().int(),
        atRisk: z.number().int(),
      })
      .strict(),
    scoring: z.record(z.string(), z.unknown()),
    verdicts: z
      .object({
        version: z.string(),
        min_records: z.number().int().min(0),
        protect_iucn: z.array(IucnCode),
        protect_levels: z.array(RiskLevel),
        care_levels: z.array(RiskLevel),
        care_if_endemic: z.boolean(),
      })
      .strict(),
    effort: z.record(z.string(), z.union([z.number(), z.string()])),
    notes: z.array(z.string()),
    flagLegend: z.record(z.string(), z.string()),
    iucnLabels: z.record(IucnCode, LocalisedLabel),
  })
  .strict();
