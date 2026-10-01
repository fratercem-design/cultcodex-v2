// @vitest-environment node
import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// A database timeout while loading an episode used to be swallowed by
// `.catch(() => null)` and turned into notFound(), so real, sitemap-listed
// episodes were served (and could be cached and indexed) as 404s. Only a null
// result may mean "not found"; a failed query has to throw so the visitor
// gets a retryable 5xx.

const src = readFileSync(path.resolve(import.meta.dirname, "../[slug]/page.tsx"), "utf-8");

describe("episode detail page", () => {
  it("does not turn a failed episode query into a 404", () => {
    expect(src).not.toMatch(/getEpisodeBySlug\([^)]*\)\s*\.catch/);
    expect(src).not.toMatch(/loadEpisode\([^)]*\)\s*\.catch/);
  });

  it("shares one episode query between generateMetadata and the page", () => {
    expect(src).toMatch(/const loadEpisode = cache\(getEpisodeBySlug\)/);
    expect(src.match(/getEpisodeBySlug\(/g) ?? []).toHaveLength(0);
    expect(src.match(/await loadEpisode\(slug\)/g)).toHaveLength(2);
  });
});
