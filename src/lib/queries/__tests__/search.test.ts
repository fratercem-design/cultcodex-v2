import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the prisma client
const mockFindMany = vi.fn().mockResolvedValue([]);
const mockCount = vi.fn().mockResolvedValue(0);
vi.mock("@/lib/db", () => ({
  prisma: {
    episode: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    person: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    loreEntry: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    topic: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    quote: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    transcriptSegment: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import { globalSearch } from "../search";

beforeEach(() => {
  mockFindMany.mockClear();
  mockCount.mockClear();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

describe("globalSearch", () => {
  it("returns empty results for blank query", async () => {
    const results = await globalSearch("");
    expect(results.totalCount).toBe(0);
    expect(results.episodes).toEqual([]);
    expect(results.people).toEqual([]);
    expect(results.lore).toEqual([]);
    expect(results.episodeTotalCount).toBe(0);
    expect(results.peopleTotalCount).toBe(0);
    expect(results.loreTotalCount).toBe(0);
    // No prisma calls for empty query
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("returns empty results for whitespace-only query", async () => {
    const results = await globalSearch("   ");
    expect(results.totalCount).toBe(0);
    expect(mockFindMany).not.toHaveBeenCalled();
    expect(mockCount).not.toHaveBeenCalled();
  });

  it("issues parallel queries for all entity types", async () => {
    await globalSearch("psyche");
    // Episodes: 4 tiered findMany + 1 count = 5
    // People: 2 findMany + 1 count = 3
    // Lore: 2 findMany + 1 count = 3
    // Topics: 2 findMany + 1 count = 3
    // Quotes: 1 findMany + 1 count = 2
    // Transcripts: 1 findMany + 1 count = 2
    // Total: 12 findMany, 6 count
    expect(mockFindMany).toHaveBeenCalled();
    expect(mockCount).toHaveBeenCalledTimes(6);
  });

  it("aggregates results from all entity types", async () => {
    const results = await globalSearch("test");
    // Should have all entity type arrays
    expect(results).toHaveProperty("episodes");
    expect(results).toHaveProperty("people");
    expect(results).toHaveProperty("lore");
    expect(results).toHaveProperty("topics");
    expect(results).toHaveProperty("quotes");
    expect(results).toHaveProperty("transcripts");
    // All should be arrays
    expect(Array.isArray(results.episodes)).toBe(true);
    expect(Array.isArray(results.people)).toBe(true);
    expect(Array.isArray(results.lore)).toBe(true);
    expect(Array.isArray(results.topics)).toBe(true);
    expect(Array.isArray(results.quotes)).toBe(true);
    expect(Array.isArray(results.transcripts)).toBe(true);
  });

  it("includes total counts for all entity types", async () => {
    const results = await globalSearch("test");
    expect(results).toHaveProperty("episodeTotalCount");
    expect(results).toHaveProperty("peopleTotalCount");
    expect(results).toHaveProperty("loreTotalCount");
    expect(results).toHaveProperty("topicsTotalCount");
    expect(results).toHaveProperty("quotesTotalCount");
    expect(results).toHaveProperty("transcriptsTotalCount");
    expect(typeof results.totalCount).toBe("number");
  });
});
