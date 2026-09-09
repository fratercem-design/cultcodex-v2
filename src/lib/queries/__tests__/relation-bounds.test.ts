import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  buildPersonInclude,
  PERSON_APPEARANCES_TAKE,
  PERSON_MENTIONS_TAKE,
  PERSON_QUOTES_TAKE,
} from "../people";
import {
  buildTopicInclude,
  TOPIC_EPISODES_TAKE,
  TOPIC_LORE_TAKE,
  TOPIC_PEOPLE_TAKE,
} from "../topics";

describe("detail-page relation bounds", () => {
  it("caps person appearances, mentions, and quotes while retaining counts", () => {
    const include = buildPersonInclude();

    expect(include.guestAppearances.take).toBe(PERSON_APPEARANCES_TAKE);
    expect(include.mentions.take).toBe(PERSON_MENTIONS_TAKE);
    expect(include.quotes.take).toBe(PERSON_QUOTES_TAKE);
    expect(include._count.select).toEqual(expect.objectContaining({
      guestAppearances: true,
      mentions: true,
      quotes: true,
    }));
  });

  it("caps topic relations and selects card-shaped episode data", () => {
    const include = buildTopicInclude();

    expect(include.episodes.take).toBe(TOPIC_EPISODES_TAKE);
    expect(include.people.take).toBe(TOPIC_PEOPLE_TAKE);
    expect(include.lore.take).toBe(TOPIC_LORE_TAKE);
    expect(include.episodes.select.episode.select).toEqual(expect.objectContaining({
      id: true,
      slug: true,
      title: true,
      summaryShort: true,
    }));
    expect(include.episodes.select.episode.select).not.toHaveProperty("segments");
  });
});
