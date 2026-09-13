import { afterEach, describe, expect, it, vi } from "vitest";

import { GEMINI_DEFAULT_MODEL, GeminiProvider } from "./gemini";

const API_KEY = "test-gemini-key";

function mockResponse({
  ok = true,
  status = 200,
  body = {
    candidates: [
      {
        content: {
          parts: [{ thought: true, text: "internal" }, { text: "OK" }],
        },
      },
    ],
    usageMetadata: {
      promptTokenCount: 3,
      candidatesTokenCount: 1,
      totalTokenCount: 4,
    },
  },
  errorText = "",
}: {
  ok?: boolean;
  status?: number;
  body?: unknown;
  errorText?: string;
} = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(errorText),
  };
}

describe("GeminiProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports an absent key as unconfigured", async () => {
    const provider = new GeminiProvider("");

    expect(provider.isConfigured()).toBe(false);
    await expect(provider.testConnection()).resolves.toBe(false);
    await expect(
      provider.complete({ messages: [{ role: "user", content: "hello" }] }),
    ).rejects.toThrow("Gemini API key not configured");
  });

  it("tests the stable default model without placing the key in the URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse());
    vi.stubGlobal("fetch", fetchMock);

    const provider = new GeminiProvider(API_KEY);
    await expect(provider.testConnection()).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_DEFAULT_MODEL}:generateContent`,
    );
    expect(url).not.toContain(API_KEY);
    expect(init.headers["x-goog-api-key"]).toBe(API_KEY);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("uses the stable default model and joins visible response parts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiProvider(API_KEY).complete({
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      maxTokens: 16,
      temperature: 0,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain(`/${GEMINI_DEFAULT_MODEL}:generateContent`);
    expect(url).not.toContain(API_KEY);
    expect(init.headers["x-goog-api-key"]).toBe(API_KEY);
    expect(result).toEqual({
      content: "OK",
      usage: {
        promptTokens: 3,
        completionTokens: 1,
        totalTokens: 4,
      },
      model: GEMINI_DEFAULT_MODEL,
      provider: "gemini",
    });
  });

  it("preserves an explicit model override", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse());
    vi.stubGlobal("fetch", fetchMock);

    const result = await new GeminiProvider(API_KEY).complete({
      messages: [{ role: "user", content: "hello" }],
      model: "gemini-custom-model",
    });

    expect(fetchMock.mock.calls[0][0]).toContain(
      "/gemini-custom-model:generateContent",
    );
    expect(result.model).toBe("gemini-custom-model");
  });

  it("redacts the API key from upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse({
          ok: false,
          status: 400,
          errorText: `bad credential ${API_KEY}`,
        }),
      ),
    );

    await expect(
      new GeminiProvider(API_KEY).complete({
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow("bad credential [REDACTED]");
  });

  it("rejects an empty candidate response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(mockResponse({ body: { candidates: [] } })),
    );

    await expect(
      new GeminiProvider(API_KEY).complete({
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow("Gemini API returned no text content");
  });
});
