import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

// Behind Fly's proxy the request origin is the container's own
// (https://0.0.0.0:3000), so redirects are built from the public site URL.
export async function GET() {
  const origin = SITE_URL;

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
