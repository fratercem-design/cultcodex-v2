import { prisma } from "@/lib/db";

// ── Admin Queries ──

export async function getEngagementOverview() {
  const [totalReactions, totalComments, totalFavorites, activeUsers] =
    await Promise.all([
      prisma.episodeReaction.count(),
      prisma.codexComment.count(),
      prisma.favorite.count(),
      prisma.codexComment
        .findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          select: { userId: true },
          distinct: ["userId"],
        })
        .then((users) => users.length),
    ]);

  return { totalReactions, totalComments, totalFavorites, activeUsers };
}

export async function getDailyActivity(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [comments, reactions] = await Promise.all([
    prisma.codexComment.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.episodeReaction.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  // Build day buckets
  const buckets = new Map<
    string,
    { date: string; reactions: number; comments: number }
  >();
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { date: key, reactions: 0, comments: 0 });
  }

  for (const c of comments) {
    const key = c.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.comments++;
  }

  for (const r of reactions) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.reactions++;
  }

  return Array.from(buckets.values());
}

export async function getTopEpisodesByReactions(limit = 10) {
  const episodes = await prisma.episode.findMany({
    select: {
      title: true,
      slug: true,
      episodeNumber: true,
      _count: { select: { reactions: true } },
    },
    orderBy: { reactions: { _count: "desc" } },
    take: limit,
  });

  return episodes.map((ep) => ({
    title: ep.title,
    slug: ep.slug,
    episodeNumber: ep.episodeNumber,
    count: ep._count.reactions,
  }));
}

export async function getTopEpisodesByComments(limit = 10) {
  const episodes = await prisma.episode.findMany({
    select: {
      title: true,
      slug: true,
      episodeNumber: true,
      _count: { select: { comments: true } },
    },
    orderBy: { comments: { _count: "desc" } },
    take: limit,
  });

  return episodes.map((ep) => ({
    title: ep.title,
    slug: ep.slug,
    episodeNumber: ep.episodeNumber,
    count: ep._count.comments,
  }));
}

export async function getMostActiveUsers(limit = 10) {
  // Get users with most comments
  const users = await prisma.codexUser.findMany({
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
    },
    orderBy: { comments: { _count: "desc" } },
    take: limit * 2, // Get more to sort by combined
  });

  return users
    .map((u) => ({
      id: u.id,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      commentCount: u._count.comments,
      reactionCount: u._count.reactions,
      totalActivity: u._count.comments + u._count.reactions,
    }))
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, limit);
}

// ── Public Stats Queries ──
// NOTE: getArchiveStats() is now canonical in @/lib/queries/stats.ts
// All consumers should import from there. Do NOT recreate here.

export async function getMostQuotedPeople(limit = 10) {
  const people = await prisma.person.findMany({
    select: {
      displayName: true,
      slug: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { quotes: { _count: "desc" } },
    take: limit,
  });

  return people
    .filter((p) => p._count.quotes > 0)
    .map((p) => ({
      displayName: p.displayName,
      slug: p.slug,
      count: p._count.quotes,
    }));
}

export async function getTopTopicsByEpisodes(limit = 15) {
  const topics = await prisma.topic.findMany({
    select: {
      title: true,
      slug: true,
      _count: { select: { episodes: true } },
    },
    orderBy: { episodes: { _count: "desc" } },
    take: limit,
  });

  return topics
    .filter((t) => t._count.episodes > 0)
    .map((t) => ({
      title: t.title,
      slug: t.slug,
      count: t._count.episodes,
    }));
}

export async function getBroadcastCalendar() {
  // Episodes per day since Oct 2024
  const since = new Date("2024-10-01");
  const episodes = await prisma.episode.findMany({
    where: { status: "published", airDate: { gte: since, not: null } },
    select: { airDate: true },
  });
  const counts: Record<string, number> = {};
  for (const ep of episodes) {
    const key = ep.airDate!.toISOString().slice(0, 10);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts; // { "2024-10-05": 3, ... }
}

export async function getTopGuestsByAppearances(limit = 20) {
  const people = await prisma.person.findMany({
    where: { guestAppearances: { some: {} } },
    select: {
      displayName: true,
      slug: true,
      _count: { select: { guestAppearances: true } },
    },
    orderBy: { guestAppearances: { _count: "desc" } },
    take: limit,
  });
  return people.map((p) => ({
    displayName: p.displayName,
    slug: p.slug,
    count: p._count.guestAppearances,
  }));
}

export async function getTopicMonthlyTrend(topN = 6) {
  // Get top N topics
  const topTopics = await prisma.topic.findMany({
    select: { id: true, title: true, slug: true, _count: { select: { episodes: true } } },
    orderBy: { episodes: { _count: "desc" } },
    take: topN,
  });

  // Get episode-topic joins for top topic IDs since Oct 2024
  const topicIds = topTopics.map((t) => t.id);
  const joins = await prisma.episodeTopic.findMany({
    where: {
      topicId: { in: topicIds },
      episode: { status: "published", airDate: { gte: new Date("2024-10-01"), not: null } },
    },
    select: { topicId: true, episode: { select: { airDate: true } } },
  });

  // Build month → topic → count
  const topicIdSet = new Set(topicIds);
  const buckets: Record<string, Record<string, number>> = {};

  for (const join of joins) {
    const airDate = join.episode.airDate;
    if (!airDate) continue;
    const month = airDate.toISOString().slice(0, 7); // "2024-10"
    if (!buckets[month]) buckets[month] = {};
    if (topicIdSet.has(join.topicId)) {
      buckets[month][join.topicId] = (buckets[month][join.topicId] ?? 0) + 1;
    }
  }

  const months = Object.keys(buckets).sort();
  const idToTitle: Record<string, string> = {};
  for (const t of topTopics) idToTitle[t.id] = t.title;

  return {
    months: months.map((m) => {
      const row: Record<string, string | number> = { month: m };
      for (const t of topTopics) row[t.title] = buckets[m]?.[t.id] ?? 0;
      return row;
    }),
    topics: topTopics.map((t) => ({ id: t.id, title: t.title, slug: t.slug })),
  };
}

export async function getCanonBreakdown() {
  const entries = await prisma.loreEntry.groupBy({
    by: ["canonStatus"],
    _count: { id: true },
  });

  const total = entries.reduce((sum, e) => sum + e._count.id, 0);

  return entries.map((e) => ({
    status: e.canonStatus,
    count: e._count.id,
    percentage: total > 0 ? Math.round((e._count.id / total) * 100) : 0,
  }));
}
