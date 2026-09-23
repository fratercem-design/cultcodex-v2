import { describe, it, expect } from "vitest";
import { isSpeculativeSummary, trustedSummary } from "../speculative-summary";

describe("isSpeculativeSummary", () => {
  it("flags the EP.1908 summary that guessed from the title", () => {
    expect(
      isSpeculativeSummary(
        "Without the availability of a transcript, specific events and discussions in Episode 1908, 'Madness in the Middle of the Night,' cannot be detailed. It can be inferred from the title that the episode might involve interpretations…",
      ),
    ).toBe(true);
  });

  it("flags hedged one-liners", () => {
    expect(
      isSpeculativeSummary(
        "In this episode titled 'Madness in the Middle of the Night,' Psyche likely explores nighttime themes and perceptions of madness.",
      ),
    ).toBe(true);
    expect(isSpeculativeSummary("The title suggests a thematic exploration of altered states.")).toBe(true);
  });

  it("passes grounded summaries", () => {
    expect(
      isSpeculativeSummary(
        "Psyche delivers a tarot reading interpreting the Eight of Wands reversed, then opens the panel to a debate about accountability.",
      ),
    ).toBe(false);
    expect(isSpeculativeSummary("A likely story, Christine says, before pulling the Tower.")).toBe(false);
  });

  it("handles empty input", () => {
    expect(isSpeculativeSummary(null)).toBe(false);
    expect(isSpeculativeSummary("")).toBe(false);
    expect(trustedSummary(undefined)).toBeNull();
  });

  it("trustedSummary nulls speculation and keeps the rest", () => {
    expect(trustedSummary("Psyche likely explores madness.")).toBeNull();
    expect(trustedSummary("Psyche reads the Tower.")).toBe("Psyche reads the Tower.");
  });
});
