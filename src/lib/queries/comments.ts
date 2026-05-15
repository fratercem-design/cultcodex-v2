import { prisma } from "@/lib/db";

export interface CommentWithUser {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }[];
}

export async function getCommentsForEpisode(
  episodeId: string,
  options?: { take?: number; skip?: number },
): Promise<{ comments: CommentWithUser[]; totalCount: number }> {
  const { take = 20, skip = 0 } = options ?? {};

  const [comments, totalCount] = await Promise.all([
    prisma.codexComment.findMany({
      where: { episodeId, parentId: null, flagged: false },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: {
          where: { flagged: false },
          include: {
            user: { select: { id: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.codexComment.count({ where: { episodeId, flagged: false } }),
  ]);

  return { comments, totalCount };
}

export async function createComment(data: {
  content: string;
  userId: string;
  episodeId: string;
  parentId?: string;
  flagged?: boolean;
  flaggedReason?: string;
}) {
  if (data.content.length > 2000) throw new Error("Comment too long (max 2000 characters)");
  if (data.content.trim().length === 0) throw new Error("Comment cannot be empty");

  if (data.parentId) {
    const parent = await prisma.codexComment.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });
    if (!parent) throw new Error("Parent comment not found");
    if (parent.parentId) throw new Error("Cannot reply to a reply");
  }

  return prisma.codexComment.create({
    data: {
      content: data.content.trim(),
      userId: data.userId,
      episodeId: data.episodeId,
      parentId: data.parentId ?? null,
      flagged: data.flagged ?? false,
      flaggedReason: data.flaggedReason ?? null,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });
}
