import { describe, expect, it } from "vitest";
import { formatTime, parseTranscript } from "../transcript";

describe("parseTranscript", () => {
  it("reads bracketed timestamps and fills each end from the next start", () => {
    const p = parseTranscript("[00:00] Hello there.\n[00:07] Second line here.\n[01:02:03] Much later.");
    expect(p.hasTimestamps).toBe(true);
    expect(p.segments.map((s) => s.start)).toEqual([0, 7, 3723]);
    expect(p.segments[0].end).toBe(7);
    expect(p.segments[1].end).toBe(3723);
    expect(p.segments[2].end).toBeGreaterThan(3723);
  });

  it("reads SRT cues and skips the index lines", () => {
    const srt = "1\n00:00:01,000 --> 00:00:04,500\nFirst cue\nwraps here\n\n2\n00:00:05,000 --> 00:00:08,000\nSecond cue\n";
    const p = parseTranscript(srt);
    expect(p.segments).toEqual([
      { start: 1, end: 4.5, text: "First cue wraps here" },
      { start: 5, end: 8, text: "Second cue" },
    ]);
  });

  it("reads VTT, strips inline tags and merges repeated rolling captions", () => {
    const vtt =
      "WEBVTT\nKind: captions\n\n00:00:01.000 --> 00:00:03.000\n<c>hello world</c>\n\n" +
      "00:00:03.000 --> 00:00:05.000\nhello world\n\n00:00:05.000 --> 00:00:07.000\nnext thing\n";
    const p = parseTranscript(vtt);
    expect(p.segments).toEqual([
      { start: 1, end: 5, text: "hello world" },
      { start: 5, end: 7, text: "next thing" },
    ]);
  });

  it("reads YouTube's copied transcript, where each timestamp sits on its own line", () => {
    const p = parseTranscript("0:00\nwelcome back everyone\n0:04\ntoday we talk money\n1:15\nthe end");
    expect(p.segments.map((s) => [s.start, s.text])).toEqual([
      [0, "welcome back everyone"],
      [4, "today we talk money"],
      [75, "the end"],
    ]);
  });

  it("reads speaker-labelled lines and Otter-style headers", () => {
    const p = parseTranscript("Host (00:12): Opening line.\nGuest [00:20] Reply.\n\nSpeaker 1  0:31\nA paragraph follows.");
    expect(p.segments.map((s) => [s.start, s.text])).toEqual([
      [12, "Opening line."],
      [20, "Reply."],
      [31, "A paragraph follows."],
    ]);
  });

  it("falls back to sentences when there are no timestamps", () => {
    const p = parseTranscript("First sentence here. Second one? Third one!\nAnd a new line.");
    expect(p.hasTimestamps).toBe(false);
    expect(p.segments.map((s) => s.text)).toEqual([
      "First sentence here.",
      "Second one?",
      "Third one!",
      "And a new line.",
    ]);
    expect(p.segments.every((s) => s.start === null && s.end === null)).toBe(true);
  });

  it("splits long timed paragraphs into sentences with interpolated times", () => {
    const para = `${"One two three four five six seven eight nine ten. ".repeat(4).trim()}`;
    const p = parseTranscript(`[00:00] ${para}\n[00:40] Next.`);
    expect(p.segments.length).toBe(5);
    expect(p.segments[1].start).toBe(10);
    expect(p.segments[3].end).toBe(40);
  });
});

describe("formatTime", () => {
  it("formats minutes and hours", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(83)).toBe("1:23");
    expect(formatTime(3723.9)).toBe("1:02:03");
    expect(formatTime(null)).toBe("");
  });
});
