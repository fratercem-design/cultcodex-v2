import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await prisma.episode.count({ where: { status: "published" } });

  if (count === 0) {
    return NextResponse.redirect(new URL("/episodes", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  const randomOffset = Math.floor(Math.random() * count);
  const episode = await prisma.episode.findFirst({
    where: { status: "published" },
    skip: randomOffset,
    select: { slug: true },
  });

  if (!episode) {
    return NextResponse.redirect(new URL("/episodes", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  return NextResponse.redirect(new URL(`/episodes/${episode.slug}`, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
}
