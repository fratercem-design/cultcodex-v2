import { beforeEach, describe, it, expect, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  episodeFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { episode: { findMany: mocks.episodeFindMany } },
}));

import {
  buildEpisodeInclude,
  formatEpisodeForCard,
  getEpisodeCards,
  type EpisodeWithRelations,
} from "../episodes";

beforeEach(() => {
  mocks.episodeFindMany.mockReset();
  mocks.episodeFindMany.mockResolvedValue([]);
});

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
      thumbnailUrl: null,
      status: "published" as const,
      segments: [],
      guests: [{ person: { displayName: "Guest One", slug: "guest-one", personType: "guest" } }],
      topics: [{ topic: { title: "Tarot", slug: "tarot" } }],
    } as unknown as EpisodeWithRelations;

    const card = formatEpisodeForCard(episode);
    expect(card.title).toBe("Test Episode");
    expect(card.episodeNumber).toBe(42);
    expect(card.guestNames).toEqual(["Guest One"]);
    expect(card.topicNames).toEqual(["Tarot"]);
  });
});

describe("getEpisodeCards", () => {
  it("keeps person/topic browse results paginated and filtered in Prisma", async () => {
    await getEpisodeCards({
      personSlug: "psyche",
      topicSlug: "tarot-readings",
      take: 20,
      skip: 40,
    });

    expect(mocks.episodeFindMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 20,
      skip: 40,
      where: {
        OR: [
          { guests: { some: { person: { slug: "psyche" } } } },
          { mentionedPeople: { some: { person: { slug: "psyche" } } } },
        ],
        topics: { some: { topic: { slug: "tarot-readings" } } },
      },
    }));
  });
});
