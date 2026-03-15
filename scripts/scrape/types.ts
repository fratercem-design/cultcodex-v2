import { z } from "zod";

export const YouTubeVideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  publishedAt: z.string(),
  duration: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  viewCount: z.number().nullable(),
  channelTitle: z.string(),
});

export type YouTubeVideo = z.infer<typeof YouTubeVideoSchema>;

export const YouTubeRawSchema = z.object({
  channelId: z.string(),
  channelTitle: z.string(),
  fetchedAt: z.string(),
  totalVideos: z.number(),
  videos: z.array(YouTubeVideoSchema),
});

export type YouTubeRaw = z.infer<typeof YouTubeRawSchema>;
