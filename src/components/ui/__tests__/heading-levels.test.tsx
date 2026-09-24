import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionCard } from "../section-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";

/**
 * Regression guard for the heading-outline inversion found on the live site.
 *
 * Measured on /topics/consciousness before the fix:
 *
 *   H1  consciousness
 *   H3  Episodes (80)        <- SectionCard, skipping H1 -> H3
 *   H2  <episode title> x80  <- EpisodeListItem, nested INSIDE that H3
 *
 * Every list item outranked the section heading containing it. These tests pin
 * both the defaults (so existing callers keep their level) and the opt-in
 * overrides that let a page express a correct outline.
 */

const EPISODE = {
  slug: "an-episode",
  title: "An Episode Title",
  episodeNumber: 12,
  airDate: null,
  summaryShort: null,
  thumbnailUrl: null,
};

describe("SectionCard heading level", () => {
  it("defaults to h3, preserving the level existing callers already render", () => {
    render(<SectionCard title="Summary">body</SectionCard>);
    expect(screen.getByRole("heading", { name: "Summary", level: 3 })).toBeDefined();
  });

  it("renders h2 when the card is a top-level section under the page h1", () => {
    render(<SectionCard headingLevel={2} title="Summary">body</SectionCard>);
    expect(screen.getByRole("heading", { name: "Summary", level: 2 })).toBeDefined();
  });

  it("renders no heading at all when there is no title", () => {
    render(<SectionCard>body</SectionCard>);
    expect(screen.queryByRole("heading")).toBeNull();
  });
});

describe("EpisodeListItem heading level", () => {
  it("defaults to h2, which is correct on the archive index under the page h1", () => {
    render(<EpisodeListItem {...EPISODE} />);
    expect(screen.getByRole("heading", { name: EPISODE.title, level: 2 })).toBeDefined();
  });

  it("renders h3 when nested inside a titled section", () => {
    render(<EpisodeListItem {...EPISODE} headingLevel={3} />);
    expect(screen.getByRole("heading", { name: EPISODE.title, level: 3 })).toBeDefined();
  });
});

describe("section + nested items produce a non-inverted outline", () => {
  it("does NOT let a list item outrank the section heading that contains it", () => {
    render(
      <SectionCard headingLevel={2} title="Episodes (2)">
        <EpisodeListItem {...EPISODE} slug="a" title="First" headingLevel={3} />
        <EpisodeListItem {...EPISODE} slug="b" title="Second" headingLevel={3} />
      </SectionCard>
    );

    const levels = screen
      .getAllByRole("heading")
      .map((h) => Number(h.tagName.slice(1)));

    // section first, then its items, each exactly one level deeper
    expect(levels).toEqual([2, 3, 3]);

    // and no item is a lower number (higher rank) than its container
    const [section, ...items] = levels;
    expect(items.every((l) => l > section)).toBe(true);
  });
});
