/**
 * XP & levels. XP accrues from actions (draws, pack opens, evolutions, set
 * completions); level is derived from cumulative XP on a growing curve.
 * awardXp is atomic (Serializable) and recomputes level in the same tx.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export const XP_REWARD = {
  reading_draw: 10,
  pack_open: 15,
  evolution: 50,
  set_complete: 100,
  event_complete: 150,
} as const;
export type XpReason = keyof typeof XP_REWARD;

/** Level from cumulative XP. Each level costs ~35% more than the last. */
export function levelForXp(xp: number): number {
  let level = 1, acc = 0, need = 100;
  while (xp >= acc + need) { acc += need; level++; need = Math.round(need * 1.35); }
  return level;
}

/** Progress within the current level: xp into it and xp the level needs. */
export function levelProgress(xp: number): { level: number; into: number; need: number } {
  let level = 1, acc = 0, need = 100;
  while (xp >= acc + need) { acc += need; level++; need = Math.round(need * 1.35); }
  return { level, into: xp - acc, need };
}

export async function awardXp(
  userId: string, amount: number, reason: XpReason | string, metadata: Record<string, unknown> = {}
): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  return prisma.$transaction(
    async (tx) => {
      const w = await tx.userWallet.upsert({
        where: { userId },
        update: { xp: { increment: amount } },
        create: { userId, xp: amount },
        select: { xp: true, level: true },
      });
      const newLevel = levelForXp(w.xp);
      const leveledUp = newLevel > w.level;
      if (leveledUp) await tx.userWallet.update({ where: { userId }, data: { level: newLevel } });
      await tx.creditTransaction.create({
        data: { userId, amount: 0, reason: `xp:${reason}`, metadata: { currency: "xp", xp: amount, ...metadata } },
      });
      return { xp: w.xp, level: newLevel, leveledUp };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
