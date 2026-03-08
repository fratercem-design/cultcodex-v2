import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { buildEpisodeInclude, formatEpisodeForCard, type EpisodeWithRelations } from "../episodes";

describe("buildEpisodeInclude", () => {
  it("returns a Prisma include object", () => {
    const include = buildEpisodeInclude();
    expect(include).toHaveProperty("series");
    expect(include).toHaveProperty("guests");
    expect(include).toHaveProperty("topics");
  });
});

describe("formatEpisodeForCard", () => {
  it("formats episode data for card display", () => {
    const episode = {
      id: "1",
      title: "Test Episode",
      slug: "test-episode",
      episodeNumber: 42,
      airDate: new Date("2024-01-15"),
      summaryShort: "A test episode.",
      status: "published" as const,
      guests: [{ person: { displayName: "Guest One", slug: "guest-one" } }],
      topics: [{ topic: { title: "Tarot", slug: "tarot" } }],
    } as unknown as EpisodeWithRelations;

    const card = formatEpisodeForCard(episode);
    expect(card.title).toBe("Test Episode");
    expect(card.episodeNumber).toBe(42);
    expect(card.guestNames).toEqual(["Guest One"]);
    expect(card.topicNames).toEqual(["Tarot"]);
  });
});
