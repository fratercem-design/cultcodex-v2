import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  findUnique: vi.fn(),
  requireAuth: vi.fn(),
  signOut: vi.fn(),
  transaction: vi.fn(),
  del: vi.fn((args) => ({ op: "deleteUser", args })),
  chat: vi.fn((args) => ({ op: "chat", args })),
  prefs: vi.fn((args) => ({ op: "prefs", args })),
  favs: vi.fn((args) => ({ op: "favs", args })),
  subs: vi.fn((args) => ({ op: "subscriber", args })),
}));

vi.mock("@/lib/auth", () => ({
  requireAuth: () => m.requireAuth(),
  signOut: (opts: unknown) => m.signOut(opts),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    codexUser: { findUnique: m.findUnique, delete: m.del },
    chatMessage: { deleteMany: m.chat },
    notificationPreference: { deleteMany: m.prefs },
    favorite: { deleteMany: m.favs },
    subscriber: { deleteMany: m.subs },
    $transaction: m.transaction,
  },
}));

import { deleteOwnAccount } from "../actions";

const base = { id: "u1", email: "Me@Example.com", role: "user", subscriptionId: null, subscriptionStatus: null };

describe("deleteOwnAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_EMAILS;
    m.requireAuth.mockResolvedValue({ id: "u1" });
    m.findUnique.mockResolvedValue(base);
  });

  it("deletes the caller's own rows and signs out when the email matches", async () => {
    expect(await deleteOwnAccount(" me@example.com ")).toEqual({});
    expect(m.transaction).toHaveBeenCalledWith([
      { op: "chat", args: { where: { userId: "u1" } } },
      { op: "prefs", args: { where: { userId: "u1" } } },
      { op: "favs", args: { where: { userId: "u1" } } },
      { op: "subscriber", args: { where: { email: "Me@Example.com" } } },
      { op: "deleteUser", args: { where: { id: "u1" } } },
    ]);
    expect(m.signOut).toHaveBeenCalledWith({ redirectTo: "/?account=deleted" });
  });

  it("refuses a mismatched confirmation email", async () => {
    expect((await deleteOwnAccount("other@example.com")).error).toMatch(/doesn't match/);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("refuses while a Stripe subscription is live, allows once canceled", async () => {
    m.findUnique.mockResolvedValue({ ...base, subscriptionId: "sub_1", subscriptionStatus: "active" });
    expect((await deleteOwnAccount("me@example.com")).error).toMatch(/Cancel your subscription/);
    expect(m.transaction).not.toHaveBeenCalled();

    m.findUnique.mockResolvedValue({ ...base, subscriptionId: "sub_1", subscriptionStatus: "canceled" });
    expect(await deleteOwnAccount("me@example.com")).toEqual({});
    expect(m.transaction).toHaveBeenCalled();
  });

  it("refuses admins", async () => {
    process.env.ADMIN_EMAILS = "me@example.com";
    expect((await deleteOwnAccount("me@example.com")).error).toMatch(/Admin/);
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
