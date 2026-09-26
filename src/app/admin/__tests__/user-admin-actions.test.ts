import { describe, it, expect, vi, beforeEach } from "vitest";

const m = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
  del: vi.fn((args) => ({ op: "deleteUser", args })),
  chat: vi.fn((args) => ({ op: "chat", args })),
  prefs: vi.fn((args) => ({ op: "prefs", args })),
  favs: vi.fn((args) => ({ op: "favs", args })),
}));
const { findUnique, update, requireAdmin } = m;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAdmin: () => requireAdmin() }));
vi.mock("@/lib/notifications", () => ({ notifyNewEpisode: vi.fn(), sendFoundingOracleEmail: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    codexUser: { findUnique: m.findUnique, update: m.update, delete: m.del },
    chatMessage: { deleteMany: m.chat },
    notificationPreference: { deleteMany: m.prefs },
    favorite: { deleteMany: m.favs },
    $transaction: m.transaction,
  },
}));

import { deleteUserAccount, revokeLifetimeAccess } from "../actions";

describe("revokeLifetimeAccess", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    requireAdmin.mockReset().mockResolvedValue({ id: "admin" });
  });

  it("clears everything grantOracleAccess set, and nothing else", async () => {
    findUnique.mockResolvedValue({ subscriptionId: null });
    expect(await revokeLifetimeAccess("u1")).toEqual({});
    expect(update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: {
        isLifetimeMember: false,
        subscriptionStatus: null,
        subscriptionTier: null,
        currentPeriodEnd: null,
        isPublicMember: false,
      },
    });
  });

  it("leaves a Stripe subscriber alone and says why", async () => {
    findUnique.mockResolvedValue({ subscriptionId: "sub_123" });
    const result = await revokeLifetimeAccess("u1");
    expect(result.error).toMatch(/Stripe/);
    expect(update).not.toHaveBeenCalled();
  });

  it("requires an admin", async () => {
    requireAdmin.mockRejectedValue(new Error("Forbidden"));
    await expect(revokeLifetimeAccess("u1")).rejects.toThrow("Forbidden");
    expect(update).not.toHaveBeenCalled();
  });
});

describe("deleteUserAccount", () => {
  const target = { id: "u1", email: "Reader@Example.com", role: "user", subscriptionId: null };

  beforeEach(() => {
    findUnique.mockReset().mockResolvedValue(target);
    m.transaction.mockReset().mockResolvedValue([]);
    requireAdmin.mockReset().mockResolvedValue({ id: "admin" });
    delete process.env.ADMIN_EMAILS;
  });

  it("deletes the blocking rows, then the user, in one transaction", async () => {
    expect(await deleteUserAccount("u1", " reader@example.com ")).toEqual({});
    const ops = m.transaction.mock.calls[0][0].map((o: { op: string }) => o.op);
    expect(ops).toEqual(["chat", "prefs", "favs", "deleteUser"]);
    expect(m.del).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("refuses when the typed email doesn't match", async () => {
    const r = await deleteUserAccount("u1", "someone@else.com");
    expect(r.error).toMatch(/doesn't match/);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("refuses admins, including ADMIN_EMAILS admins with a plain DB role", async () => {
    process.env.ADMIN_EMAILS = "other@x.com, reader@example.com";
    const r = await deleteUserAccount("u1", "reader@example.com");
    expect(r.error).toMatch(/Admins/);
    expect(m.transaction).not.toHaveBeenCalled();
  });

  it("refuses the admin's own account and Stripe subscribers", async () => {
    requireAdmin.mockResolvedValue({ id: "u1" });
    expect((await deleteUserAccount("u1", "reader@example.com")).error).toMatch(/own account/);
    requireAdmin.mockResolvedValue({ id: "admin" });
    findUnique.mockResolvedValue({ ...target, subscriptionId: "sub_1" });
    expect((await deleteUserAccount("u1", "reader@example.com")).error).toMatch(/Stripe/);
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
