import { describe, expect, it } from "vitest";
import { isRecentStream } from "../recent-stream";

const NOW = new Date("2026-11-14T12:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

describe("isRecentStream", () => {
  it("treats streams from the last week as recent", () => {
    expect(isRecentStream(daysAgo(0.5), 7, NOW)).toBe(true);
    expect(isRecentStream(daysAgo(6.9), 7, NOW)).toBe(true);
  });

  it("treats older streams as not recent", () => {
    expect(isRecentStream(daysAgo(7), 7, NOW)).toBe(false);
    expect(isRecentStream(daysAgo(400), 7, NOW)).toBe(false);
  });

  it("treats future-dated premieres as recent", () => {
    expect(isRecentStream(daysAgo(-1), 7, NOW)).toBe(true);
  });

  it("accepts ISO strings and rejects missing or invalid dates", () => {
    expect(isRecentStream(daysAgo(1).toISOString(), 7, NOW)).toBe(true);
    expect(isRecentStream(null, 7, NOW)).toBe(false);
    expect(isRecentStream(undefined, 7, NOW)).toBe(false);
    expect(isRecentStream("not a date", 7, NOW)).toBe(false);
  });
});
