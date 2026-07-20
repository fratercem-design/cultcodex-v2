import { getPrisma, disconnect } from "./ingest/lib";

// Seeds the first Drama Files (/drama, category "drama") and Articles
// (/articles, category "article"). Grounded in the archive's own episode
// summaries — nothing invented, everything hedged where it was hedged
// on-stream. Idempotent via upsert on slug.

type Entry = {
  slug: string;
  title: string;
  category: "drama" | "article";
  summary: string;
  fullEntry: string;
  episodeSlug?: string;
};

const ENTRIES: Entry[] = require("./fun-seed-entries.json");

async function main() {
  const prisma = getPrisma();
  for (const e of ENTRIES) {
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
    console.log(`upserted ${e.category}: ${e.slug}${episode ? " (episode linked)" : ""}`);
  }
  const counts = await Promise.all([
    prisma.loreEntry.count({ where: { category: "drama" } }),
    prisma.loreEntry.count({ where: { category: "article" } }),
  ]);
  console.log(`totals — drama: ${counts[0]}, article: ${counts[1]}`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
