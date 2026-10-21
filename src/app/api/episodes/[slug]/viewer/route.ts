import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isSubscribed } from "@/lib/subscription";
import { getReactionCounts } from "@/lib/queries/reactions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET — everything on an episode page that depends on who is looking.
 *
 * The episode page itself is cached (ISR) and rendered as a signed-out
 * visitor, so it never contains member-only data. Signed-in viewers fetch
 * this once on load (see components/episodes/episode-viewer). Decode data and
 * the signal/noise map are only returned to Initiate+ members.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true, decodeData: true, _count: { select: { favorites: true } } },
  });
  if (!episode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [isMember, favorite, reactions] = await Promise.all([
    isSubscribed(user.id).catch(() => false),
    prisma.favorite
      .findUnique({ where: { userId_episodeId: { userId: user.id, episodeId: episode.id } } })
      .catch(() => null),
    getReactionCounts(episode.id, user.id).catch(() => null),
  ]);

  const decodeData = isMember ? episode.decodeData : null;
  const signalMap =
    isMember && decodeData
      ? ((decodeData as Record<string, unknown>).signal_noise ?? null)
      : null;

  return NextResponse.json({
    authenticated: true,
    userId: user.id,
    isMember,
    favorited: !!favorite,
    favoriteCount: episode._count.favorites,
    reactions,
    decodeData,
    signalMap,
  });
}
