import { describe, expect, it } from "vitest";
import { locateQuote, looksSquashed, toSegments } from "../squashed-transcripts";

describe("toSegments", () => {
  it("converts millisecond chunks the way the admin sync does", () => {
    expect(
      toSegments([
        { text: "[Music] hello there", offset: 125_400, duration: 2_800 },
        { text: "general kenobi", offset: 3_723_000, duration: 1_500 },
      ]),
    ).toEqual([
      { startSeconds: 125, endSeconds: 128, text: "hello there" },
      { startSeconds: 3723, endSeconds: 3725, text: "general kenobi" },
    ]);
  });
});

describe("looksSquashed", () => {
  const seg = (startSeconds: number) => ({ startSeconds, endSeconds: startSeconds + 3, text: "x" });

  it("flags 50+ segments in the first 30 seconds", () => {
    expect(looksSquashed(Array.from({ length: 60 }, (_, i) => seg(Math.floor(i / 6))))).toBe(true);
  });

  it("passes a normally paced transcript", () => {
    expect(looksSquashed(Array.from({ length: 600 }, (_, i) => seg(i * 3)))).toBe(false);
  });
});

describe("locateQuote", () => {
  const segments = [
    { id: "s1", startSeconds: 10, text: "okay so here's the thing" },
    { id: "s2", startSeconds: 13, text: "nobody tells you about growing" },
    { id: "s3", startSeconds: 16, text: "a channel, the numbers going up" },
    { id: "s4", startSeconds: 19, text: "don't make you feel better" },
  ];

  it("finds the segment a multi-cue quote starts in, ignoring case and punctuation", () => {
    expect(locateQuote("Nobody tells you about growing a channel. The numbers going up don't help!", segments)?.id).toBe("s2");
  });

  it("falls back to the first five words when the quote paraphrases its ending", () => {
    // First 8 words differ at "anybody"; the first 5 match across the s3/s4 boundary.
    expect(locateQuote("The numbers going up don't make anybody happier", segments)?.id).toBe("s3");
  });

  it("returns null when the quote isn't in the transcript", () => {
    expect(locateQuote("An entirely different sentence that was never said", segments)).toBeNull();
  });

  it("won't place quotes too short to match reliably", () => {
    expect(locateQuote("the thing", segments)).toBeNull();
  });
});
