import { describe, it, expect, vi } from "vitest";
import type { SiteCounts } from "@/lib/queries/stats";

// unstable_cache requires Next.js runtime infra; make it a transparent pass-through
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    episode: {
      count: vi.fn().mockResolvedValue(100),
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { value: 0 } }),
    },
    person: { count: vi.fn().mockResolvedValue(50) },
    loreEntry: { count: vi.fn().mockResolvedValue(200) },
    quote: { count: vi.fn().mockResolvedValue(300) },
    series: { count: vi.fn().mockResolvedValue(10) },
    topic: { count: vi.fn().mockResolvedValue(150) },
    transcriptSegment: { count: vi.fn().mockResolvedValue(5000) },
    $queryRaw: vi.fn().mockResolvedValue([{ total_hours: "0" }]),
  },
}));

import { getCounts } from "../stats";

describe("getCounts (canonical archive stats)", () => {
  it("returns all required SiteCounts fields", async () => {
    const counts = await getCounts();

    const requiredKeys: (keyof SiteCounts)[] = [
      "episodes",
      "segments",
      "people",
      "topics",
      "lore",
      "quotes",
      "totalHours",
      "transcribedEpisodes",
      "transcribedPct",
    ];

    for (const key of requiredKeys) {
      expect(counts).toHaveProperty(key);
      expect(typeof counts[key]).toBe("number");
    }
  });
});

describe("SiteCounts type completeness", () => {
  it("has all required fields", () => {
    const mockCounts: SiteCounts = {
      episodes: 1,
      segments: 1,
      people: 1,
      topics: 1,
      lore: 1,
      quotes: 1,
      totalHours: 1,
      transcribedEpisodes: 1,
      transcribedPct: 1,
    };
    expect(Object.keys(mockCounts)).toHaveLength(9);
  });
});
