import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// grantPurchasedCredits must credit a wallet exactly once per Stripe session.
// The transaction is exercised against an in-memory ledger so the guard's
// behaviour is what's tested, not Prisma's.

const mocks = vi.hoisted(() => {
  const ledger: Array<{ reason: string; referenceId: string | null; amount: number }> = [];
  const wallets = new Map<string, { id: string; balance: number; totalEarned: number }>();
  const tx = {
    creditTransaction: {
      findFirst: vi.fn(async ({ where }: { where: { reason: string; referenceId: string } }) =>
        ledger.find((r) => r.reason === where.reason && r.referenceId === where.referenceId) ?? null
      ),
      create: vi.fn(async ({ data }: { data: { reason: string; referenceId: string; amount: number } }) => {
        ledger.push({ reason: data.reason, referenceId: data.referenceId, amount: data.amount });
        return data;
      }),
    },
    userWallet: {
      upsert: vi.fn(async ({ where, update, create }: {
        where: { userId: string };
        update: { balance: { increment: number }; totalEarned: { increment: number } };
        create: { userId: string; balance: number; totalEarned: number };
      }) => {
        const w = wallets.get(where.userId);
        if (w) {
          w.balance += update.balance.increment;
          w.totalEarned += update.totalEarned.increment;
          return { id: w.id, balance: w.balance };
        }
        const nw = { id: `w_${where.userId}`, balance: create.balance, totalEarned: create.totalEarned };
        wallets.set(where.userId, nw);
        return { id: nw.id, balance: nw.balance };
      }),
    },
  };
  return { ledger, wallets, tx };
});

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: (fn: (t: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx) },
}));

import { grantPurchasedCredits } from "./credit-purchases";

const input = {
  userId: "user_1",
  bundle: "surge",
  credits: 800,
  stripeSessionId: "cs_test_1",
  amountCents: 699,
};

describe("grantPurchasedCredits", () => {
  beforeEach(() => {
    mocks.ledger.length = 0;
    mocks.wallets.clear();
  });
  afterEach(() => vi.clearAllMocks());

  it("creates the wallet and ledger row on first grant", async () => {
    const r = await grantPurchasedCredits(input);
    expect(r).toEqual({ granted: true, credits: 800, balance: 800 });
    expect(mocks.ledger).toEqual([{ reason: "purchase", referenceId: "cs_test_1", amount: 800 }]);
  });

  it("increments an existing wallet", async () => {
    mocks.wallets.set("user_1", { id: "w_user_1", balance: 50, totalEarned: 50 });
    const r = await grantPurchasedCredits(input);
    expect(r).toEqual({ granted: true, credits: 800, balance: 850 });
    expect(mocks.wallets.get("user_1")).toEqual({ id: "w_user_1", balance: 850, totalEarned: 850 });
  });

  it("is a no-op for the same Stripe session delivered twice", async () => {
    await grantPurchasedCredits(input);
    const second = await grantPurchasedCredits(input);

    expect(second).toEqual({ granted: false, reason: "already_granted" });
    expect(mocks.ledger).toHaveLength(1);
    expect(mocks.wallets.get("user_1")?.balance).toBe(800);
    expect(mocks.tx.userWallet.upsert).toHaveBeenCalledTimes(1);
  });

  it("grants separately for a different session", async () => {
    await grantPurchasedCredits(input);
    const r = await grantPurchasedCredits({ ...input, stripeSessionId: "cs_test_2" });
    expect(r).toEqual({ granted: true, credits: 800, balance: 1600 });
    expect(mocks.ledger).toHaveLength(2);
  });

  it("reports already granted when the unique index rejects a racing insert", async () => {
    // Simulates the concurrent case: the findFirst missed, then the insert hit
    // the partial unique index. The transaction rolls back, so nothing is kept.
    mocks.tx.creditTransaction.create.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
    );
    const r = await grantPurchasedCredits(input);
    expect(r).toEqual({ granted: false, reason: "already_granted" });
  });

  it("rethrows other database errors so the webhook can retry", async () => {
    mocks.tx.creditTransaction.create.mockRejectedValueOnce(new Error("connection reset"));
    await expect(grantPurchasedCredits(input)).rejects.toThrow(/connection reset/);
  });

  it("refuses a non-positive or non-integer credit amount", async () => {
    await expect(grantPurchasedCredits({ ...input, credits: 0 })).rejects.toThrow(/invalid credits/);
    await expect(grantPurchasedCredits({ ...input, credits: 1.5 })).rejects.toThrow(/invalid credits/);
    expect(mocks.ledger).toHaveLength(0);
  });
});
