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

  it("issues six parallel queries for non-empty query", async () => {
    await globalSearch("psyche");
    // 3 findMany + 3 count = 6 calls
    expect(mockFindMany).toHaveBeenCalledTimes(3);
    expect(mockCount).toHaveBeenCalledTimes(3);
  });

  it("uses case-insensitive contains for episode search", async () => {
    await globalSearch("tarot");
    // First findMany call is episodes
    const episodeCall = mockFindMany.mock.calls[0][0];
    expect(episodeCall.where.status).toBe("published");
    expect(episodeCall.where.OR).toBeDefined();
    expect(episodeCall.where.OR.length).toBe(4);
    // Each OR clause should use insensitive contains
    for (const clause of episodeCall.where.OR) {
      const field = Object.keys(clause)[0];
      expect(clause[field].mode).toBe("insensitive");
      expect(clause[field].contains).toBe("tarot");
    }
  });

  it("aggregates results and counts from all entity types", async () => {
    // Mock findMany: episodes 2, people 1, lore 0
    mockFindMany
      .mockResolvedValueOnce([
        { id: "1", title: "ep1" },
        { id: "2", title: "ep2" },
      ])
      .mockResolvedValueOnce([{ id: "3", displayName: "person1" }])
      .mockResolvedValueOnce([]);

    // Mock count: episodes 15, people 5, lore 0
    mockCount
      .mockResolvedValueOnce(15)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(0);

    const results = await globalSearch("test");
    expect(results.episodes).toHaveLength(2);
    expect(results.people).toHaveLength(1);
    expect(results.lore).toHaveLength(0);
    expect(results.episodeTotalCount).toBe(15);
    expect(results.peopleTotalCount).toBe(5);
    expect(results.loreTotalCount).toBe(0);
    expect(results.totalCount).toBe(20);
  });

  it("trims the query before searching", async () => {
    await globalSearch("  hello world  ");
    const call = mockFindMany.mock.calls[0][0];
    expect(call.where.OR[0].title.contains).toBe("hello world");
  });
});
