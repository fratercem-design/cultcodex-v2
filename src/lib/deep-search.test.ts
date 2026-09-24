import { afterEach, describe, expect, it, vi } from "vitest";
import { isDeepSearchEnabled } from "./deep-search";

describe("isDeepSearchEnabled", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is off by default", () => {
    vi.stubEnv("DEEP_SEARCH_ENABLED", "");
    expect(isDeepSearchEnabled()).toBe(false);
  });

  it("turns on only for the exact value 1", () => {
    vi.stubEnv("DEEP_SEARCH_ENABLED", "1");
    expect(isDeepSearchEnabled()).toBe(true);
    vi.stubEnv("DEEP_SEARCH_ENABLED", "true");
    expect(isDeepSearchEnabled()).toBe(false);
  });
});
