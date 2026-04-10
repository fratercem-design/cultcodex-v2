import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Only pick published episodes with playable video
  const where = {
    status: { not: "unavailable" as const },
    OR: [
      { youtubeVideoId: { not: null } },
      { rumbleVideoId: { not: null } },
    ],
  };

  const count = await prisma.episode.count({ where });

  if (count === 0) {
    return NextResponse.redirect(new URL("/episodes", baseUrl));
  }

  const randomOffset = Math.floor(Math.random() * count);
  const episode = await prisma.episode.findFirst({
    where,
    skip: randomOffset,
    select: { slug: true },
  });

  if (!episode) {
    return NextResponse.redirect(new URL("/episodes", baseUrl));
  }

  return NextResponse.redirect(new URL(`/episodes/${episode.slug}`, baseUrl));
}
