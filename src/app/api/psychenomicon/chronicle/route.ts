import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type MajorRow = {
  slug: string;
  chapterNumber: number;
  title: string;
  status: string;
  artImageUrls: unknown;
  episode: { title: string; airDate: Date | null } | null;
};

export async function GET() {
  const user = await getCurrentUser();
  const canRead = user ? await isSubscribed(user.id).catch(() => false) : false;

  if (!canRead) {
    return NextResponse.json({ canRead: false, isAuthenticated: !!user });
  }

  const [chapterCount, entityCount, latest, majors, entities, activeThreads] = await Promise.all([
    prisma.psychenomiconChapter.count().catch(() => 0),
    prisma.psychenomiconEntity.count({ where: { status: { not: "dormant" } } }).catch(() => 0),
    prisma.psychenomiconChapter.findMany({
      orderBy: { episode: { airDate: "desc" } },
      take: 8,
      select: { slug: true, chapterNumber: true, title: true, status: true, isMajorEvent: true, emergingSignals: true, artImageUrls: true, episode: { select: { title: true } } },
    }).catch(() => []),
    prisma.psychenomiconChapter.findMany({
      where: { isMajorEvent: true },
      orderBy: { episode: { airDate: "asc" } },
      select: { slug: true, chapterNumber: true, title: true, status: true, artImageUrls: true, episode: { select: { title: true, airDate: true } } },
    }).catch(() => [] as MajorRow[]),
    prisma.psychenomiconEntity.findMany({
      where: { status: { not: "dormant" } },
      orderBy: { updatedAt: "desc" },
      take: 12,
      select: { slug: true, name: true, primaryArchetype: true, status: true },
    }).catch(() => []),
    prisma.psychenomiconThread.findMany({
      where: { status: { in: ["active", "emerging"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { slug: true, title: true, description: true, status: true },
    }).catch(() => []),
  ]);

  return NextResponse.json({
    canRead: true,
    isAdmin: user?.role === "admin",
    chapterCount,
    entityCount,
    latest,
    majors,
    entities,
    activeThreads,
  });
}