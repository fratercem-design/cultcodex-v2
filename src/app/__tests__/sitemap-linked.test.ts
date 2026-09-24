import { describe, it, expect } from "vitest";
import { indexableLinkedSubset, renderUrlSet, SITEMAP_SEGMENTS } from "@/lib/sitemap";
import { THIN_PAGE_MIN_EPISODES, isThinPage, thinPageRobots } from "@/lib/seo";

/**
 * Lore and topic pages are generated from the episode graph. Ones with zero or
 * one linked episode render little beyond the site chrome — sampled live at
 * ~240–330 visible words *including* nav and footer — yet all ~24k of them were
 * in the sitemap, five times the count of substantive episode + people pages.
 * They now carry `noindex` and leave the sitemap; the two must agree.
 */

const rows = [
  { slug: "orphan", _count: { episodes: 0 } },
  { slug: "single", _count: { episodes: 1 } },
  { slug: "pair", _count: { episodes: 2 } },
  { slug: "silence", _count: { episodes: 15 } },
];

describe("sitemap lore/topic filtering", () => {
  it("drops pages under the threshold and keeps the rest", () => {
    expect(indexableLinkedSubset(rows).map((r) => r.slug)).toEqual(["pair", "silence"]);
  });

  it("uses the same threshold the page metadata uses", () => {
    for (const r of rows) {
      const inSitemap = indexableLinkedSubset([r]).length === 1;
      const noindex = thinPageRobots(r._count.episodes).robots !== undefined;
      expect(inSitemap).toBe(!noindex);
    }
  });

  it("threshold is exactly the boundary", () => {
    expect(isThinPage(THIN_PAGE_MIN_EPISODES - 1)).toBe(true);
    expect(isThinPage(THIN_PAGE_MIN_EPISODES)).toBe(false);
  });

  it("noindex pages still pass link equity through", () => {
    expect(thinPageRobots(0)).toEqual({ robots: { index: false, follow: true } });
    expect(thinPageRobots(5)).toEqual({});
  });
});

describe("sitemap contract", () => {
  it("does not submit member URLs that robots.txt disallows", () => {
    expect(SITEMAP_SEGMENTS).not.toHaveProperty("members");
  });

  it("omits image extensions from lean child sitemaps", () => {
    const xml = renderUrlSet([{ url: "https://cultcodex.me/episodes/example" }]);
    expect(xml).not.toContain("xmlns:image");
    expect(xml).not.toContain("image:loc");
  });
});
