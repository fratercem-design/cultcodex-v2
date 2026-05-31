import { prisma } from "@/lib/db";
import { getMemberCount } from "@/lib/queries/stats";

export interface WeeklyDigestData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  newEpisodes: Array<{
    id: string;
    title: string;
    slug: string;
    episodeNumber: number | null;
    thumbnailUrl: string | null;
    summaryShort: string | null;
    airDate: Date | null;
  }>;
  newQuotes: Array<{
    id: string;
    text: string;
    speakerName: string | null;
    episodeSlug: string | null;
    episodeTitle: string | null;
  }>;
  newLoreEntries: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
  }>;
  topQuote: {
    id: string;
    text: string;
    speakerName: string | null;
    episodeSlug: string | null;
    reactionCount: number;
  } | null;
  memberCount: number;
}

export async function getWeeklyDigestData(): Promise<WeeklyDigestData> {
  const weekEnd = new Date();
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLabel = weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const [newEpisodes, newQuotes, newLoreEntries, memberCount] = await Promise.all([
    prisma.episode.findMany({
      where: { status: "published", createdAt: { gte: weekStart } },
      select: {
        id: true,
        title: true,
        slug: true,
        episodeNumber: true,
        thumbnailUrl: true,
        summaryShort: true,
        airDate: true,
      },
      orderBy: { airDate: "desc" },
      take: 5,
    }),
    prisma.quote.findMany({
      where: { createdAt: { gte: weekStart } },
      select: {
        id: true,
        text: true,
        speaker: { select: { displayName: true } },
        episode: { select: { slug: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.loreEntry.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { id: true, title: true, slug: true, summary: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    getMemberCount(),
  ]);

  // Top quote by reaction count over past 30 days (wider window = more stable signal)
  const thirtyDaysAgo = new Date(weekEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
  const topReacted = await prisma.quoteReaction.groupBy({
    by: ["quoteId"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { quoteId: true },
    orderBy: { _count: { quoteId: "desc" } },
    take: 1,
  });

  let topQuote: WeeklyDigestData["topQuote"] = null;
  if (topReacted[0]) {
    const q = await prisma.quote.findUnique({
      where: { id: topReacted[0].quoteId },
      select: {
        id: true,
        text: true,
        speaker: { select: { displayName: true } },
        episode: { select: { slug: true } },
      },
    });
    if (q) {
      topQuote = {
        id: q.id,
        text: q.text,
        speakerName: q.speaker?.displayName ?? null,
        episodeSlug: q.episode?.slug ?? null,
        reactionCount: topReacted[0]._count.quoteId,
      };
    }
  }

  return {
    weekStart,
    weekEnd,
    weekLabel,
    newEpisodes,
    newQuotes: newQuotes.map((q) => ({
      id: q.id,
      text: q.text,
      speakerName: q.speaker?.displayName ?? null,
      episodeSlug: q.episode?.slug ?? null,
      episodeTitle: q.episode?.title ?? null,
    })),
    newLoreEntries,
    topQuote,
    memberCount,
  };
}
