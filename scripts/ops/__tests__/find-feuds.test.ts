import { describe, expect, it } from "vitest";
import { DRAMA, PLACEHOLDER } from "../find-feuds";

describe("DRAMA", () => {
  it("flags summaries that describe conflict or a turn", () => {
    for (const s of [
      "Psyche called out Samman for the leak",
      "The two had a falling-out in March",
      "a heated debate over the tarot deck",
      "they reconciled on air",
      "Beeta vs. Psyche round two",
    ]) expect(DRAMA.test(s), s).toBe(true);
  });

  it("ignores ordinary summaries", () => {
    for (const s of ["A late-night tarot reading and a ghost story", "Callers shared dreams about the moon"])
      expect(DRAMA.test(s), s).toBe(false);
  });
});

describe("PLACEHOLDER", () => {
  it("flags role and crowd labels", () => {
    for (const s of [
      "Speaker 3",
      "The host (analyzed streamer)",
      "Psyche (community user)",
      "Moderators and panel participants",
      "Beta's Kitties participants",
    ]) expect(PLACEHOLDER.test(s), s).toBe(true);
  });

  it("keeps named people", () => {
    for (const s of ["Psyche", "Psyche (Trix)", "Pyana (also Pyama/Pyron)", "Wardog", "Danny Stranger", "Schmemelly (Smelly)"])
      expect(PLACEHOLDER.test(s), s).toBe(false);
  });
});
