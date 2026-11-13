import { describe, it, expect } from "vitest";
import { selectBatch } from "../select-batch";

const ep = (n: number, daysAgo: number) => ({
  slug: `ep-${n}`,
  episodeNumber: n,
  airDate: new Date(Date.UTC(2026, 10, 12) - daysAgo * 86_400_000),
});

describe("selectBatch", () => {
  const queue = [ep(1, 400), ep(2, 300), ep(3, 40), ep(4, 2), ep(5, 1)];

  it("takes the newest episodes first", () => {
    expect(selectBatch(queue, 2).map((e) => e.slug)).toEqual(["ep-5", "ep-4"]);
  });

  it("puts undated episodes after dated ones and leaves the input alone", () => {
    const undated = { slug: "ep-9", episodeNumber: 9, airDate: null };
    const input = [undated, ...queue];
    expect(selectBatch(input, 6).at(-1)?.slug).toBe("ep-9");
    expect(input[0]).toBe(undated);
  });

  it("never returns more than the batch size", () => {
    expect(selectBatch(queue, 3)).toHaveLength(3);
  });

  it("returns the whole queue when it is shorter than the batch", () => {
    expect(selectBatch(queue, 50).map((e) => e.slug).sort()).toEqual(queue.map((e) => e.slug).sort());
  });

  it("does not repeat an episode", () => {
    const picked = selectBatch(queue, 4).map((e) => e.slug);
    expect(new Set(picked).size).toBe(picked.length);
  });
});
