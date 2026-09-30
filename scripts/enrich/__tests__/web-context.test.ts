import { describe, it, expect } from "vitest";
import { formatWebContext } from "../web-context";

describe("formatWebContext", () => {
  it("formats results as bullet lines with title and url", () => {
    const out = formatWebContext([{ title: "Tarot", url: "https://example.com/t", content: "A card deck." }]);
    expect(out).toBe("- Tarot (https://example.com/t): A card deck.");
  });

  it("drops empty results and truncates long content", () => {
    const out = formatWebContext(
      [
        { title: "Empty", url: "https://example.com/e", content: "  " },
        { title: "Long", url: "https://example.com/l", content: "x".repeat(50) },
      ],
      10,
    );
    expect(out).toBe(`- Long (https://example.com/l): ${"x".repeat(10)}`);
  });

  it("returns an empty string for no results", () => {
    expect(formatWebContext([])).toBe("");
  });
});
