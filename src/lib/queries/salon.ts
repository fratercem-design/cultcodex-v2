import { prisma } from "@/lib/db";

/** List Salon threads, pinned first then newest, with post counts. */
export async function getSalonThreads() {
  return prisma.salonThread.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      prompt: true,
      pinned: true,
      closed: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  });
}

/** A single Salon thread with its (unflagged) posts, oldest first. */
export async function getSalonThread(id: string) {
  return prisma.salonThread.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      prompt: true,
      pinned: true,
      closed: true,
      createdAt: true,
      posts: {
        where: { flagged: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, displayName: true, avatarUrl: true, memberTitle: true } },
        },
      },
    },
  });
}

export async function createSalonPost(input: {
  threadId: string;
  userId: string;
  content: string;
  flagged?: boolean;
  flaggedReason?: string | null;
}) {
  return prisma.salonPost.create({
    data: {
      threadId: input.threadId,
      userId: input.userId,
      content: input.content.trim(),
      flagged: input.flagged ?? false,
      flaggedReason: input.flaggedReason ?? null,
    },
    select: {
      id: true,
      content: true,
      createdAt: true,
      flagged: true,
      user: { select: { id: true, displayName: true, avatarUrl: true, memberTitle: true } },
    },
  });
}

export async function createSalonThread(input: {
  title: string;
  prompt: string;
  pinned?: boolean;
}) {
  return prisma.salonThread.create({
    data: {
      title: input.title.trim(),
      prompt: input.prompt.trim(),
      pinned: input.pinned ?? false,
    },
  });
}
