import { describe, it, expect, vi } from "vitest";
import type { ArchiveStats } from "@/types";

// Bypass Next.js cache in test environment
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  revalidateTag: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    episode: { count: vi.fn().mockResolvedValue(100), findMany: vi.fn().mockResolvedValue([]) },
    person: { count: vi.fn().mockResolvedValue(50) },
    loreEntry: { count: vi.fn().mockResolvedValue(200) },
    quote: { count: vi.fn().mockResolvedValue(300) },
    series: { count: vi.fn().mockResolvedValue(10) },
    topic: { count: vi.fn().mockResolvedValue(150) },
    transcriptSegment: { count: vi.fn().mockResolvedValue(5000) },
    codexComment: { count: vi.fn().mockResolvedValue(0) },
    episodeReaction: { count: vi.fn().mockResolvedValue(0) },
    episodeGuest: { count: vi.fn().mockResolvedValue(400) },
  },
}));

import { getArchiveStats } from "../stats";

describe("getArchiveStats (canonical)", () => {
  it("returns all required fields", async () => {
    const stats = await getArchiveStats();

    // Verify all ArchiveStats fields are present
    const requiredKeys: (keyof ArchiveStats)[] = [
      "episodes",
      "people",
      "loreEntries",
      "quotes",
      "series",
      "topics",
      "segments",
      "totalHours",
      "comments",
      "reactions",
    ];

    for (const key of requiredKeys) {
      expect(stats).toHaveProperty(key);
      expect(typeof stats[key]).toBe("number");
    }
  });

  it("returns correct mock values", async () => {
    const stats = await getArchiveStats();
    expect(stats.episodes).toBe(100);
    expect(stats.people).toBe(50);
    expect(stats.loreEntries).toBe(200);
    expect(stats.quotes).toBe(300);
    expect(stats.series).toBe(10);
    expect(stats.topics).toBe(150);
    expect(stats.segments).toBe(5000);
    expect(stats.totalHours).toBe(0); // No duration data mocked
    expect(stats.comments).toBe(0);
    expect(stats.reactions).toBe(0);
  });
});

describe("ArchiveStats type completeness", () => {
  it("has both homepage and stats page fields", () => {
    // This test ensures the canonical type includes fields from both
    // the old stats.ts (series, topics) and old analytics.ts (segments, totalHours, comments, reactions)
    const mockStats: ArchiveStats = {
      episodes: 1,
      people: 1,
      loreEntries: 1,
      quotes: 1,
      series: 1,
      topics: 1,
      segments: 1,
      totalHours: 1,
      comments: 1,
      reactions: 1,
      transcribedEpisodes: 1,
    };
    expect(Object.keys(mockStats)).toHaveLength(11);
  });
});
