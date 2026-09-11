import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The Oracle handler runs several gates before spending a paying user's
// monthly question. These tests pin the ORDER: the per-user meter must be the
// last thing consumed, so a request rejected by the burst limiter, the global
// daily cap, or input validation never costs an Initiate+ user quota.

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  isSubscribed: vi.fn(),
  hasSystemTier: vi.fn(),
  rateLimit: vi.fn(),
  consumeLlmBudget: vi.fn(),
  consumeMonthlyMeter: vi.fn(),
  oracleCacheGet: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/subscription", () => ({
  isSubscribed: mocks.isSubscribed,
  hasSystemTier: mocks.hasSystemTier,
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
  clientKey: (_req: Request, userId?: string | null) => (userId ? `user:${userId}` : "ip:test"),
}));
vi.mock("@/lib/llm-budget", () => ({
  consumeLlmBudget: mocks.consumeLlmBudget,
  consumeMonthlyMeter: mocks.consumeMonthlyMeter,
}));
vi.mock("@/lib/oracle-cache", () => ({
  oracleCacheKey: (q: string) => `key:${q}`,
  oracleCacheGet: mocks.oracleCacheGet,
  oracleCacheSet: vi.fn(),
}));
// Never reached by these tests, but the module imports them at load time.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/anthropic", () => ({ bedrockModelId: () => "test-model" }));
vi.mock("@/lib/eras", () => ({ getEraById: () => undefined }));
vi.mock("@/lib/free-llm", () => ({ groqChat: vi.fn(), groqConfigured: () => false }));
vi.mock("@anthropic-ai/bedrock-sdk", () => ({ default: class {} }));

import { POST } from "./route";

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/oracle/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ALLOW = { ok: true, remaining: 10, resetAt: 0, retryAfterSec: 0 };
const DENY = { ok: false, remaining: 0, resetAt: 0, retryAfterSec: 30 };

describe("POST /api/oracle/ask — gate order for the Initiate+ monthly meter", () => {
  beforeEach(() => {
    // A subscribed, non-Oracle-tier user: the only caller the meter applies to.
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1", role: "member" });
    mocks.isSubscribed.mockResolvedValue(true);
    mocks.hasSystemTier.mockResolvedValue(false);
    mocks.rateLimit.mockReturnValue(ALLOW);
    mocks.consumeLlmBudget.mockResolvedValue({ ok: true, used: 1, cap: 500 });
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: true, used: 1, cap: 100 });
    // A cache hit is the cheapest way to terminate the happy path without an LLM.
    mocks.oracleCacheGet.mockReturnValue({ answer: "cached answer", citations: [] });
    process.env.AWS_REGION = "us-west-2";
    delete process.env.ELEVENLABS_API_KEY;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not spend the meter when the burst limiter rejects (429)", async () => {
    mocks.rateLimit.mockReturnValue(DENY);

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("does not spend the meter when the global daily cap rejects (503)", async () => {
    mocks.consumeLlmBudget.mockResolvedValue({ ok: false, reason: "daily_cap", used: 501, cap: 500 });

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(503);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("does not spend the meter on an empty question (400)", async () => {
    const res = await POST(request({ question: "   " }));

    expect(res.status).toBe(400);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("does not spend the meter when the Oracle is unconfigured (500)", async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(500);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("spends exactly one meter unit on a request that proceeds", async () => {
    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(200);
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledTimes(1);
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledWith("oracle-u-user_1", 100);
  });

  it("still blocks an Initiate+ user whose month is spent (403)", async () => {
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: false, used: 101, cap: 100 });

    const res = await POST(request({ question: "what is the codex" }));
    const json = (await res.json()) as { ok: boolean; error?: string };

    expect(res.status).toBe(403);
    expect(json.error).toContain("100 Oracle questions");
  });

  it("never meters an Oracle-tier (system) user", async () => {
    mocks.hasSystemTier.mockResolvedValue(true);

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(200);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });
});
