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
  summaryLong: z.string(),
  cutOfPsyche: z.string(),
  guests: z.array(EnrichedGuestSchema),
  quotes: z.array(EnrichedQuoteSchema),
  lore: z.array(EnrichedLoreSchema),
  topics: z.array(z.string()),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;
export type EnrichedGuest = z.infer<typeof EnrichedGuestSchema>;
export type EnrichedQuote = z.infer<typeof EnrichedQuoteSchema>;
export type EnrichedLore = z.infer<typeof EnrichedLoreSchema>;
