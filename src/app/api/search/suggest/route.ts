import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { NOT_REMOVED_LORE } from "@/lib/lore/removed-lore";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const rl = rateLimit(`suggest:${clientKey(req)}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json([], { status: 429 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json([]);

  const [episodes, people, lore, topics] = await Promise.all([
    prisma.episode.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      take: 3,
    }),
    prisma.person.findMany({
      where: { displayName: { contains: q, mode: "insensitive" } },
      select: { displayName: true, slug: true },
      take: 2,
    }),
    prisma.loreEntry.findMany({
      where: { ...NOT_REMOVED_LORE, title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      take: 2,
    }),
    prisma.topic.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true, slug: true },
      take: 2,
    }),
  ]);

  const suggestions = [
    ...episodes.map((e) => ({ label: e.title, href: `/episodes/${e.slug}`, type: "episode" })),
    ...people.map((p) => ({ label: p.displayName, href: `/people/${p.slug}`, type: "person" })),
    ...lore.map((l) => ({ label: l.title, href: `/lore/${l.slug}`, type: "lore" })),
    ...topics.map((t) => ({ label: t.title, href: `/topics/${t.slug}`, type: "topic" })),
  ].slice(0, 8);

  return NextResponse.json(suggestions);
}
