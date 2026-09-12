import { describe, it, expect } from "vitest";
import { groupSegments, type GroupableSegment } from "../group-segments";

function cue(
  i: number,
  start: number,
  text: string,
  speakerLabel: string | null = null,
  duration = 4
): GroupableSegment {
  return { id: `s${i}`, startSeconds: start, endSeconds: start + duration, speakerLabel, text };
}

describe("groupSegments", () => {
  it("folds consecutive cues into one block", () => {
    const blocks = groupSegments([cue(1, 0, "the first people"), cue(2, 4, "I even talked to")]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].text).toBe("the first people I even talked to");
    expect(blocks[0].startSeconds).toBe(0);
    expect(blocks[0].endSeconds).toBe(8);
    expect(blocks[0].cueStarts).toEqual([0, 4]);
  });

  it("preserves every word — nothing indexable is lost", () => {
    const segs = Array.from({ length: 500 }, (_, i) => cue(i, i * 4, `word${i} and more text here`));
    const joined = segs.map((s) => s.text).join(" ");
    expect(groupSegments(segs).map((b) => b.text).join(" ")).toBe(joined);
  });

  it("breaks on speaker change", () => {
    const blocks = groupSegments([cue(1, 0, "hello", "HOST"), cue(2, 4, "hi", "GUEST")]);
    expect(blocks).toHaveLength(2);
    expect(blocks.map((b) => b.speakerLabel)).toEqual(["HOST", "GUEST"]);
  });

  it("breaks once a block spans maxDurationSeconds", () => {
    const segs = Array.from({ length: 20 }, (_, i) => cue(i, i * 4, `t${i}`));
    const blocks = groupSegments(segs, { maxDurationSeconds: 25, gapSeconds: 999 });
    expect(blocks.length).toBeGreaterThan(1);
    for (const b of blocks) expect(b.endSeconds - b.startSeconds).toBeLessThanOrEqual(28);
  });

  it("breaks on a hard character cap", () => {
    const segs = Array.from({ length: 40 }, (_, i) => cue(i, i, "x".repeat(50), null, 0));
    const blocks = groupSegments(segs, { maxChars: 200, gapSeconds: 999, maxDurationSeconds: 9999 });
    for (const b of blocks) expect(b.text.length).toBeLessThanOrEqual(200);
  });

  it("breaks on a silence gap", () => {
    const blocks = groupSegments([cue(1, 0, "before"), cue(2, 60, "after")], { gapSeconds: 3 });
    expect(blocks).toHaveLength(2);
  });

  it("does not break on a negative gap from a malformed row", () => {
    const bad: GroupableSegment[] = [
      { id: "a", startSeconds: 0, endSeconds: 100, speakerLabel: null, text: "one" },
      { id: "b", startSeconds: 4, endSeconds: 8, speakerLabel: null, text: "two" },
    ];
    const blocks = groupSegments(bad, { maxDurationSeconds: 9999 });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].endSeconds).toBe(100);
  });

  it("skips blank cues and handles an empty list", () => {
    expect(groupSegments([])).toEqual([]);
    expect(groupSegments([cue(1, 0, "   "), cue(2, 4, "real")])).toHaveLength(1);
  });

  it("uses the first cue's id so keys are stable", () => {
    const blocks = groupSegments([cue(7, 0, "a"), cue(8, 4, "b")]);
    expect(blocks[0].id).toBe("s7");
  });
});
