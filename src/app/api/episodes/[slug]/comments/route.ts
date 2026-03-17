import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCommentsForEpisode, createComment } from "@/lib/queries/comments";
import { moderateComment } from "@/lib/moderation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const take = Math.min(parseInt(req.nextUrl.searchParams.get("take") ?? "20", 10), 50);
  const skip = parseInt(req.nextUrl.searchParams.get("skip") ?? "0", 10);

  const result = await getCommentsForEpisode(episode.id, { take, skip });
  return NextResponse.json(result);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  }

  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const body = await req.json();
  const { content, parentId } = body as { content?: string; parentId?: string };

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: "Comment too long (max 2000 characters)" }, { status: 400 });
  }

  const moderation = await moderateComment(content);

  try {
    const comment = await createComment({
      content,
      userId: user.id,
      episodeId: episode.id,
      parentId,
      flagged: moderation.flagged,
      flaggedReason: moderation.reason,
    });

    if (moderation.flagged) {
      return NextResponse.json(
        { message: "Your comment is being reviewed by our moderation system.", flagged: true },
        { status: 202 },
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
