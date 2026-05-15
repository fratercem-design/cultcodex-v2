import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    const where = {
      status: { not: "unavailable" as const },
      OR: [
        { youtubeVideoId: { not: null } },
        { rumbleVideoId: { not: null } },
      ],
    };

    const count = await prisma.episode.count({ where });

    if (count === 0) {
      return NextResponse.redirect(new URL("/episodes", origin));
    }

    const randomOffset = Math.floor(Math.random() * count);
    const episode = await prisma.episode.findFirst({
      where,
      skip: randomOffset,
      select: { slug: true },
    });

    if (!episode) {
      return NextResponse.redirect(new URL("/episodes", origin));
    }

    return NextResponse.redirect(new URL(`/episodes/${episode.slug}`, origin));
  } catch {
    return NextResponse.redirect(new URL("/episodes", origin));
  }
}
