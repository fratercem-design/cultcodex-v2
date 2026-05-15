import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();
  const series = await p.series.findMany({
    select: { title: true, slug: true, type: true, _count: { select: { episodes: true } } },
    orderBy: { episodes: { _count: "desc" } },
    take: 10,
  });
  for (const s of series) console.log(s._count.episodes, s.type.padEnd(15), s.slug.padEnd(35), s.title);
  
  const topics = await p.topic.findMany({
    select: { title: true, slug: true, _count: { select: { episodes: true } } },
    orderBy: { episodes: { _count: "desc" } },
    take: 8,
  });
  console.log("---");
  for (const t of topics) console.log(t._count.episodes, t.slug.padEnd(35), t.title);
  
  await disconnect();
}
main();
