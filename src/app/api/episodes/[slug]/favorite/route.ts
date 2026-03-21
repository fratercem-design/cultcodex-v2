import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true, _count: { select: { favorites: true } } },
  });

  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const favorited = user
    ? !!(await prisma.favorite.findUnique({
        where: { userId_episodeId: { userId: user.id, episodeId: episode.id } },
      }))
    : false;

  return NextResponse.json({
    favorited,
    count: episode._count.favorites,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_episodeId: { userId: user.id, episodeId: episode.id } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({
      data: { userId: user.id, episodeId: episode.id },
    });
  }

  const count = await prisma.favorite.count({
    where: { episodeId: episode.id },
  });

  return NextResponse.json({
    favorited: !existing,
    count,
  });
}
