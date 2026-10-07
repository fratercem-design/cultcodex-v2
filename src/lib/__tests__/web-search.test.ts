import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { webSearch, webSearchConfigured } from "../web-search";

describe("web-search", () => {
  const original = process.env.TAVILY_API_KEY;
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "tvly-test";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (original === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = original;
  });

  it("reports configuration from the env var", () => {
    expect(webSearchConfigured()).toBe(true);
    delete process.env.TAVILY_API_KEY;
    expect(webSearchConfigured()).toBe(false);
  });

  it("posts the query with a bearer key and maps results", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ title: "T", url: "https://x.test", content: "c".repeat(900) }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const out = await webSearch("hello", 3);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.tavily.com/search");
    expect(init.headers.Authorization).toBe("Bearer tvly-test");
    expect(JSON.parse(init.body)).toMatchObject({ query: "hello", max_results: 3 });
    expect(out).toEqual([{ title: "T", url: "https://x.test", content: "c".repeat(600) }]);
  });

  it("throws without a key and on HTTP errors", async () => {
    delete process.env.TAVILY_API_KEY;
    await expect(webSearch("q")).rejects.toThrow("TAVILY_API_KEY");
    process.env.TAVILY_API_KEY = "tvly-test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(webSearch("q")).rejects.toThrow("HTTP 401");
  });
});
