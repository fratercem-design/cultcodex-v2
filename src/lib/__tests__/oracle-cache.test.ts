import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  oracleCacheKey,
  oracleCacheGet,
  oracleCacheSet,
  oracleCacheClear,
  oracleCacheSize,
} from "../oracle-cache";

// audioBase64 is intentionally NOT cached (too large for heap); mock uses only cached fields
const MOCK_ENTRY = {
  answer: "The archive speaks.",
  citations: [{ type: "episode" as const, label: "EP.001", href: "/episodes/ep-001" }],
};

beforeEach(() => {
  oracleCacheClear();
  vi.useRealTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("oracleCacheKey", () => {
  it("produces identical keys for identical inputs", () => {
    const a = oracleCacheKey("What is the pattern?", { sourceEra: "dark-arc" });
    const b = oracleCacheKey("What is the pattern?", { sourceEra: "dark-arc" });
    expect(a).toBe(b);
  });

  it("normalises case and trims whitespace", () => {
    const a = oracleCacheKey("  What Is The Pattern?  ", null);
    const b = oracleCacheKey("what is the pattern?", null);
    expect(a).toBe(b);
  });

  it("differs when question changes", () => {
    const a = oracleCacheKey("question one", null);
    const b = oracleCacheKey("question two", null);
    expect(a).not.toBe(b);
  });

  it("differs when context changes", () => {
    const a = oracleCacheKey("same question", { sourceEra: "dark-arc" });
    const b = oracleCacheKey("same question", { sourceEra: "golden-age" });
    expect(a).not.toBe(b);
  });

  it("treats undefined and null context identically", () => {
    const a = oracleCacheKey("q", undefined);
    const b = oracleCacheKey("q", null);
    expect(a).toBe(b);
  });
});

describe("oracleCacheGet / oracleCacheSet", () => {
  it("returns null on a cold cache", () => {
    const key = oracleCacheKey("cold query", null);
    expect(oracleCacheGet(key)).toBeNull();
  });

  it("returns the cached entry immediately after set", () => {
    const key = oracleCacheKey("warm query", null);
    oracleCacheSet(key, MOCK_ENTRY);
    const result = oracleCacheGet(key);
    expect(result).not.toBeNull();
    expect(result!.answer).toBe("The archive speaks.");
    expect(result!.citations).toHaveLength(1);
  });

  it("returns null after TTL expires", () => {
    vi.useFakeTimers();
    const key = oracleCacheKey("expiring query", null);
    oracleCacheSet(key, MOCK_ENTRY);

    // Advance past 6-hour TTL
    vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);

    expect(oracleCacheGet(key)).toBeNull();
  });

  it("still returns entry just before TTL expires", () => {
    vi.useFakeTimers();
    const key = oracleCacheKey("alive query", null);
    oracleCacheSet(key, MOCK_ENTRY);

    vi.advanceTimersByTime(6 * 60 * 60 * 1000 - 1);

    expect(oracleCacheGet(key)).not.toBeNull();
  });

  it("independent keys don't interfere", () => {
    const k1 = oracleCacheKey("question alpha", null);
    const k2 = oracleCacheKey("question beta", null);
    oracleCacheSet(k1, { ...MOCK_ENTRY, answer: "Alpha answer" });
    oracleCacheSet(k2, { ...MOCK_ENTRY, answer: "Beta answer" });

    expect(oracleCacheGet(k1)!.answer).toBe("Alpha answer");
    expect(oracleCacheGet(k2)!.answer).toBe("Beta answer");
  });

  it("overwrite updates the entry", () => {
    const key = oracleCacheKey("overwrite query", null);
    oracleCacheSet(key, { ...MOCK_ENTRY, answer: "First" });
    oracleCacheSet(key, { ...MOCK_ENTRY, answer: "Second" });
    expect(oracleCacheGet(key)!.answer).toBe("Second");
  });
});

describe("oracleCacheSize", () => {
  it("tracks the number of entries", () => {
    expect(oracleCacheSize()).toBe(0);
    oracleCacheSet(oracleCacheKey("a", null), MOCK_ENTRY);
    expect(oracleCacheSize()).toBe(1);
    oracleCacheSet(oracleCacheKey("b", null), MOCK_ENTRY);
    expect(oracleCacheSize()).toBe(2);
  });
});
