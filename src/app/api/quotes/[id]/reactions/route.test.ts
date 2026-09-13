import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// `userReactions` in these payloads is per-user. If the response carries a
// shared-cache directive, a CDN keyed on the URL alone can hand one signed-in
// member's reaction state to the next caller. These tests pin the rule:
// anonymous responses are publicly cacheable, signed-in responses never are.

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUniqueQuote: vi.fn(),
  getQuoteReactionCounts: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({
  prisma: { quote: { findUnique: mocks.findUniqueQuote } },
}));
vi.mock("@/lib/queries/quote-reactions", () => ({
  getQuoteReactionCounts: mocks.getQuoteReactionCounts,
  toggleQuoteReaction: vi.fn(),
}));

const { GET } = await import("./route");

const params = Promise.resolve({ id: "q1" });
const req = () => new NextRequest("https://cultcodex.me/api/quotes/q1/reactions");

describe("GET /api/quotes/[id]/reactions cache policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUniqueQuote.mockResolvedValue({ id: "q1" });
    mocks.getQuoteReactionCounts.mockResolvedValue({
      fire: 3, eye: 0, moon: 0, skull: 0, wildcard: 0, userReactions: [],
    });
  });

  it("allows shared caching only when nobody is signed in", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const res = await GET(req(), { params });
    expect(res.headers.get("cache-control")).toBe(
      "public, s-maxage=10, stale-while-revalidate=30"
    );
  });

  it("never lets a signed-in response enter a shared cache", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "u1" });
    mocks.getQuoteReactionCounts.mockResolvedValue({
      fire: 3, eye: 0, moon: 0, skull: 0, wildcard: 0, userReactions: ["fire"],
    });
    const res = await GET(req(), { params });
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toContain("private");
    expect(cc).not.toContain("public");
    expect(cc).not.toContain("s-maxage");
  });
});
