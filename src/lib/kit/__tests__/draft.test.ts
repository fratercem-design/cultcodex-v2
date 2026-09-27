import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import {
  formatTimestamp,
  formatTranscript,
  parseSrt,
  renderDraftMarkdown,
  segmentsFromYouTube,
  tidyDraft,
  youtubeVideoId,
  type KitDraft,
} from "../draft";

describe("formatTimestamp", () => {
  it.each([
    [0, "0:00"],
    [59.9, "0:59"],
    [252, "4:12"],
    [3723, "1:02:03"],
    [-5, "0:00"],
  ])("%s → %s", (sec, out) => expect(formatTimestamp(sec)).toBe(out));
});

describe("youtubeVideoId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dNr0T1zcJWc", "dNr0T1zcJWc"],
    ["https://youtu.be/dNr0T1zcJWc?t=30", "dNr0T1zcJWc"],
    ["https://youtube.com/live/dNr0T1zcJWc?feature=share", "dNr0T1zcJWc"],
    ["https://m.youtube.com/shorts/dNr0T1zcJWc", "dNr0T1zcJWc"],
    ["https://rumble.com/v6wjkx6-vod.html", null],
    ["not a url", null],
  ])("%s", (url, id) => expect(youtubeVideoId(url)).toBe(id));
});

describe("segmentsFromYouTube", () => {
  it("reads srv3 offsets as milliseconds", () => {
    const segs = segmentsFromYouTube([
      { offset: 1200, text: "hi" },
      { offset: 7_200_000, text: " two hours in " },
    ]);
    expect(segs).toEqual([
      { startSec: 1.2, text: "hi" },
      { startSec: 7200, text: "two hours in" },
    ]);
  });

  it("reads classic offsets as seconds and drops empty lines", () => {
    expect(segmentsFromYouTube([{ offset: 12.5, text: "a" }, { offset: 7200, text: "  " }])).toEqual([
      { startSec: 12.5, text: "a" },
    ]);
  });
});

describe("parseSrt", () => {
  it("parses blocks, multi-line text, CRLF and tags", () => {
    const srt = "1\r\n00:00:07,880 --> 00:00:11,300\r\nWelcome to the\r\n<i>night</i>\r\n\r\n2\r\n01:02:03.5 --> 01:02:05,000\r\nPile two\r\n";
    expect(parseSrt(srt)).toEqual([
      { startSec: 7.88, text: "Welcome to the night" },
      { startSec: 3723.5, text: "Pile two" },
    ]);
  });

  it("strips nested tags that a single pass would reassemble", () => {
    const srt = "1\n00:00:01,000 --> 00:00:02,000\nhi <<b>script>alert(1)<</b>/script> there\n";
    expect(parseSrt(srt)[0].text).not.toMatch(/[<>]/);
  });

  it("handles a real 4-hour Rumble VOD export", () => {
    const srt = readFileSync(
      "scripts/ingest/data/rumble-transcripts/v6wjkx6_07-21-25-Psyche-Awakens-VOD-Messy-Monday-Tarot-Truth-Bombs-Hot-Panel-Energy-and-Cats.srt",
      "utf-8",
    );
    const segs = parseSrt(srt);
    expect(segs.length).toBeGreaterThan(2800);
    expect(segs[0]).toEqual({ startSec: 7.88, text: "Welcome to the night, the cards laid out for show" });
    expect(formatTimestamp(segs[segs.length - 1].startSec)).toBe("4:02:28");
    // 30-second blocks keep a 4-hour stream to a few hundred lines.
    const lines = formatTranscript(segs).split("\n");
    expect(lines.length).toBeLessThan(600);
    expect(lines[0].startsWith("[0:07] Welcome to the night")).toBe(true);
  });
});

describe("formatTranscript", () => {
  it("groups captions into timestamped blocks", () => {
    const out = formatTranscript([
      { startSec: 0, text: "a" },
      { startSec: 10, text: "b" },
      { startSec: 31, text: "c" },
      { startSec: 3700, text: "d" },
    ]);
    expect(out).toBe("[0:00] a b\n[0:31] c\n[1:01:40] d");
  });
});

const draft: KitDraft = {
  chapters: [
    { startSec: 250, title: "Energy of the week " },
    { startSec: 5, title: "Welcome" },
    { startSec: 255, title: "Too close, dropped" },
    { startSec: 99_999, title: "Past the end, clamped" },
  ],
  clips: [
    { startSec: 800, endSec: 860, title: "Tower take", why: "Strong line." },
    { startSec: 900, endSec: 900, title: "Zero length", why: "Dropped." },
    { startSec: 100, endSec: 150, title: "Early", why: "Sorted first." },
  ],
  description: "A reading.\n\n#tarot",
  tags: ["tarot", "pick a pile"],
  hooks: [{ hook: "The Tower isn't punishment.", clipStartSec: 800 }],
};

describe("tidyDraft", () => {
  it("sorts, starts chapters at 0:00, spaces them 10s apart and clamps to the stream", () => {
    const t = tidyDraft(draft, 3600);
    expect(t.chapters).toEqual([
      { startSec: 0, title: "Welcome" },
      { startSec: 250, title: "Energy of the week" },
      { startSec: 3600, title: "Past the end, clamped" },
    ]);
    expect(t.clips.map((c) => c.title)).toEqual(["Early", "Tower take"]);
  });
});

describe("renderDraftMarkdown", () => {
  it("renders pasteable chapters and every section", () => {
    const md = renderDraftMarkdown(tidyDraft(draft, 3600), {
      source: "https://youtu.be/x",
      durationSec: 3600,
      generatedAt: new Date("2026-09-27T00:00:00Z"),
    });
    expect(md).toContain("0:00 Welcome\n4:10 Energy of the week");
    expect(md).toContain("1. **Early** (1:40 → 2:30)");
    expect(md).toContain('- "The Tower isn\'t punishment." (clip at 13:20)');
    expect(md).toContain("Length: 1:00:00 · Drafted 2026-09-27 · REVIEW BEFORE SENDING");
    for (const h of ["## Chapters", "## Clip moments", "## Description", "## Tags", "## Shorts hooks"]) {
      expect(md).toContain(h);
    }
  });
});
