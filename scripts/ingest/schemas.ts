// scripts/ingest/schemas.ts
import { z } from "zod";

export const EpisodeRowSchema = z.object({
  title: z.string().min(1),
  episodeNumber: z.number().int().positive().optional(),
  airDate: z.string().optional(), // ISO date string "YYYY-MM-DD"
  duration: z.string().optional(), // "H:MM:SS"
  youtubeVideoId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  summaryShort: z.string().optional(),
  summaryLong: z.string().optional(),
  cutOfPsyche: z.string().optional(),
  series: z.string().optional(), // series slug to link
  guests: z.array(z.string()).default([]), // person display names
  topics: z.array(z.string()).default([]), // topic titles
  lore: z.array(z.string()).default([]), // lore entry titles
});

export type EpisodeRow = z.infer<typeof EpisodeRowSchema>;

export const PersonRowSchema = z.object({
  displayName: z.string().min(1),
  altNames: z.array(z.string()).default([]),
  shortBio: z.string().optional(),
  personType: z
    .enum(["guest", "host", "mentioned", "recurring"])
    .default("guest"),
  avatarUrl: z.string().url().optional(),
});

export type PersonRow = z.infer<typeof PersonRowSchema>;

export const TopicRowSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type TopicRow = z.infer<typeof TopicRowSchema>;

export const LoreRowSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  summary: z.string().optional(),
  fullEntry: z.string().optional(),
  canonStatus: z
    .enum(["canonical", "speculative", "community_myth", "disputed", "humorous"])
    .default("speculative"),
});

export type LoreRow = z.infer<typeof LoreRowSchema>;
