import { prisma } from "@/lib/db";

export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  commentCount: number;
  reactionCount: number;
  favoriteCount: number;
}

export interface ActivityItem {
  id: string;
  type: "comment" | "reaction";
  createdAt: Date;
  // Comment fields
  commentContent?: string;
  // Reaction fields
  reactionType?: string;
  // Episode fields
  episodeTitle: string;
  episodeSlug: string;
  episodeNumber: number | null;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: {
          comments: true,
          reactions: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    commentCount: user._count.comments,
    reactionCount: user._count.reactions,
    favoriteCount: user._count.favorites,
  };
}

export async function getUserActivity(
  userId: string,
  take = 50
): Promise<ActivityItem[]> {
  const [comments, reactions] = await Promise.all([
    prisma.codexComment.findMany({
      where: { userId, flagged: false },
      select: {
        id: true,
        content: true,
        createdAt: true,
        episode: {
          select: { title: true, slug: true, episodeNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.episodeReaction.findMany({
      where: { userId },
      include: {
        episode: {
          select: { title: true, slug: true, episodeNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const items: ActivityItem[] = [
    ...comments.map((c) => ({
      id: `comment-${c.id}`,
      type: "comment" as const,
      createdAt: c.createdAt,
      commentContent: c.content,
      episodeTitle: c.episode.title,
      episodeSlug: c.episode.slug,
      episodeNumber: c.episode.episodeNumber,
    })),
    ...reactions.map((r) => ({
      id: `reaction-${r.userId}-${r.episodeId}-${r.reactionType}`,
      type: "reaction" as const,
      createdAt: r.createdAt,
      reactionType: r.reactionType,
      episodeTitle: r.episode.title,
      episodeSlug: r.episode.slug,
      episodeNumber: r.episode.episodeNumber,
    })),
  ];

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items.slice(0, take);
}

export async function getUserComments(userId: string, take = 50) {
  return prisma.codexComment.findMany({
    where: { userId, flagged: false },
    select: {
      id: true,
      content: true,
      createdAt: true,
      episode: {
        select: { title: true, slug: true, episodeNumber: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getUserFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
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
