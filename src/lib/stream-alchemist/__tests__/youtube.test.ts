import { describe, expect, it } from "vitest";
import { parseTranscript } from "../transcript";
import { captionsToTranscript, parseYouTubeId } from "../youtube";

describe("parseYouTubeId", () => {
  const id = "dQw4w9WgXcQ";

  it.each([
    [`https://www.youtube.com/watch?v=${id}`],
    [`https://youtube.com/watch?v=${id}&t=120s&list=PL123`],
    [`https://m.youtube.com/watch?v=${id}`],
    [`https://music.youtube.com/watch?v=${id}`],
    [`https://youtu.be/${id}?si=abc`],
    [`https://www.youtube.com/live/${id}?feature=share`],
    [`https://www.youtube.com/shorts/${id}`],
    [`https://www.youtube.com/embed/${id}`],
    [`https://www.youtube-nocookie.com/embed/${id}`],
    [`youtube.com/watch?v=${id}`],
    [`  ${id}  `],
  ])("reads %s", (input) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each([
    ["https://vimeo.com/123456"],
    ["https://www.youtube.com/@somechannel"],
    ["https://www.youtube.com/watch?v=short"],
    ["https://evil.example/watch?v=dQw4w9WgXcQ"],
    ["not a url at all"],
    [""],
  ])("rejects %s", (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe("captionsToTranscript", () => {
  // Four 3-second cues, then a 5-second silence, then one more.
  const ms = [
    { text: "so here's the thing", offset: 0, duration: 3000 },
    { text: "nobody tells you about", offset: 3000, duration: 3000 },
    { text: "growing a channel", offset: 6000, duration: 3000 },
    { text: "the numbers don't help", offset: 9000, duration: 3000 },
    { text: "anyway next topic", offset: 17000, duration: 3000 },
  ];

  it("groups cues into timestamped lines of about 10 seconds, breaking on silence", () => {
    expect(captionsToTranscript(ms).split("\n")).toEqual([
      "[0:00] so here's the thing nobody tells you about growing a channel",
      "[0:09] the numbers don't help",
      "[0:17] anyway next topic",
    ]);
  });

  it("reads second-based offsets (the classic caption format) the same way", () => {
    const seconds = ms.map((c) => ({ ...c, offset: c.offset / 1000, duration: c.duration / 1000 }));
    expect(captionsToTranscript(seconds)).toBe(captionsToTranscript(ms));
  });

  it("produces text the transcript parser reads as timed", () => {
    const parsed = parseTranscript(captionsToTranscript(ms));
    expect(parsed.hasTimestamps).toBe(true);
    expect(parsed.segments.map((s) => s.start)).toEqual([0, 9, 17]);
  });

  it("formats hour-long offsets and drops empty cues", () => {
    const out = captionsToTranscript([
      { text: "  ", offset: 3_700_000, duration: 2000 },
      { text: "late in the stream", offset: 3_723_000, duration: 2500 },
    ]);
    expect(out).toBe("[1:02:03] late in the stream");
  });
});
