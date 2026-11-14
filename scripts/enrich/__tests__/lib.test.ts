import { describe, it, expect } from "vitest";
import { buildTranscriptText, buildUserMessage, escapeControlCharsInStrings, parseEnrichmentJson, repairTimestampKeys } from "../lib";

describe("buildTranscriptText", () => {
  it("concatenates segments with timestamps", () => {
    const segments = [
      { offset: 0, duration: 2000, text: "Hello everyone" },
      { offset: 5000, duration: 3000, text: "Welcome to the show" },
    ];
    const result = buildTranscriptText(segments);
    expect(result).toContain("[0:00] Hello everyone");
    expect(result).toContain("[0:05] Welcome to the show");
  });

  it("formats minutes and hours correctly", () => {
    const segments = [
      { offset: 65000, duration: 1000, text: "One minute in" },
      { offset: 3661000, duration: 1000, text: "Over an hour" },
    ];
    const result = buildTranscriptText(segments);
    expect(result).toContain("[1:05] One minute in");
    expect(result).toContain("[1:01:01] Over an hour");
  });

  it("returns empty string for empty segments", () => {
    expect(buildTranscriptText([])).toBe("");
  });
});

describe("buildUserMessage", () => {
  it("includes title, episode number, and description", () => {
    const msg = buildUserMessage({
      title: "The Veil Lifts",
      episodeNumber: 42,
      airDate: "2025-06-15",
      description: "A deep dive into consciousness",
      transcript: "[0:00] Hello everyone",
    });
    expect(msg).toContain("The Veil Lifts");
    expect(msg).toContain("Episode 42");
    expect(msg).toContain("2025-06-15");
    expect(msg).toContain("A deep dive into consciousness");
    expect(msg).toContain("[0:00] Hello everyone");
  });
});

describe("escapeControlCharsInStrings", () => {
  it("leaves valid JSON unchanged", () => {
    const json = '{\n  "a": "line one\\nline two",\n\t"b": [1, 2]\n}';
    expect(escapeControlCharsInStrings(json)).toBe(json);
    expect(JSON.parse(escapeControlCharsInStrings(json))).toEqual({ a: "line one\nline two", b: [1, 2] });
  });

  it("escapes raw control characters inside string literals", () => {
    // A literal tab and newline inside a value: JSON.parse rejects this as-is.
    const bad = '{"summary": "col1\tcol2\nnext", "x": "\u0001"}';
    expect(() => JSON.parse(bad)).toThrow();
    expect(JSON.parse(escapeControlCharsInStrings(bad))).toEqual({
      summary: "col1\tcol2\nnext",
      x: "\u0001",
    });
  });

  it("does not treat an escaped quote as the end of a string", () => {
    const bad = '{"q": "she said \\"hi\\"\tthen left"}';
    expect(JSON.parse(escapeControlCharsInStrings(bad))).toEqual({ q: 'she said "hi"\tthen left' });
  });
});

describe("parseEnrichmentJson", () => {
  it("parses valid JSON", () => {
    expect(parseEnrichmentJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("names the text around the position a parse fails at", () => {
    const bad = '{"quotes":[{"text":"hi","speaker" "Psyche"}]}';
    expect(() => parseEnrichmentJson(bad)).toThrow(/near ".*speaker\\" \\"Psyche/);
  });
});

describe("repairTimestampKeys", () => {
  // Shape copied from the failing EP.2266 output in run 43569908402.
  const broken = '{"quotes":[{\n      "speaker": "Psyche",\n      "timestampSeconds: 1138,\n      "context": "x"\n    }]}';

  it("restores the closing quote the model drops", () => {
    expect(JSON.parse(escapeControlCharsInStrings(repairTimestampKeys(broken)))).toEqual({
      quotes: [{ speaker: "Psyche", timestampSeconds: 1138, context: "x" }],
    });
  });

  it("leaves an escaped quote inside a string value alone", () => {
    const ok = JSON.stringify({ text: 'he said "timestampSeconds: 5" twice', timestampSeconds: 14 });
    expect(repairTimestampKeys(ok)).toBe(ok);
    expect(JSON.parse(repairTimestampKeys(ok))).toEqual(JSON.parse(ok));
  });

  it("repairs a broken key straight after { or ,", () => {
    expect(JSON.parse(repairTimestampKeys('{"timestampSeconds: 3,"a":1}'))).toEqual({ timestampSeconds: 3, a: 1 });
    expect(JSON.parse(repairTimestampKeys('{"a":1,"timestampSeconds: 3}'))).toEqual({ a: 1, timestampSeconds: 3 });
  });

  it("leaves well-formed keys and string values alone", () => {
    const ok = '{"timestampSeconds": 14, "context": "said timestampSeconds: 5 out loud"}';
    expect(repairTimestampKeys(ok)).toBe(ok);
  });
});
