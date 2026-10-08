import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getCommentsForEpisode: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { episode: { findUnique: mocks.findUnique } },
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/queries/comments", () => ({
  getCommentsForEpisode: mocks.getCommentsForEpisode,
  createComment: vi.fn(),
}));
vi.mock("@/lib/moderation", () => ({ moderateComment: vi.fn() }));
vi.mock("@/lib/sse/event-bus", () => ({ eventBus: { publish: vi.fn() } }));

import { GET } from "./route";

const params = Promise.resolve({ slug: "test-episode" });

describe("GET /api/episodes/[slug]/comments pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findUnique.mockResolvedValue({ id: "episode_1" });
    mocks.getCommentsForEpisode.mockResolvedValue({ comments: [], total: 0 });
  });

  it.each([
    ["?take=invalid&skip=invalid", { take: 20, skip: 0 }],
    ["?take=-5&skip=-10", { take: 20, skip: 0 }],
    ["?take=500&skip=12", { take: 50, skip: 12 }],
    ["?take=20px&skip=1e3", { take: 20, skip: 0 }],
    ["?take=20&skip=999999999", { take: 20, skip: 100_000 }],
  ])("sanitizes %s before querying", async (query, expected) => {
    const req = new NextRequest(`https://cultcodex.me/api/episodes/test-episode/comments${query}`);
    const response = await GET(req, { params });

    expect(response.status).toBe(200);
    expect(mocks.getCommentsForEpisode).toHaveBeenCalledWith("episode_1", expected);
  });
});
