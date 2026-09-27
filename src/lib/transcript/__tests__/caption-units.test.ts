import { describe, expect, it } from "vitest";
import { captionsToMs } from "../caption-units";

describe("captionsToMs", () => {
  it("leaves millisecond cues (srv3 captions) untouched", () => {
    const ms = [
      { text: "a", offset: 1360, duration: 1680, lang: "en" },
      { text: "b", offset: 125_000, duration: 3200, lang: "en" },
    ];
    expect(captionsToMs(ms)).toEqual(ms);
  });

  it("converts second-based cues (classic captions) to milliseconds", () => {
    const seconds = [
      { text: "a", offset: 1.36, duration: 1.68 },
      { text: "b", offset: 125, duration: 3.2 },
    ];
    const out = captionsToMs(seconds);
    expect(out.map((c) => c.offset)).toEqual([1360, 125_000]);
    expect(out[1].duration).toBeCloseTo(3200);
    expect(out[1].text).toBe("b");
  });

  // The bug this guards: a cue 2 minutes in, stored as offset/1000 = 0.125s.
  it("keeps a classic-format cue at its real time after the usual /1000", () => {
    const [cue] = captionsToMs([{ text: "two minutes in", offset: 125, duration: 3 }]);
    expect(Math.round(cue.offset / 1000)).toBe(125);
  });

  it("decides by the median, so one long or zero-length cue doesn't flip the unit", () => {
    const ms = [
      { text: "a", offset: 0, duration: 2000 },
      { text: "b", offset: 2000, duration: 0 },
      { text: "c", offset: 2000, duration: 3000 },
    ];
    expect(captionsToMs(ms)).toEqual(ms);
  });

  it("returns an empty list for no cues", () => {
    expect(captionsToMs([])).toEqual([]);
  });
});
