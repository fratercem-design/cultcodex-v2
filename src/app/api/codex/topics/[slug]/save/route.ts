import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET  — returns `{ saved: boolean, count: number }` for the current user.
 *        Safe for signed-out users (always returns `saved: false`).
 *
 * POST — toggles the save. Requires auth. Returns `{ saved, count }`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { id: true, _count: { select: { savedBy: true } } },
  });

  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const saved = user
    ? !!(await prisma.savedTopic.findUnique({
        where: { userId_topicId: { userId: user.id, topicId: topic.id } },
      }))
    : false;

  return NextResponse.json({
    saved,
    count: topic._count.savedBy,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topic = await prisma.topic.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!topic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.savedTopic.findUnique({
    where: { userId_topicId: { userId: user.id, topicId: topic.id } },
  });

  if (existing) {
    await prisma.savedTopic.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedTopic.create({
      data: { userId: user.id, topicId: topic.id },
    });
  }

  const count = await prisma.savedTopic.count({
    where: { topicId: topic.id },
  });

  return NextResponse.json({
    saved: !existing,
    count,
  });
}
