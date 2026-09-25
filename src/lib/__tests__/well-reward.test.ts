import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => {
  const ledger: string[] = [];
  const prisma = {
    creditTransaction: {
      findFirst: vi.fn(async ({ where }: { where: { userId: string } }) => (ledger.includes(where.userId) ? { id: "t" } : null)),
      create: vi.fn(async ({ data }: { data: { userId: string } }) => { ledger.push(data.userId); return {}; }),
    },
    userWallet: { upsert: vi.fn(async () => ({ id: "w" })) },
    $transaction: vi.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };
  return { prisma };
});
vi.mock("@/lib/db", () => ({ prisma: db.prisma }));

import { claimWellReward, WELL_REWARD } from "@/lib/well-reward";

describe("claimWellReward", () => {
  it("pays once per account", async () => {
    expect(await claimWellReward("u1")).toEqual({ granted: WELL_REWARD, alreadyClaimed: false });
    expect(await claimWellReward("u1")).toEqual({ granted: 0, alreadyClaimed: true });
    expect((await claimWellReward("u2")).granted).toBe(WELL_REWARD);
  });
});
