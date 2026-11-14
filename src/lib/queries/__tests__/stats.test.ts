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
    $queryRaw: vi.fn().mockResolvedValue([
      { episodes: 100, segments: 5000, people: 50, topics: 150, lore: 200, quotes: 300, transcribed: 80, hours: 12.5 },
    ]),
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

describe("getCounts query shape", () => {
  it("reads every count in one query instead of one connection per count", async () => {
    vi.mocked(prisma.$queryRaw).mockClear();
    vi.mocked(prisma.episode.count).mockClear();
    vi.mocked(prisma.transcriptSegment.count).mockClear();
    const counts = await getCounts();
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.episode.count).not.toHaveBeenCalled();
    expect(prisma.transcriptSegment.count).not.toHaveBeenCalled();
    expect(counts).toMatchObject({ episodes: 100, segments: 5000, transcribedEpisodes: 80, transcribedPct: 80, totalHours: 12.5 });
  });
});

describe("getCountsOrNull (display guard)", () => {
  it("returns the counts when the archive can be read", async () => {
    const counts = await getCountsOrNull();
    expect(counts?.episodes).toBe(100);
  });

  it("returns null when the count query fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("connection refused"));
    expect(await getCountsOrNull()).toBeNull();
  });

  it("returns null when the archive reports zero episodes", async () => {
    // An empty archive means the app is reading the wrong database, not that
    // the archive is empty: never surface it as "0 episodes".
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([
      { episodes: 0, segments: 0, people: 0, topics: 0, lore: 0, quotes: 0, transcribed: 0, hours: 0 },
    ] as never);
    expect(await getCountsOrNull()).toBeNull();
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

describe("getEpisodeAggregates", () => {
  it("returns Date objects after the cache round trip", async () => {
    const { prisma: db } = await import("@/lib/db");
    const findFirst = vi.fn()
      .mockResolvedValueOnce({ airDate: new Date("2019-03-01T00:00:00Z") })
      .mockResolvedValueOnce({ airDate: new Date("2026-11-10T00:00:00Z") });
    Object.assign(db.episode, { findFirst });
    Object.assign(db, { episodeGuest: { count: vi.fn().mockResolvedValue(7) } });
    vi.mocked(db.episode.count).mockResolvedValue(100);

    const { getEpisodeAggregates } = await import("../stats");
    const aggregates = await getEpisodeAggregates();

    expect(aggregates.total).toBe(100);
    expect(aggregates.totalGuests).toBe(7);
    expect(aggregates.earliestDate).toBeInstanceOf(Date);
    expect(aggregates.latestDate?.toISOString()).toBe("2026-11-10T00:00:00.000Z");
  });
});
