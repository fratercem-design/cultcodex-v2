import { describe, expect, it } from "vitest";
import { DRAMA } from "../find-feuds";

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
