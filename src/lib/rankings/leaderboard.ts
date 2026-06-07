/**
 * getLeaderboard — rank all public members by codex score.
 *
 * Uses one groupBy per activity table (not per-user loops) so it scales
 * to the whole roster in a fixed number of queries. Only public members
 * (opted into the Member Roll, and subscribed/lifetime/admin) appear.
 */
import { prisma } from "@/lib/db";
import { computeScore, rankForScore, type Rank, type RankActivity } from "./ranks";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  memberTitle: string | null;
  codexSlug: string | null;
  hasPage: boolean;
  score: number;
  rank: Rank;
}

type GroupRow = { userId: string; _count: { _all: number } };

const safeGroup = (p: Promise<GroupRow[]>) => p.catch(() => [] as GroupRow[]);
const toMap = (rows: GroupRow[]) => new Map(rows.map((r) => [r.userId, r._count._all]));

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const members = await prisma.codexUser
    .findMany({
      where: {
        isPublicMember: true,
        OR: [
          { role: "admin" },
          { isLifetimeMember: true },
          { subscriptionStatus: "active" },
        ],
      },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        memberTitle: true,
        codexSlug: true,
        codexPagePublic: true,
        subscriptionTier: true,
        isLifetimeMember: true,
        role: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  if (members.length === 0) return [];
  const ids = members.map((m) => m.id);

  // Count rows per user for one table. Cast the arg to bypass per-model
  // groupBy overload typing while preserving the `this` binding (member call).
  const countByUser = (delegate: { groupBy: (a: unknown) => Promise<unknown> }) =>
    safeGroup(
      delegate.groupBy({
        by: ["userId"],
        where: { userId: { in: ids } },
        _count: { _all: true },
      }) as Promise<GroupRow[]>
    );

  const d = prisma as unknown as Record<string, { groupBy: (a: unknown) => Promise<unknown> }>;

  // Approved annotations only (separate where clause).
  const countAnnotations = () =>
    safeGroup(
      d.annotation.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: "approved" },
        _count: { _all: true },
      }) as Promise<GroupRow[]>
    );

  const [fav, st, sq, ss, er, qr, cc, sp, dk, oc, prop, ann] = await Promise.all([
    countByUser(d.favorite),
    countByUser(d.savedTopic),
    countByUser(d.savedQuote),
    countByUser(d.savedSearch),
    countByUser(d.episodeReaction),
    countByUser(d.quoteReaction),
    countByUser(d.codexComment),
    countByUser(d.salonPost),
    countByUser(d.deck),
    countByUser(d.ownedCard),
    countByUser(d.signalProposal),
    countAnnotations(),
  ]);

  const maps = {
    fav: toMap(fav), st: toMap(st), sq: toMap(sq), ss: toMap(ss),
    er: toMap(er), qr: toMap(qr), cc: toMap(cc), sp: toMap(sp),
    dk: toMap(dk), oc: toMap(oc), prop: toMap(prop), ann: toMap(ann),
  };

  const entries: LeaderboardEntry[] = members.map((m) => {
    const activity: RankActivity = {
      favorites: maps.fav.get(m.id) ?? 0,
      savedTopics: maps.st.get(m.id) ?? 0,
      savedQuotes: maps.sq.get(m.id) ?? 0,
      savedSearches: maps.ss.get(m.id) ?? 0,
      reactions: maps.er.get(m.id) ?? 0,
      quoteReactions: maps.qr.get(m.id) ?? 0,
      comments: maps.cc.get(m.id) ?? 0,
      salonPosts: maps.sp.get(m.id) ?? 0,
      decks: maps.dk.get(m.id) ?? 0,
      ownedCards: maps.oc.get(m.id) ?? 0,
      signalProposals: maps.prop.get(m.id) ?? 0,
      annotations: maps.ann.get(m.id) ?? 0,
      accountAgeDays: Math.max(0, (Date.now() - m.createdAt.getTime()) / 86_400_000),
      isMember: true,
    };
    const score = computeScore(activity);
    const isSystem = m.subscriptionTier === "system" || m.role === "admin" || m.isLifetimeMember;
    return {
      userId: m.id,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      memberTitle: m.memberTitle,
      codexSlug: m.codexSlug,
      hasPage: Boolean(isSystem && m.codexSlug && m.codexPagePublic),
      score,
      rank: rankForScore(score),
    };
  });

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
}
