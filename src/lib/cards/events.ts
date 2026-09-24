/**
 * Seasonal events — a time-boxed collect goal that grants an exclusive card +
 * badge on completion. Rewards are only claimable inside the active window and
 * exactly once (ledger-guarded).
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { awardXp, XP_REWARD } from "./progression";

export async function getActiveEvent() {
  const now = new Date();
  return prisma.seasonalEvent.findFirst({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    orderBy: { startsAt: "desc" },
  });
}

function goalCardIds(collectGoal: unknown): string[] {
  return Array.isArray(collectGoal) ? collectGoal.filter((x): x is string => typeof x === "string") : [];
}

export async function getEventProgress(userId: string, event: { collectGoal: unknown }) {
  const goal = goalCardIds(event.collectGoal);
  if (goal.length === 0) return { owned: 0, total: 0, complete: false };
  const owned = await prisma.ownedCard.findMany({
    where: { userId, cardId: { in: goal } },
    select: { cardId: true },
    distinct: ["cardId"],
  });
  const ownedCount = new Set(owned.map((o) => o.cardId)).size;
  return { owned: ownedCount, total: goal.length, complete: ownedCount >= goal.length };
}

export async function claimEventReward(userId: string, eventId: string) {
  const res = await prisma.$transaction(
    async (tx) => {
      const now = new Date();
      const event = await tx.seasonalEvent.findUnique({ where: { id: eventId } });
      if (!event) throw new Error("Event not found");
      if (!event.isActive || event.startsAt > now || event.endsAt < now) {
        throw new Error("Event is not active");
      }
      const already = await tx.creditTransaction.count({ where: { userId, reason: `event_claim:${eventId}` } });
      if (already > 0) throw new Error("Reward already claimed");

      const goal = goalCardIds(event.collectGoal);
      if (goal.length > 0) {
        const owned = await tx.ownedCard.findMany({
          where: { userId, cardId: { in: goal } }, select: { cardId: true }, distinct: ["cardId"],
        });
        const ownedCount = new Set(owned.map((o) => o.cardId)).size;
        if (ownedCount < goal.length) throw new Error(`Collect all ${goal.length} cards first (${ownedCount}/${goal.length})`);
      }

      if (event.rewardCardId) {
        await tx.ownedCard.upsert({
          where: { userId_cardId_isFoil: { userId, cardId: event.rewardCardId, isFoil: true } },
          update: { quantity: { increment: 1 }, isNew: true },
          create: { userId, cardId: event.rewardCardId, isFoil: true, obtainedVia: "event" },
        });
      }
      await tx.creditTransaction.create({
        data: { userId, amount: 0, reason: `event_claim:${eventId}`, metadata: { badge: event.badge, rewardCardId: event.rewardCardId } },
      });
      return { ok: true, rewardCardId: event.rewardCardId, badge: event.badge };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
  await awardXp(userId, XP_REWARD.event_complete, "event_complete", { eventId }).catch(() => {});
  return res;
}
