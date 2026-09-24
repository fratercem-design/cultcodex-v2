import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { getReactionCounts, toggleReaction } from "@/lib/queries/reactions";
import { ReactionType } from "@/generated/prisma/client";
import { eventBus } from "@/lib/sse/event-bus";

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

  // Per-user field in the payload — see the note in the quote reactions route.
  // Only the anonymous response is safe to share across viewers.
  return NextResponse.json(counts, {
    headers: {
      "Cache-Control": user
        ? "private, no-store"
        : "public, s-maxage=10, stale-while-revalidate=30",
    },
  });
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

  // Publish to SSE for real-time updates.
  // Wrapped because PgEventBus.publish is now async and a Postgres
  // hiccup must not break the reaction toggle — the change is already saved.
  try {
    await eventBus.publish(`episode:${slug}`, {
      type: "reaction-update",
      data: counts,
    });
  } catch (err) {
    console.error("[reactions] eventBus.publish failed:", err);
  }

  return NextResponse.json(counts);
}
