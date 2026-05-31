// scripts/enrich/schemas.ts
import { z } from "zod";

export const EnrichedGuestSchema = z.object({
  name: z.string().min(1),
  personType: z.enum(["guest", "host", "mentioned", "recurring"]),
  shortBio: z.string(),
});

export const EnrichedQuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().min(1),
  timestampSeconds: z.number().int().nullable(),
  context: z.string(),
  significance: z.string(),
});

export const EnrichedLoreSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  canonStatus: z.enum([
    "canonical",
    "speculative",
    "community_myth",
    "disputed",
    "humorous",
  ]),
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
