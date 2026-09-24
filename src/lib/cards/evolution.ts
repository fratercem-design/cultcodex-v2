/**
 * Card evolution — consume duplicates + Signal Credits to advance a card through
 * Base → Foil → Illuminated → Ascended (OwnedCard.evolutionStage 0→3). Atomic
 * (Serializable), ledgered, awards XP. This is what finally makes duplicates useful.
 */
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { awardXp, XP_REWARD } from "./progression";

export const STAGE_LABEL = ["Base", "Foil", "Illuminated", "Ascended"] as const;
export const MAX_STAGE = 3;

// Requirement to reach the NEXT stage from the current one (index = current stage).
export const EVOLUTION_REQ: { duplicates: number; credits: number }[] = [
  { duplicates: 2, credits: 50 },   // Base → Foil
  { duplicates: 3, credits: 200 },  // Foil → Illuminated
  { duplicates: 4, credits: 500 },  // Illuminated → Ascended
];

export interface EvolveResult {
  cardId: string;
  fromStage: number;
  toStage: number;
  stageLabel: string;
  duplicatesSpent: number;
  creditsSpent: number;
  xp: number;
  level: number;
}

export async function evolveCard(userId: string, cardId: string): Promise<EvolveResult> {
  const result = await prisma.$transaction(
    async (tx) => {
      const owned = await tx.ownedCard.findUnique({
        where: { userId_cardId_isFoil: { userId, cardId, isFoil: false } },
        select: { id: true, quantity: true, evolutionStage: true },
      });
      if (!owned) throw new Error("You do not own this card");
      if (owned.evolutionStage >= MAX_STAGE) throw new Error("Card is already fully ascended");

      const req = EVOLUTION_REQ[owned.evolutionStage];
      // Need `duplicates` extra copies on top of the one being evolved.
      if (owned.quantity < req.duplicates + 1) {
        throw new Error(`Need ${req.duplicates} duplicate(s) — you have ${owned.quantity - 1}`);
      }

      const wallet = await tx.userWallet.findUnique({ where: { userId }, select: { balance: true } });
      if ((wallet?.balance ?? 0) < req.credits) {
        throw new Error(`Insufficient Signal Credits (need ${req.credits}, have ${wallet?.balance ?? 0})`);
      }

      const toStage = owned.evolutionStage + 1;
      await tx.ownedCard.update({
        where: { id: owned.id },
        data: { quantity: { decrement: req.duplicates }, evolutionStage: toStage, isFoil: toStage >= 1 },
      });
      await tx.userWallet.update({
        where: { userId },
        data: { balance: { decrement: req.credits }, totalSpent: { increment: req.credits } },
      });
      await tx.creditTransaction.create({
        data: { userId, amount: -req.credits, reason: "evolution", metadata: { cardId, toStage } },
      });

      return {
        cardId, fromStage: owned.evolutionStage, toStage, stageLabel: STAGE_LABEL[toStage],
        duplicatesSpent: req.duplicates, creditsSpent: req.credits,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  const prog = await awardXp(userId, XP_REWARD.evolution, "evolution", { cardId, toStage: result.toStage }).catch(() => null);
  return { ...result, xp: prog?.xp ?? 0, level: prog?.level ?? 1 };
}
