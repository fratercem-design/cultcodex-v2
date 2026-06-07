/**
 * getUserRank — server-side gather of a user's activity → computed rank.
 *
 * Counts are run in parallel; any individual failure degrades to 0 so a
 * schema drift never breaks the rank page.
 */
import { prisma } from "@/lib/db";
import {
  computeScore,
  rankProgress,
  scoreBreakdown,
  type RankActivity,
} from "./ranks";

const safeCount = (p: Promise<number>) => p.catch(() => 0);

export async function getUserRank(userId: string, isMember: boolean) {
  const [
    favorites,
    savedTopics,
    savedQuotes,
    savedSearches,
    reactions,
    quoteReactions,
    comments,
    salonPosts,
    decks,
    ownedCards,
    signalProposals,
    annotations,
    user,
  ] = await Promise.all([
    safeCount(prisma.favorite.count({ where: { userId } })),
    safeCount(prisma.savedTopic.count({ where: { userId } })),
    safeCount(prisma.savedQuote.count({ where: { userId } })),
    safeCount(prisma.savedSearch.count({ where: { userId } })),
    safeCount(prisma.episodeReaction.count({ where: { userId } })),
    safeCount(prisma.quoteReaction.count({ where: { userId } })),
    safeCount(prisma.codexComment.count({ where: { userId } })),
    safeCount(prisma.salonPost.count({ where: { userId } })),
    safeCount(prisma.deck.count({ where: { userId } })),
    safeCount(prisma.ownedCard.count({ where: { userId } })),
    safeCount(prisma.signalProposal.count({ where: { userId } })),
    safeCount(prisma.annotation.count({ where: { userId, status: "approved" } })),
    prisma.codexUser
      .findUnique({ where: { id: userId }, select: { createdAt: true } })
      .catch(() => null),
  ]);

  const accountAgeDays = user?.createdAt
    ? Math.max(0, (Date.now() - user.createdAt.getTime()) / 86_400_000)
    : 0;

  const activity: RankActivity = {
    favorites,
    savedTopics,
    savedQuotes,
    savedSearches,
    reactions,
    quoteReactions,
    comments,
    salonPosts,
    decks,
    ownedCards,
    signalProposals,
    annotations,
    accountAgeDays,
    isMember,
  };

  const { total, lines } = scoreBreakdown(activity);

  return {
    activity,
    score: total,
    lines,
    progress: rankProgress(computeScore(activity)),
  };
}
