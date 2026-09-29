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

import { prisma } from "@/lib/db";
import { getCounts, getCountsOrNull } from "../stats";

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

describe("getCountsOrNull (display guard)", () => {
  it("returns the counts when the archive can be read", async () => {
    const counts = await getCountsOrNull();
    expect(counts?.episodes).toBe(100);
  });

  it("returns null when the count query fails", async () => {
    vi.mocked(prisma.episode.count).mockRejectedValueOnce(new Error("connection refused"));
    expect(await getCountsOrNull()).toBeNull();
  });

  it("returns null when the archive reports zero episodes", async () => {
    // An empty archive means the app is reading the wrong database, not that
    // the archive is empty: never surface it as "0 episodes".
    vi.mocked(prisma.episode.count).mockResolvedValue(0);
    expect(await getCountsOrNull()).toBeNull();
    vi.mocked(prisma.episode.count).mockResolvedValue(100);
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
