import { describe, it, expect } from "vitest";
import { fmtEpisodeCount, EPISODE_COUNT_COPY_FLOOR } from "../stats";

describe("fmtEpisodeCount", () => {
  it("uses the exact live count", () => {
    expect(fmtEpisodeCount(3028)).toBe("3,028");
  });

  it("never renders 0 — the hibernated-DB fallback", () => {
    for (const bad of [0, -1, NaN, Infinity]) {
      expect(fmtEpisodeCount(bad)).toBe(`${EPISODE_COUNT_COPY_FLOOR.toLocaleString()}+`);
    }
  });
});
