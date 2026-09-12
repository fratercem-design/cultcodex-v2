import { describe, it, expect } from "vitest";
import { indexableChapterSubset } from "../sitemap";

/**
 * The sitemap carried all 2,990 psychenomicon chapters. Only three of them
 * (DEFAULT_FREE_COUNT, the earliest by episode air date) are readable without a
 * subscription; the other 2,987 serve a crawler an identical ~1,450-character
 * "This chapter is sealed" shell. That made roughly 9% of the site's submitted
 * URLs near-duplicate thin content, and those pages now carry `noindex` — which
 * a sitemap entry would flatly contradict.
 */

const chapters = [
  { chapterNumber: 1, slug: "chapter-001" },
  { chapterNumber: 2, slug: "chapter-002" },
  { chapterNumber: 3, slug: "chapter-003" },
  { chapterNumber: 4, slug: "chapter-004" },
  { chapterNumber: 5, slug: "chapter-005" },
];

describe("sitemap chapter filtering", () => {
  it("keeps only the free-preview chapters", () => {
    expect(indexableChapterSubset(chapters, [1, 2, 3]).map((c) => c.slug)).toEqual([
      "chapter-001",
      "chapter-002",
      "chapter-003",
    ]);
  });

  it("drops every sealed chapter", () => {
    const kept = indexableChapterSubset(chapters, [1, 2, 3]).map((c) => c.chapterNumber);
    expect(kept).not.toContain(4);
    expect(kept).not.toContain(5);
  });

  it("emits nothing when no chapter is free", () => {
    expect(indexableChapterSubset(chapters, [])).toEqual([]);
  });

  it("does not care about ordering or gaps in the free list", () => {
    expect(indexableChapterSubset(chapters, [5, 1]).map((c) => c.chapterNumber)).toEqual([1, 5]);
  });

  it("ignores free numbers with no matching chapter", () => {
    expect(indexableChapterSubset(chapters, [99]).map((c) => c.chapterNumber)).toEqual([]);
  });

  it("scales the way the real data does — 3 free out of ~2,990", () => {
    const many = Array.from({ length: 2990 }, (_, i) => ({ chapterNumber: i + 1 }));
    const kept = indexableChapterSubset(many, [1, 2, 3]);
    expect(kept).toHaveLength(3);
    // the point of the change: 2,987 URLs leave the sitemap
    expect(many.length - kept.length).toBe(2987);
  });
});
