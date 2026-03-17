import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getReactionCounts, toggleReaction } from "@/lib/queries/reactions";
import { ReactionType } from "@/generated/prisma/client";

const VALID_REACTIONS: Set<string> = new Set(["fire", "eye", "moon", "skull", "wildcard"]);

export async function GET(
  _req: NextRequest,
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

  const user = await getCurrentUser();
  const counts = await getReactionCounts(episode.id, user?.id);

  return NextResponse.json(counts);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
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
  const { type } = body as { type?: string };

  if (!type || !VALID_REACTIONS.has(type)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  await toggleReaction(user.id, episode.id, type as ReactionType);
  const counts = await getReactionCounts(episode.id, user.id);

  return NextResponse.json(counts);
}
