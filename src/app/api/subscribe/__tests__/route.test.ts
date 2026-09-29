import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const m = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  sendConfirm: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  clientKey: () => "ip:test",
  rateLimit: () => ({ ok: true, retryAfterSec: 0 }),
  sharedRateLimit: async () => ({ ok: true, retryAfterSec: 0 }),
}));
vi.mock("@/lib/db", () => ({
  prisma: { subscriber: { findUnique: m.findUnique, create: m.create, update: m.update } },
}));
vi.mock("@/lib/notifications", () => ({ sendSubscribeConfirmation: m.sendConfirm }));
vi.mock("@/lib/subscriber-links", () => ({ subscriberLink: (p: string, e: string) => `https://x/${p}?e=${e}` }));

import { POST } from "../route";

const post = (body: unknown) =>
  POST(new NextRequest("https://cultcodex.me/api/subscribe", { method: "POST", body: JSON.stringify(body) }));
const push = { endpoint: "https://push.example/abc", keys: {} };

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    for (const f of Object.values(m)) f.mockReset();
    m.sendConfirm.mockResolvedValue(undefined);
  });

  it("saves a new email unconfirmed and sends only a confirmation link", async () => {
    m.findUnique.mockResolvedValue(null);
    const res = await post({ email: "new@example.com" });
    expect(await res.json()).toEqual({ ok: true, confirmationSent: true });
    expect(m.create).toHaveBeenCalledWith({ data: { email: "new@example.com", pushSubscription: undefined, verified: false } });
    expect(m.sendConfirm).toHaveBeenCalledWith("new@example.com", "https://x/confirm?e=new@example.com");
  });

  it("never overwrites an existing row's push endpoint", async () => {
    m.findUnique.mockResolvedValue({ email: "known@example.com", verified: true, lastEmailAt: null });
    await post({ email: "known@example.com", pushSubscription: push });
    expect(m.update).not.toHaveBeenCalled();
    expect(m.create).toHaveBeenCalledWith({ data: { pushSubscription: push, verified: true } });
    expect(m.sendConfirm).not.toHaveBeenCalled();
  });

  it("re-sends a confirmation at most once an hour", async () => {
    m.findUnique.mockResolvedValue({ email: "p@example.com", verified: false, lastEmailAt: new Date() });
    const res = await post({ email: "p@example.com" });
    expect((await res.json()).confirmationSent).toBe(false);
    expect(m.sendConfirm).not.toHaveBeenCalled();
  });

  it("accepts a push-only subscription without email", async () => {
    await post({ pushSubscription: push });
    expect(m.create).toHaveBeenCalledWith({ data: { pushSubscription: push, verified: true } });
    expect(m.sendConfirm).not.toHaveBeenCalled();
  });
});
