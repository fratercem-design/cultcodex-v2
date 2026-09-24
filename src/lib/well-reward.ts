/**
 * The Stairwell's payout: a one-time Signal Credit grant for reaching the
 * Well. Ledger-guarded like the set bonus: a prior "well_reward"
 * CreditTransaction means it was already paid, and the check + grant share
 * one Serializable transaction so concurrent claims can't both pass.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const WELL_REWARD = 250;

export async function claimWellReward(userId: string): Promise<{ granted: number; alreadyClaimed: boolean }> {
  return prisma.$transaction(async (tx) => {
    const prior = await tx.creditTransaction.findFirst({
      where: { userId, reason: "well_reward" },
      select: { id: true },
    });
    if (prior) return { granted: 0, alreadyClaimed: true };

    const wallet = await tx.userWallet.upsert({
      where: { userId },
      update: { balance: { increment: WELL_REWARD }, totalEarned: { increment: WELL_REWARD } },
      create: { userId, balance: WELL_REWARD, totalEarned: WELL_REWARD },
      select: { id: true },
    });
    await tx.creditTransaction.create({
      data: { userId, walletId: wallet.id, amount: WELL_REWARD, reason: "well_reward" },
    });
    return { granted: WELL_REWARD, alreadyClaimed: false };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
