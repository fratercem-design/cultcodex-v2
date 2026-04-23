import { prisma } from "@/lib/db";

/**
 * Server-side helpers for the personal /codex layer.
 *
 * The model:
 *   - Favorite     → saved episodes (pre-existing, unchanged)
 *   - SavedTopic   → saved signals (themes, concepts)
 *   - SavedQuote   → saved moments (a line that landed)
 *
 * All three back the /codex dashboard and per-surface indexes.
 */

/** Top-level dashboard counts for a signed-in user. */
export async function getCodexCounts(userId: string) {
  const [signals, transmissions, quotes] = await Promise.all([
    prisma.savedTopic.count({ where: { userId } }),
    prisma.favorite.count({ where: { userId } }),
    prisma.savedQuote.count({ where: { userId } }),
  ]);
  return { signals, transmissions, quotes };
}

/** Most-recently-saved signals — used for the dashboard strip and the index. */
export async function getSavedSignals(userId: string, limit?: number) {
  return prisma.savedTopic.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      topic: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          _count: {
            select: {
              episodes: true,
              people: true,
              lore: true,
            },
          },
        },
      },
    },
  });
}

/** Most-recently-saved transmissions (episodes). */
export async function getSavedTransmissions(userId: string, limit?: number) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      episode: {
        select: {
          id: true,
          title: true,
          slug: true,
          episodeNumber: true,
          airDate: true,
          summaryShort: true,
          thumbnailUrl: true,
          status: true,
        },
      },
    },
  });
}

/** Most-recently-saved quotes. */
export async function getSavedQuotes(userId: string, limit?: number) {
  return prisma.savedQuote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      quote: {
        select: {
          id: true,
          text: true,
          context: true,
          speaker: {
            select: {
              id: true,
              displayName: true,
              slug: true,
              avatarUrl: true,
            },
          },
          episode: {
            select: {
              id: true,
              title: true,
              slug: true,
              episodeNumber: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Bulk lookup: given a list of topic ids and a user id, return the
 * subset of topic ids the user has saved. Used to stamp `initialSaved`
 * onto topic cards in a page listing without N+1 queries.
 */
export async function getSavedTopicIds(
  userId: string | null,
  topicIds: string[]
): Promise<Set<string>> {
  if (!userId || topicIds.length === 0) return new Set();
  const rows = await prisma.savedTopic.findMany({
    where: { userId, topicId: { in: topicIds } },
    select: { topicId: true },
  });
  return new Set(rows.map((r) => r.topicId));
}

/** Same pattern for quotes. */
export async function getSavedQuoteIds(
  userId: string | null,
  quoteIds: string[]
): Promise<Set<string>> {
  if (!userId || quoteIds.length === 0) return new Set();
  const rows = await prisma.savedQuote.findMany({
    where: { userId, quoteId: { in: quoteIds } },
    select: { quoteId: true },
  });
  return new Set(rows.map((r) => r.quoteId));
}
