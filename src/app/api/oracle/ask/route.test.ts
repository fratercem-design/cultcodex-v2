import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  isSubscribed: vi.fn(),
  hasSystemTier: vi.fn(),
  rateLimit: vi.fn(),
  consumeLlmBudget: vi.fn(),
  consumeMonthlyMeter: vi.fn(),
  oracleCacheGet: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/anthropic", () => ({
  bedrockModelId: () => "test-model",
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/subscription", () => ({
  isSubscribed: mocks.isSubscribed,
  hasSystemTier: mocks.hasSystemTier,
}));
vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "test-client",
  rateLimit: mocks.rateLimit,
}));
vi.mock("@/lib/llm-budget", () => ({
  consumeLlmBudget: mocks.consumeLlmBudget,
  consumeMonthlyMeter: mocks.consumeMonthlyMeter,
}));
vi.mock("@/lib/oracle-cache", () => ({
  oracleCacheKey: () => "test-cache-key",
  oracleCacheGet: mocks.oracleCacheGet,
  oracleCacheSet: vi.fn(),
}));
vi.mock("@/lib/free-llm", () => ({
  groqChat: vi.fn(),
  groqConfigured: () => false,
}));

import { POST } from "./route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/oracle/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("AWS_REGION", "us-east-1");
  vi.stubEnv("ELEVENLABS_API_KEY", "");
  mocks.getCurrentUser.mockResolvedValue({ id: "user-1", role: "member" });
  mocks.isSubscribed.mockResolvedValue(true);
  mocks.hasSystemTier.mockResolvedValue(false);
  mocks.rateLimit.mockReturnValue({ ok: true });
  mocks.consumeMonthlyMeter.mockResolvedValue({ ok: true, cap: 100 });
  mocks.consumeLlmBudget.mockResolvedValue({ ok: false });
  mocks.oracleCacheGet.mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("Oracle request metering order", () => {
  it("rejects an empty question without touching cache or either meter", async () => {
    const response = await POST(request({ question: "" }));

    expect(response.status).toBe(400);
    expect(mocks.oracleCacheGet).not.toHaveBeenCalled();
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
  });

  it("serves a cached answer without consuming member or provider capacity", async () => {
    mocks.oracleCacheGet.mockReturnValue({
      answer: "The cached archive speaks.",
      citations: [],
    });

    const response = await POST(request({ question: "What pattern repeats?" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.answer).toBe("The cached archive speaks.");
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
  });

  it("reserves member allowance and provider budget after a cache miss", async () => {
    const response = await POST(request({ question: "What pattern repeats?" }));

    expect(response.status).toBe(503);
    expect(mocks.oracleCacheGet).toHaveBeenCalledOnce();
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledOnce();
    expect(mocks.consumeLlmBudget).toHaveBeenCalledOnce();
    expect(mocks.oracleCacheGet.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.consumeMonthlyMeter.mock.invocationCallOrder[0]
    );
    expect(mocks.consumeMonthlyMeter.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.consumeLlmBudget.mock.invocationCallOrder[0]
    );
  });
});
