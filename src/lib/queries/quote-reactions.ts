import { prisma } from "@/lib/db";
import type { ReactionType } from "@/generated/prisma/client";

export interface QuoteReactionCounts {
  fire: number;
  eye: number;
  moon: number;
  skull: number;
  wildcard: number;
  userReactions: ReactionType[];
}

const EMPTY_COUNTS: Omit<QuoteReactionCounts, "userReactions"> = {
  fire: 0,
  eye: 0,
  moon: 0,
  skull: 0,
  wildcard: 0,
};

export async function getQuoteReactionCounts(
  quoteId: string,
  userId?: string | null
): Promise<QuoteReactionCounts> {
  const [counts, userReactions] = await Promise.all([
    prisma.quoteReaction.groupBy({
      by: ["reactionType"],
      where: { quoteId },
      _count: true,
    }),
    userId
      ? prisma.quoteReaction.findMany({
          where: { quoteId, userId },
          select: { reactionType: true },
        })
      : Promise.resolve([]),
  ]);

  const result: QuoteReactionCounts = {
    ...EMPTY_COUNTS,
    userReactions: userReactions.map((r) => r.reactionType),
  };

  for (const c of counts) {
    result[c.reactionType] = c._count;
  }

  return result;
}

/**
 * Batched fetch — returns a Map keyed by quoteId. Use when rendering
 * lists of quotes so we don't N+1 the DB. Always returns an entry for
 * every requested id, even if counts are zero.
 */
export async function getQuoteReactionCountsBatch(
  quoteIds: string[],
  userId?: string | null
): Promise<Map<string, QuoteReactionCounts>> {
  if (quoteIds.length === 0) return new Map();

  const [counts, userReactions] = await Promise.all([
    prisma.quoteReaction.groupBy({
      by: ["quoteId", "reactionType"],
      where: { quoteId: { in: quoteIds } },
      _count: true,
    }),
    userId
      ? prisma.quoteReaction.findMany({
          where: { quoteId: { in: quoteIds }, userId },
          select: { quoteId: true, reactionType: true },
        })
      : Promise.resolve([]),
  ]);

  const map = new Map<string, QuoteReactionCounts>();
  for (const id of quoteIds) {
    map.set(id, { ...EMPTY_COUNTS, userReactions: [] });
  }

  for (const row of counts) {
    const state = map.get(row.quoteId);
    if (state) state[row.reactionType] = row._count;
  }

  for (const r of userReactions) {
    const state = map.get(r.quoteId);
    if (state) state.userReactions.push(r.reactionType);
  }

  return map;
}

export async function toggleQuoteReaction(
  userId: string,
  quoteId: string,
  reactionType: ReactionType
): Promise<{ added: boolean }> {
  const existing = await prisma.quoteReaction.findUnique({
    where: {
      userId_quoteId_reactionType: { userId, quoteId, reactionType },
    },
  });

  if (existing) {
    await prisma.quoteReaction.delete({
      where: {
        userId_quoteId_reactionType: { userId, quoteId, reactionType },
      },
    });
    return { added: false };
  }

  await prisma.quoteReaction.create({
    data: { userId, quoteId, reactionType },
  });
  return { added: true };
}
