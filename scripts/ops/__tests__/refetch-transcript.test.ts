import { describe, expect, it } from "vitest";
import { durationToSeconds } from "../refetch-transcript";

describe("durationToSeconds", () => {
  it("reads h:mm:ss and m:ss", () => {
    expect(durationToSeconds("4:00:03")).toBe(14_403);
    expect(durationToSeconds("5:43")).toBe(343);
  });

  it("returns null for missing or unparseable durations", () => {
    expect(durationToSeconds(null)).toBeNull();
    expect(durationToSeconds("PT4H")).toBeNull();
  });
});
