// scripts/ingest/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { EpisodeRowSchema, PersonRowSchema, TopicRowSchema } from "../schemas";

describe("EpisodeRowSchema", () => {
  it("accepts valid episode data", () => {
    const result = EpisodeRowSchema.safeParse({
      title: "Welcome to the Cult",
      episodeNumber: 1,
      airDate: "2023-01-15",
      youtubeVideoId: "abc123",
      summaryShort: "First episode.",
      guests: ["Dr. Arcana"],
      topics: ["Tarot", "Consciousness"],
    });
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = EpisodeRowSchema.safeParse({ episodeNumber: 1 });
    expect(result.success).toBe(false);
  });

  it("makes most fields optional", () => {
    const result = EpisodeRowSchema.safeParse({ title: "Minimal" });
    expect(result.success).toBe(true);
  });
});

describe("PersonRowSchema", () => {
  it("accepts valid person data", () => {
    const result = PersonRowSchema.safeParse({
      displayName: "Dr. Arcana",
      personType: "recurring",
    });
    expect(result.success).toBe(true);
  });

  it("defaults personType to guest", () => {
    const result = PersonRowSchema.parse({ displayName: "Someone" });
    expect(result.personType).toBe("guest");
  });
});

describe("TopicRowSchema", () => {
  it("accepts valid topic data", () => {
    const result = TopicRowSchema.safeParse({
      title: "Tarot",
      description: "Card readings",
    });
    expect(result.success).toBe(true);
  });
});
