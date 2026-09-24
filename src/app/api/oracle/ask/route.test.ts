import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// The Oracle handler runs several gates before spending a paying user's
// monthly question. These tests pin the ORDER:
//   burst limiter -> validation -> cache lookup -> config -> global daily cap
//   -> per-user monthly meter
// Two properties matter. The cache lookup sits ahead of all charging, so a
// repeat question costs neither global capacity nor member quota. And the
// per-user meter is strictly LAST, so a request rejected by any earlier gate
// (429, 400, 500, 503) never costs an Initiate+ user one of their questions.

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  isSubscribed: vi.fn(),
  hasSystemTier: vi.fn(),
  rateLimit: vi.fn(),
  sharedRateLimit: vi.fn(),
  consumeLlmBudget: vi.fn(),
  consumeMonthlyMeter: vi.fn(),
  refundMonthlyMeter: vi.fn(),
  oracleCacheGet: vi.fn(),
  groqConfigured: vi.fn(),
  groqChat: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/subscription", () => ({
  isSubscribed: mocks.isSubscribed,
  hasSystemTier: mocks.hasSystemTier,
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mocks.rateLimit,
  sharedRateLimit: mocks.sharedRateLimit,
  clientKey: (_req: Request, userId?: string | null) => (userId ? `user:${userId}` : "ip:test"),
}));
vi.mock("@/lib/llm-budget", () => ({
  consumeLlmBudget: mocks.consumeLlmBudget,
  consumeMonthlyMeter: mocks.consumeMonthlyMeter,
  refundMonthlyMeter: mocks.refundMonthlyMeter,
}));
vi.mock("@/lib/oracle-cache", () => ({
  oracleCacheKey: (q: string) => `key:${q}`,
  oracleCacheGet: mocks.oracleCacheGet,
  oracleCacheSet: vi.fn(),
}));
// Never reached by these tests, but the module imports them at load time.
vi.mock("@/lib/db", () => {
  const emptyModel = { findMany: vi.fn().mockResolvedValue([]), findUnique: vi.fn().mockResolvedValue(null) };
  return {
    prisma: {
      quote: emptyModel,
      transcriptSegment: emptyModel,
      episode: emptyModel,
      person: emptyModel,
      loreEntry: emptyModel,
      psychenomiconChapter: emptyModel,
      psychenomiconEntity: emptyModel,
      psychenomiconThread: emptyModel,
    },
  };
});
vi.mock("@/lib/anthropic", () => ({ bedrockModelId: () => "test-model" }));
vi.mock("@/lib/eras", () => ({ getEraById: () => undefined }));
vi.mock("@/lib/free-llm", () => ({
  groqChat: mocks.groqChat,
  groqConfigured: mocks.groqConfigured,
}));
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

describe("POST /api/oracle/ask — gate order", () => {
  beforeEach(() => {
    // A subscribed, non-Oracle-tier user: the only caller the meter applies to.
    mocks.getCurrentUser.mockResolvedValue({ id: "user_1", role: "member" });
    mocks.isSubscribed.mockResolvedValue(true);
    mocks.hasSystemTier.mockResolvedValue(false);
    mocks.rateLimit.mockReturnValue(ALLOW);
    mocks.sharedRateLimit.mockResolvedValue(ALLOW);
    mocks.consumeLlmBudget.mockResolvedValue({ ok: true, used: 1, cap: 500 });
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: true, used: 1, cap: 100, persisted: true });
    mocks.refundMonthlyMeter.mockResolvedValue(undefined);
    mocks.groqConfigured.mockReturnValue(false);
    // Default to a cache MISS so requests reach the gates under test. The
    // cache lookup now runs BEFORE any charging, so a hit short-circuits
    // ahead of both the global cap and the per-user meter.
    mocks.oracleCacheGet.mockReturnValue(null);
    process.env.AWS_REGION = "us-west-2";
    process.env.ORACLE_USE_BEDROCK = "true";
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
    expect(mocks.oracleCacheGet).not.toHaveBeenCalled();
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("rejects an empty question without touching cache or either meter (400)", async () => {
    const res = await POST(request({ question: "   " }));

    expect(res.status).toBe(400);
    expect(mocks.oracleCacheGet).not.toHaveBeenCalled();
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("serves a cached answer without consuming member or provider capacity", async () => {
    mocks.oracleCacheGet.mockReturnValue({
      answer: "The cached archive speaks.",
      citations: [],
    });

    const res = await POST(request({ question: "What pattern repeats?" }));
    const json = (await res.json()) as { answer?: string };

    expect(res.status).toBe(200);
    expect(json.answer).toBe("The cached archive speaks.");
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("does not spend the meter when the Oracle is unconfigured (500)", async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(500);
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("uses Groq without requiring AWS configuration", async () => {
    delete process.env.AWS_REGION;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.ORACLE_USE_BEDROCK;
    mocks.groqConfigured.mockReturnValue(true);
    mocks.groqChat.mockResolvedValue("The archive answers from Groq.");

    const res = await POST(request({ question: "what is the codex" }));
    const json = (await res.json()) as { answer?: string };

    expect(res.status).toBe(200);
    expect(json.answer).toBe("The archive answers from Groq.");
  });

  it("refunds member quota and returns an actionable retry window when providers fail", async () => {
    delete process.env.ORACLE_USE_BEDROCK;
    mocks.groqConfigured.mockReturnValue(true);
    mocks.groqChat.mockRejectedValue(new Error("provider unavailable"));

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(mocks.refundMonthlyMeter).toHaveBeenCalledWith("oracle-u-user_1");
  });

  it("does not refund an allowance increment that failed open", async () => {
    delete process.env.ORACLE_USE_BEDROCK;
    mocks.groqConfigured.mockReturnValue(true);
    mocks.groqChat.mockRejectedValue(new Error("provider unavailable"));
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: true, used: 0, cap: 100, persisted: false });

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(503);
    expect(mocks.refundMonthlyMeter).not.toHaveBeenCalled();
  });

  it("does not spend the meter when the global daily cap rejects (503)", async () => {
    mocks.consumeLlmBudget.mockResolvedValue({ ok: false, reason: "daily_cap", used: 501, cap: 500 });

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(503);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });

  it("charges the meter last — after the cache lookup and the global cap", async () => {
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: false, used: 101, cap: 100, persisted: true });

    const res = await POST(request({ question: "what is the codex" }));
    const json = (await res.json()) as { ok: boolean; error?: string };

    expect(res.status).toBe(403);
    expect(json.error).toContain("100 Oracle questions");
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledTimes(1);
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledWith("oracle-u-user_1", 100);
    expect(mocks.oracleCacheGet.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.consumeLlmBudget.mock.invocationCallOrder[0]
    );
    expect(mocks.consumeLlmBudget.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.consumeMonthlyMeter.mock.invocationCallOrder[0]
    );
  });

  it("never meters an Oracle-tier (system) user", async () => {
    mocks.hasSystemTier.mockResolvedValue(true);
    mocks.oracleCacheGet.mockReturnValue({ answer: "cached answer", citations: [] });

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(200);
    expect(mocks.consumeMonthlyMeter).not.toHaveBeenCalled();
  });
});

describe("POST /api/oracle/ask — free trial and voice", () => {
  beforeEach(() => {
    // Anonymous visitor: the free trial path.
    mocks.getCurrentUser.mockResolvedValue(null);
    mocks.rateLimit.mockReturnValue(ALLOW);
    mocks.sharedRateLimit.mockResolvedValue(ALLOW);
    mocks.consumeLlmBudget.mockResolvedValue({ ok: true, used: 1, cap: 500 });
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: true, used: 1, cap: 3, persisted: true });
    mocks.refundMonthlyMeter.mockResolvedValue(undefined);
    mocks.groqConfigured.mockReturnValue(true);
    mocks.groqChat.mockResolvedValue("An answer.");
    mocks.oracleCacheGet.mockReturnValue(null);
    delete process.env.ORACLE_USE_BEDROCK;
    delete process.env.ELEVENLABS_API_KEY;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("meters the trial server-side, so clearing the cookie doesn't reset it", async () => {
    mocks.consumeMonthlyMeter.mockResolvedValue({ ok: false, used: 4, cap: 3, persisted: true });

    // No oracle_trial cookie: a fresh browser as far as the cookie knows.
    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(403);
    expect(mocks.consumeMonthlyMeter.mock.calls[0][0]).toMatch(/^oracle-trial-ip:[0-9a-f]{32}$/);
    expect(mocks.groqChat).not.toHaveBeenCalled();
  });

  it("charges the trial on cache hits too, since they still cost voice", async () => {
    mocks.oracleCacheGet.mockReturnValue({ answer: "cached", citations: [] });

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(200);
    expect(mocks.consumeMonthlyMeter).toHaveBeenCalledTimes(1);
  });

  it("refunds the trial when no answer is produced", async () => {
    mocks.groqChat.mockRejectedValue(new Error("provider unavailable"));

    const res = await POST(request({ question: "what is the codex" }));

    expect(res.status).toBe(503);
    expect(mocks.refundMonthlyMeter).toHaveBeenCalledWith(mocks.consumeMonthlyMeter.mock.calls[0][0]);
  });

  it("charges the TTS budget on a cache hit and skips voice when it's spent", async () => {
    process.env.ELEVENLABS_API_KEY = "el-test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.oracleCacheGet.mockReturnValue({ answer: "cached", citations: [] });
    mocks.consumeLlmBudget.mockResolvedValue({ ok: false, reason: "daily_cap", used: 501, cap: 500 });

    const res = await POST(request({ question: "what is the codex" }));
    const json = (await res.json()) as { answer?: string; hasVoice?: boolean };

    expect(res.status).toBe(200);
    expect(json.answer).toBe("cached");
    expect(json.hasVoice).toBe(false);
    expect(mocks.consumeLlmBudget).toHaveBeenCalledWith("oracle_tts", 500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
