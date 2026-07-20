import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import entries from "@/lib/data/fun-seed-entries.json";

export const dynamic = "force-dynamic";

// TEMPORARY one-shot seeder for the Drama Files (/drama) and Articles
// (/articles). Guarded by SEED_FUN_TOKEN (set only in Vercel env). Idempotent
// upserts keyed on slug. Delete this route + the env var after it has run.
export async function POST(req: NextRequest) {
  const token = process.env.SEED_FUN_TOKEN;
  const auth = req.headers.get("authorization") ?? "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: string[] = [];
  for (const e of entries as Array<{
    slug: string; title: string; category: string; summary: string;
    fullEntry: string; episodeSlug?: string;
  }>) {
    const episode = e.episodeSlug
      ? await prisma.episode.findUnique({ where: { slug: e.episodeSlug }, select: { id: true } })
      : null;
    const data = {
      title: e.title,
      category: e.category,
      summary: e.summary,
      fullEntry: e.fullEntry,
      canonStatus: "humorous" as const,
      searchText: `${e.title} ${e.summary}`,
      firstMentionEpisodeId: episode?.id ?? null,
    };
    await prisma.loreEntry.upsert({
      where: { slug: e.slug },
      create: { slug: e.slug, ...data },
      update: data,
    });
    results.push(`${e.category}:${e.slug}${episode ? " (linked)" : ""}`);
  }

  const [drama, article] = await Promise.all([
    prisma.loreEntry.count({ where: { category: "drama" } }),
    prisma.loreEntry.count({ where: { category: "article" } }),
  ]);
  return NextResponse.json({ seeded: results, totals: { drama, article } });
}
