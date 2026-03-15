// scripts/enrich/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { EnrichmentResultSchema, ImportFileSchema } from "../schemas";

describe("EnrichmentResultSchema", () => {
  it("parses a valid enrichment result", () => {
    const input = {
      summaryShort: "A discussion about tarot and consciousness.",
      summaryLong: "In this episode, the host explores...\n\nThe conversation turns to...",
      cutOfPsyche: "Welcome to the cult, baby!",
      guests: [
        { name: "John Doe", personType: "guest", shortBio: "Tarot reader and mystic" },
      ],
      quotes: [
        {
          text: "The cards never lie.",
          speaker: "John Doe",
          timestampSeconds: 1234,
          context: "During a tarot reading",
          significance: "Core philosophy of the show",
        },
      ],
      lore: [
        {
          title: "The Veil",
          summary: "A metaphorical boundary between worlds",
          canonStatus: "canonical",
          category: "cosmology",
        },
      ],
      topics: ["tarot", "consciousness", "mythology"],
    };
    const result = EnrichmentResultSchema.parse(input);
    expect(result.guests).toHaveLength(1);
    expect(result.quotes[0].timestampSeconds).toBe(1234);
    expect(result.lore[0].canonStatus).toBe("canonical");
  });

  it("allows nullable timestampSeconds in quotes", () => {
    const input = {
      summaryShort: "Short summary.",
      summaryLong: "Long summary.",
      cutOfPsyche: "",
      guests: [],
      quotes: [
        {
          text: "Some quote",
          speaker: "Unknown",
          timestampSeconds: null,
          context: "",
          significance: "",
        },
      ],
      lore: [],
      topics: [],
    };
    const result = EnrichmentResultSchema.parse(input);
    expect(result.quotes[0].timestampSeconds).toBeNull();
  });

  it("rejects invalid canonStatus", () => {
    const input = {
      summaryShort: "x",
      summaryLong: "x",
      cutOfPsyche: "",
      guests: [],
      quotes: [],
      lore: [{ title: "x", summary: "x", canonStatus: "invalid", category: "x" }],
      topics: [],
    };
    expect(() => EnrichmentResultSchema.parse(input)).toThrow();
  });

  it("rejects invalid personType", () => {
    const input = {
      summaryShort: "x",
      summaryLong: "x",
      cutOfPsyche: "",
      guests: [{ name: "x", personType: "villain", shortBio: "" }],
      quotes: [],
      lore: [],
      topics: [],
    };
    expect(() => EnrichmentResultSchema.parse(input)).toThrow();
  });
});

describe("ImportFileSchema", () => {
  it("wraps enrichment result with slug", () => {
    const input = {
      slug: "the-veil-lifts",
      data: {
        summaryShort: "A discussion about tarot.",
        summaryLong: "In this episode...",
        cutOfPsyche: "Welcome!",
        guests: [],
        quotes: [],
        lore: [],
        topics: [],
      },
    };
    const result = ImportFileSchema.parse(input);
    expect(result.slug).toBe("the-veil-lifts");
  });
});
