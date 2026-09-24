import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "fs";
import * as path from "path";

vi.mock("../../ingest/lib", () => ({ getPrisma: vi.fn(), disconnect: vi.fn(), slugify: (s: string) => s }));

import { formatDuration, parseCsv, parseIndex, parseRumbleTitle, parseSrt, rumbleIdFromUrl } from "../rumble-transcripts";

const DATA = path.resolve(__dirname, "../../ingest/data/rumble-transcripts");

describe("parseRumbleTitle", () => {
  it("keeps only the episode name and the air date", () => {
    const t = parseRumbleTitle(`08/31/26 Psyche Awakens VOD: "I DECLARE INDEPENDENCE"`);
    expect(t.title).toBe("I DECLARE INDEPENDENCE");
    expect(t.airDate?.toISOString().slice(0, 10)).toBe("2026-08-31");
  });

  it("handles partial quotes, stray apostrophes and inner apostrophes", () => {
    expect(parseRumbleTitle(`09/05/26 Psyche Awakens VOD: "Saturday Night Special" (Partial)`).title).toBe("Saturday Night Special (Partial)");
    expect(parseRumbleTitle(`08/29/26 Psyche Awakens VOD: 'Testing New Microphone!!!"`).title).toBe("Testing New Microphone!!!");
    expect(parseRumbleTitle(`08/26/26 Psyche Awakens VOD: "I'm Back"`).title).toBe("I'm Back");
    expect(parseRumbleTitle(`07/26/26 Psyche Awakens VOD: "Eat Me？ Drink Me？ COME HANG OUT"`).title).toBe("Eat Me? Drink Me? COME HANG OUT");
    expect(parseRumbleTitle(`07/07/26 Psyche Awakens VOD: "7⧸7 Gatweway Horoscopes-- All Signs!"`).title).toBe("7/7 Gatweway Horoscopes-- All Signs!");
    expect(parseRumbleTitle(`07/10/26 Psyche Awakens VOD: "The Disgusting Hypocricies of those in this ＂Community＂..."`).title).toBe("The Disgusting Hypocricies of those in this Community...");
    expect(parseRumbleTitle(`07/20/26 Psyche Awakens VOD: "Breaking News： Brandon"`).title).toBe("Breaking News: Brandon");
  });
});

describe("parsers", () => {
  it("reads quoted CSV fields with escaped quotes and a BOM", () => {
    expect(parseCsv(`﻿a,b\n1,"say ""hi"", ok"\n`)).toEqual([["a", "b"], ["1", 'say "hi", ok']]);
  });

  it("pulls the video id out of a Rumble URL", () => {
    expect(rumbleIdFromUrl("https://rumble.com/v7expgc-083126-psyche-awakens-vod.html")).toBe("v7expgc");
    expect(rumbleIdFromUrl("https://example.com/x")).toBeNull();
  });

  it("turns SRT cues into rounded segments and drops empty or tag-only cues", () => {
    const srt = "1\n00:00:16,050 --> 00:00:21,730\nSIG looks like\nflirty diamond\n\n2\n00:00:22,000 --> 00:00:23,000\n[Music]\n\n3\n01:02:03,600 --> 01:02:05,100\n<i>hello</i>\n";
    expect(parseSrt(srt)).toEqual([
      { startSeconds: 16, endSeconds: 22, text: "SIG looks like flirty diamond" },
      { startSeconds: 3724, endSeconds: 3725, text: "hello" },
    ]);
  });

  it("leaves no markup behind, even from nested or broken tags", () => {
    const srt = "1\n00:00:01,000 --> 00:00:02,000\n<scr<script>ipt>alert(1)</script> hi <b\n";
    expect(parseSrt(srt)[0].text).not.toMatch(/[<>]/);
  });

  it("formats durations the way episodes store them", () => {
    expect(formatDuration(18093)).toBe("5:01:33");
    expect(formatDuration(1301)).toBe("21:41");
    expect(formatDuration(0)).toBeNull();
  });
});

describe("the committed transcript set", () => {
  const rows = parseIndex(readFileSync(path.join(DATA, "index.csv"), "utf8"));

  it("indexes every .srt file, each with a Rumble id and date", () => {
    const files = readdirSync(DATA).filter((f) => f.endsWith(".srt")).sort();
    expect(rows.map((r) => r.filename).sort()).toEqual(files);
    for (const r of rows) {
      expect(rumbleIdFromUrl(r.rumbleUrl), r.filename).toMatch(/^v[a-z0-9]+$/);
      expect(parseRumbleTitle(r.title).airDate, r.filename).not.toBeNull();
    }
  });

  // Some streams are a few minutes long or mostly music, so a single file can
  // be short; a broken parse shows up as a set that stops spanning its videos.
  it("parses every file into a transcript, and most of them span their video", () => {
    let spanning = 0;
    for (const r of rows) {
      const segs = parseSrt(readFileSync(path.join(DATA, r.filename), "utf8"));
      const end = segs[segs.length - 1]?.endSeconds ?? 0;
      expect(segs.length, r.filename).toBeGreaterThan(0);
      if (end > r.durationSeconds * 0.6) spanning++;
    }
    expect(spanning / rows.length).toBeGreaterThan(0.95);
  });
});
