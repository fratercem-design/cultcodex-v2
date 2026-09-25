// scripts/enrich/schemas.ts
import { z } from "zod";

export const EnrichedGuestSchema = z.object({
  name: z.string().min(1),
  // Same leniency as canonStatus below: an invented label ("co-host",
  // "caller") files the person as "mentioned" instead of failing the episode.
  personType: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.enum(["guest", "host", "mentioned", "recurring"]).catch("mentioned"),
  ),
  shortBio: z.string(),
});

export const EnrichedQuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().min(1),
  timestampSeconds: z.union([z.number(), z.null()]).transform((v) => (v == null ? null : Math.round(v))),
  context: z.string(),
  significance: z.string(),
});

export const EnrichedLoreSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  // Models sometimes vary the label ("Community Myth", "community-myth") or
  // invent one ("theoretical"). Normalise the spelling, and file anything still
  // unknown as "speculative" rather than failing the whole episode (1 of 16 in
  // run 35937449031 was lost to this).
  canonStatus: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase().replace(/[\s-]+/g, "_") : v),
    z
      .enum(["canonical", "speculative", "community_myth", "disputed", "humorous"])
      .catch("speculative"),
  ),
  category: z.string(),
});

export const EnrichmentResultSchema = z.object({
  summaryShort: z.string(),
  // Legacy — preserved for backward compat with older enriched episodes.
  // New enrichments populate summaryFacts + summaryThemes instead.
  summaryLong: z.string().optional().default(""),
  /** Transcript-grounded recap: who appeared, what was discussed, notable moments */
  summaryFacts: z.string().optional().default(""),
  /** Interpretive layer: recurring patterns, thematic significance, arc context */
  summaryThemes: z.string().optional().default(""),
  // Allow null/missing — for transcript-less enrichment the model often
  // can't produce a representative quote.
  cutOfPsyche: z.string().nullable().optional().default(""),
  guests: z.array(EnrichedGuestSchema),
  quotes: z.array(EnrichedQuoteSchema),
  lore: z.array(EnrichedLoreSchema),
  topics: z.array(z.string()),
});

export const ImportFileSchema = z.object({
  slug: z.string().min(1),
  data: EnrichmentResultSchema,
});

export type ImportFile = z.infer<typeof ImportFileSchema>;
export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;
export type EnrichedGuest = z.infer<typeof EnrichedGuestSchema>;
export type EnrichedQuote = z.infer<typeof EnrichedQuoteSchema>;
export type EnrichedLore = z.infer<typeof EnrichedLoreSchema>;
