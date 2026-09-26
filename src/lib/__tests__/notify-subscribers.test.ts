import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({ findMany: vi.fn(), batchSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: class {
    batch = { send: m.batchSend };
    emails = { send: vi.fn() };
  },
}));
vi.mock("web-push", () => ({ default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() } }));
vi.mock("@/lib/db", () => ({ prisma: { subscriber: { findMany: m.findMany, delete: vi.fn() } } }));
vi.mock("@/lib/queries/stats", () => ({ getCounts: vi.fn(), fmtEpisodeCount: vi.fn() }));
vi.mock("@/lib/subscriber-links", () => ({ subscriberLink: (p: string, e: string) => `https://x/${p}?e=${e}` }));

import { notifySubscribers } from "../notifications";

const subs = (n: number, verified: boolean) =>
  Array.from({ length: n }, (_, i) => ({ id: `${verified}${i}`, email: `${verified ? "v" : "u"}${i}@example.com`, verified, pushSubscription: null }));

describe("notifySubscribers", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test";
    m.batchSend.mockReset().mockResolvedValue({ data: {}, error: null });
  });

  it("sends one message per confirmed address, 100 per batch, never a shared to-list", async () => {
    m.findMany.mockResolvedValue([...subs(250, true), ...subs(7, false)]);
    const r = await notifySubscribers("Title", "vid");
    expect(r.emailCount).toBe(250);
    expect(m.batchSend).toHaveBeenCalledTimes(3);
    const messages = m.batchSend.mock.calls.flatMap((c) => c[0]);
    expect(messages).toHaveLength(250);
    for (const msg of messages) {
      expect(typeof msg.to).toBe("string");
      expect(msg.to.startsWith("v")).toBe(true);
      expect(msg.html).toContain(`https://x/unsubscribe?e=${msg.to}`);
      expect(msg.headers["List-Unsubscribe"]).toBe(`<https://x/unsubscribe?e=${msg.to}>`);
    }
  });

  it("counts a failed batch instead of swallowing it", async () => {
    m.findMany.mockResolvedValue(subs(150, true));
    m.batchSend.mockResolvedValueOnce({ data: null, error: { message: "rate limited" } });
    const r = await notifySubscribers("Title", "vid");
    expect(r).toMatchObject({ emailCount: 50, emailFailed: 100 });
  });
});
