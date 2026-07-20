import { getPrisma, disconnect } from "./ingest/lib";

// One-off miner: surface episodes whose summaries smell like drama, as raw
// material for the /drama Drama Files and /articles entries.
async function main() {
  const prisma = getPrisma();
  const KEYWORDS = [
    "drama", "troll", "banned", "ban ", "meltdown", "feud", "argument",
    "fight", "chaos", "raid", "beef", "blocked", "callout", "call out",
    "exposed", "scandal", "controversy", "rage", "chat went",
  ];

  const episodes = await prisma.episode.findMany({
    where: {
      OR: KEYWORDS.map((k) => ({ summaryLong: { contains: k, mode: "insensitive" as const } })),
    },
    select: { slug: true, title: true, airDate: true, summaryLong: true },
    orderBy: { airDate: "desc" },
    take: 25,
  });

  console.log(`CANDIDATES: ${episodes.length}\n`);
  for (const e of episodes) {
    const excerpt = (e.summaryLong ?? "").replace(/\s+/g, " ").slice(0, 400);
    console.log(`--- ${e.slug} | ${e.title} | ${e.airDate?.toISOString().slice(0, 10)}`);
    console.log(excerpt + "\n");
  }

  const existing = await prisma.loreEntry.findMany({
    where: { OR: [{ category: "drama" }, { category: "article" }, { canonStatus: "humorous" }] },
    select: { slug: true, category: true, canonStatus: true },
  });
  console.log("EXISTING fun-layer lore:", JSON.stringify(existing));
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
