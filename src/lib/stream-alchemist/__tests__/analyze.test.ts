import { describe, expect, it } from "vitest";
import { analyzeLocal, MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, shorten } from "../analyze-local";
import { DEMO_TRANSCRIPT } from "../demo-transcript";
import { FREE_CLIP_LIMIT, lockClips } from "../pricing";

describe("analyzeLocal on the demo transcript", () => {
  const { clips, hasTimestamps } = analyzeLocal(DEMO_TRANSCRIPT);

  it("finds 10 ranked clips, strongest first", () => {
    expect(hasTimestamps).toBe(true);
    expect(clips).toHaveLength(10);
    expect(clips.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 1; i < clips.length; i++) expect(clips[i].score).toBeLessThanOrEqual(clips[i - 1].score);
  });

  it("keeps every clip clip-length and non-overlapping", () => {
    const sorted = [...clips].sort((a, b) => a.start! - b.start!);
    for (const c of sorted) {
      expect(c.end! - c.start!).toBeGreaterThanOrEqual(MIN_CLIP_SECONDS);
      expect(c.end! - c.start!).toBeLessThanOrEqual(MAX_CLIP_SECONDS);
    }
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].start!).toBeGreaterThanOrEqual(sorted[i - 1].end!);
  });

  it("fills every copy field", () => {
    for (const c of clips) {
      expect(c.title.length).toBeGreaterThan(5);
      expect(c.title.length).toBeLessThanOrEqual(90);
      expect(c.hook.split(/\s+/).length).toBeLessThanOrEqual(9);
      expect(c.shortsDescription).toContain("#shorts");
      expect(c.tiktokCaption.length).toBeGreaterThan(10);
      expect(c.thumbnailText.length).toBeGreaterThanOrEqual(1);
      expect(c.thumbnailText.length).toBeLessThanOrEqual(3);
      expect(c.hashtags.every((h) => /^#[a-z0-9]+$/.test(h))).toBe(true);
      expect(c.why.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("skips intros and sign-offs", () => {
    expect(clips.some((c) => c.start === 0)).toBe(false);
    expect(clips.some((c) => /bye chat/i.test(c.excerpt))).toBe(false);
  });

  it("quotes titles from the transcript rather than inventing them", () => {
    const flat = DEMO_TRANSCRIPT.replace(/\s+/g, " ");
    for (const c of clips) {
      const core = c.title.replace(/[“”…]/g, "").replace(/[?.]$/, "").trim();
      expect(flat).toContain(core.slice(1, 25));
    }
  });
});

describe("analyzeLocal without timestamps", () => {
  it("returns clips with null times and a searchable excerpt", () => {
    const untimed = DEMO_TRANSCRIPT.replace(/^\[\d\d:\d\d\] /gm, "");
    const { clips, hasTimestamps } = analyzeLocal(untimed);
    expect(hasTimestamps).toBe(false);
    expect(clips.length).toBeGreaterThanOrEqual(5);
    for (const c of clips) {
      expect(c.start).toBeNull();
      expect(c.end).toBeNull();
      expect(untimed.replace(/\s+/g, " ")).toContain(c.excerpt.replace(/…$/, "").slice(0, 20));
    }
  });

  it("returns nothing for text too short to hold a clip", () => {
    expect(analyzeLocal("Hi. Bye.").clips).toEqual([]);
  });
});

describe("shorten", () => {
  it("never splits a number at its thousands separator", () => {
    expect(shorten("A mattress company offered us $5,000 for one read and then more words", 8)).toContain("$5,000");
  });

  it("drops leading filler", () => {
    expect(shorten("Okay, so, um, never pay for views.", 10)).toBe("Never pay for views.");
  });
});

describe("lockClips", () => {
  it("shows the free limit in full and only position and score for the rest", () => {
    const { clips } = analyzeLocal(DEMO_TRANSCRIPT);
    const locked = lockClips(clips);
    expect(locked.clips).toHaveLength(FREE_CLIP_LIMIT);
    expect(locked.locked).toHaveLength(clips.length - FREE_CLIP_LIMIT);
    expect(Object.keys(locked.locked[0]).sort()).toEqual(["end", "rank", "score", "start"]);
  });
});
