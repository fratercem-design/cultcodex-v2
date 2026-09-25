import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  consumeLlmBudget: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/llm-budget", () => ({ consumeLlmBudget: mocks.consumeLlmBudget }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
  sharedRateLimit: async () => ({ ok: true, retryAfterSec: 0 }),
  clientKey: (_req: Request, userId?: string | null) => (userId ? `user:${userId}` : "ip:test"),
}));
vi.mock("@/lib/anthropic", () => ({ anthropic: {}, bedrockModelId: () => "m" }));
vi.mock("@/lib/free-llm", () => ({ groqConfigured: () => false, groqChat: vi.fn() }));

import { POST } from "./route";

const card = { title: "The Signal", cardType: "SIGNAL", rarity: "STATIC", abilities: ["risk"] };

function request(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/tarot/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tarot/interpret", () => {
  afterEach(() => vi.clearAllMocks());

  it("rejects anonymous callers before spending the shared budget", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await POST(request({ spreadName: "THE SIGNAL", positions: ["THE SIGNAL"], cards: [card] }));
    expect(res.status).toBe(401);
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
  });

  it("rejects oversized card text before spending the budget", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    const res = await POST(request({
      spreadName: "THE SIGNAL",
      positions: ["THE SIGNAL"],
      cards: [{ ...card, flavourText: "x".repeat(5000) }],
    }));
    expect(res.status).toBe(400);
    expect(mocks.consumeLlmBudget).not.toHaveBeenCalled();
  });
});
