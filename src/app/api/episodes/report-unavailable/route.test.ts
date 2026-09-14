import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const rateLimit = vi.hoisted(() => vi.fn());
const sharedRateLimit = vi.hoisted(() => vi.fn());
const episodeUpdateMany = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:203.0.113.10",
  rateLimit,
  sharedRateLimit,
}));
vi.mock("@/lib/db", () => ({
  prisma: { episode: { updateMany: episodeUpdateMany } },
}));

import { POST } from "./route";

describe("POST /api/episodes/report-unavailable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.mockReturnValue({ ok: true, retryAfterSec: 0 });
    sharedRateLimit.mockResolvedValue({ ok: true, retryAfterSec: 0 });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("accepts valid telemetry without mutating canonical episode state", async () => {
    const response = await POST(new NextRequest("https://cultcodex.me/api/episodes/report-unavailable", {
      method: "POST",
      body: JSON.stringify({ videoId: "dQw4w9WgXcQ" }),
      headers: { "content-type": "application/json" },
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(episodeUpdateMany).not.toHaveBeenCalled();
  });

  it.each([
    "{}",
    "{not-json",
    JSON.stringify({ videoId: "bad id" }),
    JSON.stringify({ videoId: "x".repeat(1000) }),
  ])("rejects invalid input without mutation", async (body) => {
    const response = await POST(new NextRequest("https://cultcodex.me/api/episodes/report-unavailable", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(400);
    expect(episodeUpdateMany).not.toHaveBeenCalled();
  });

  it("returns Retry-After when the shared limiter denies telemetry", async () => {
    sharedRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 37 });
    const response = await POST(new NextRequest("https://cultcodex.me/api/episodes/report-unavailable", {
      method: "POST",
      body: JSON.stringify({ videoId: "dQw4w9WgXcQ" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("37");
    expect(episodeUpdateMany).not.toHaveBeenCalled();
  });
});
