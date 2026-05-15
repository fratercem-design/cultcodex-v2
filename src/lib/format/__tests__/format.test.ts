import { describe, it, expect } from "vitest";
import { formatDate, formatRelativeDate } from "../date";
import { formatDuration } from "../duration";
import { truncate, slugify } from "../text";

describe("formatDate", () => {
  it("formats a date", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toContain("2024");
  });

  it("returns placeholder for null", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats duration string", () => {
    expect(formatDuration("2:15:30")).toBe("2h 15m");
  });

  it("handles minutes-only duration", () => {
    expect(formatDuration("45:00")).toBe("45m");
  });

  it("returns placeholder for null", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    const result = truncate("This is a very long piece of text that should be truncated", 20);
    expect(result.length).toBeLessThanOrEqual(23); // 20 + "..."
    expect(result).toContain("...");
  });

  it("does not truncate short text", () => {
    expect(truncate("Short", 20)).toBe("Short");
  });
});

describe("slugify", () => {
  it("creates a URL slug", () => {
    expect(slugify("Hello World! 123")).toBe("hello-world-123");
  });
});
