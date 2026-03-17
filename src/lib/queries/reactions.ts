import { prisma } from "@/lib/db";
import type { ReactionType } from "@/generated/prisma/client";

export interface ReactionCounts {
  fire: number;
  eye: number;
  moon: number;
  skull: number;
  wildcard: number;
  userReactions: ReactionType[];
}

export async function getReactionCounts(
  episodeId: string,
  userId?: string | null,
): Promise<ReactionCounts> {
  const [counts, userReactions] = await Promise.all([
    prisma.episodeReaction.groupBy({
      by: ["reactionType"],
      where: { episodeId },
      _count: true,
    }),
    userId
      ? prisma.episodeReaction.findMany({
          where: { episodeId, userId },
          select: { reactionType: true },
        })
      : Promise.resolve([]),
  ]);

  const result: ReactionCounts = {
    fire: 0,
    eye: 0,
    moon: 0,
    skull: 0,
    wildcard: 0,
    userReactions: userReactions.map((r) => r.reactionType),
  };

  for (const c of counts) {
    result[c.reactionType] = c._count;
  }

  return result;
}

export async function toggleReaction(
  userId: string,
  episodeId: string,
  reactionType: ReactionType,
): Promise<{ added: boolean }> {
  const existing = await prisma.episodeReaction.findUnique({
    where: {
      userId_episodeId_reactionType: { userId, episodeId, reactionType },
    },
  });

  if (existing) {
    await prisma.episodeReaction.delete({
      where: {
        userId_episodeId_reactionType: { userId, episodeId, reactionType },
      },
    });
    return { added: false };
  }

  await prisma.episodeReaction.create({
    data: { userId, episodeId, reactionType },
  });
  return { added: true };
}
