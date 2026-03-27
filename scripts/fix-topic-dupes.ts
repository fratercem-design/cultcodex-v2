import { getPrisma, disconnect } from "./ingest/lib";

// Canonical form: lowercase, trim, singularize common suffixes
function canonical(title: string): string {
  return title.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ies$/, "y")
    .replace(/ings$/, "ing")
    .replace(/s$/, "");
}

async function main() {
  const p = getPrisma();
  const topics = await p.topic.findMany({
    select: { id: true, title: true, slug: true, _count: { select: { episodes: true } } },
  });

  // Group by canonical form
  const groups = new Map<string, typeof topics>();
  for (const t of topics) {
    const key = canonical(t.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  let merged = 0;
  for (const [, items] of groups) {
    if (items.length < 2) continue;

    // Keep the one with most episodes, or the shorter title
    items.sort((a, b) => b._count.episodes - a._count.episodes || a.title.length - b.title.length);
    const keeper = items[0];
    const dupes = items.slice(1);

    for (const dupe of dupes) {
      // Move all episode-topic links from dupe to keeper
      const links = await p.episodeTopic.findMany({
        where: { topicId: dupe.id },
        select: { episodeId: true },
      });

      for (const link of links) {
        // Check if keeper already has this episode
        const existing = await p.episodeTopic.findFirst({
          where: { episodeId: link.episodeId, topicId: keeper.id },
        });
        if (!existing) {
          await p.episodeTopic.updateMany({
            where: { episodeId: link.episodeId, topicId: dupe.id },
            data: { topicId: keeper.id },
          });
        } else {
          await p.episodeTopic.deleteMany({
            where: { episodeId: link.episodeId, topicId: dupe.id },
          });
        }
      }

      // Delete the duplicate topic
      await p.topic.delete({ where: { id: dupe.id } });
      console.log(`  Merged "${dupe.title}" → "${keeper.title}"`);
      merged++;
    }
  }

  console.log(`\nDone: ${merged} duplicate topics merged`);
  const remaining = await p.topic.count();
  console.log(`Topics remaining: ${remaining}`);
  await disconnect();
}
main();
