import { describe, expect, it } from "vitest";
import { toCsv, toMarkdown } from "../export";
import type { Clip } from "../types";

const clip: Clip = {
  rank: 1,
  score: 97,
  start: 177,
  end: 205,
  excerpt: "Right, the sponsor.",
  title: "“A mattress company offered us $5,000, for one read”",
  hook: "We turned down $5,000",
  shortsDescription: 'He said "no".\n\nFull stream on the channel. #shorts',
  tiktokCaption: "=HYPERLINK(evil) Agree?",
  thumbnailText: ["$5,000", "WHAT HAPPENED"],
  hashtags: ["#sponsor", "#shorts"],
  why: ["Specific number ($5,000)", "Story with a payoff"],
};

describe("toCsv", () => {
  const csv = toCsv([clip]);
  const [header] = csv.split("\r\n");

  it("writes a header row with every field", () => {
    expect(header).toBe(
      "rank,score,start,end,title,hook,shorts_description,tiktok_caption,thumbnail_text,hashtags,why,excerpt",
    );
    expect(csv).toContain("1,97,2:57,3:25,");
  });

  it("quotes cells with commas, quotes and newlines", () => {
    expect(csv).toContain('"“A mattress company offered us $5,000, for one read”"');
    expect(csv).toContain('"He said ""no"".\n\nFull stream on the channel. #shorts"');
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csv).toContain("'=HYPERLINK(evil) Agree?");
    expect(csv).not.toMatch(/,=HYPERLINK/);
  });
});

describe("toMarkdown", () => {
  it("lists each clip with its times and copy", () => {
    const md = toMarkdown([clip], { generatedAt: new Date("2026-09-26T12:00:00Z") });
    expect(md).toContain("Generated 2026-09-26. 1 clips.");
    expect(md).toContain("## 1. “A mattress company offered us $5,000, for one read” (2:57–3:25)");
    expect(md).toContain("**Hook (first 2 seconds):** We turned down $5,000");
    expect(md).toContain("**Hashtags:** #sponsor #shorts");
  });
});
