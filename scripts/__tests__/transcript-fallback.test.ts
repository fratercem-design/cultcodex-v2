import { describe, it, expect } from "vitest";
import { classifyYtDlpError } from "../transcript-fallback";

// Messages copied from the 2026-11-12 transcript import run.
describe("classifyYtDlpError", () => {
  it.each([
    ["ERROR: [youtube] ctsWSiSziuQ: Sign in to confirm you’re not a bot. This helps protect our community.", "blocked"],
    ["ERROR: [youtube] JkDExz6qL3o: Sign in to confirm your age. This video may be inappropriate for some users.", "blocked"],
    ["ERROR: [youtube] abc: HTTP Error 429: Too Many Requests", "blocked"],
    ["ERROR: [youtube] p9JQDBlTKxQ: Video unavailable. This video has been removed by the uploader", "gone"],
    ["ERROR: [youtube] Zex7JhLNq6c: This video is unavailable", "gone"],
    ["ERROR: [youtube] abc: Private video. Sign in if you've been granted access to this video", "gone"],
    ["no_vtt_produced", "other"],
  ] as const)("%s → %s", (message, expected) => {
    expect(classifyYtDlpError(message)).toBe(expected);
  });
});
