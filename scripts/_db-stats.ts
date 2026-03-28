import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
async function main() {
  const p = getPrisma();
  const [total, enriched, topics, lore, quotes, people, series] = await Promise.all([
    p.episode.count(),
    p.episode.count({ where: { summaryLong: { not: null }, NOT: { summaryLong: "" } } }),
    p.topic.count(),
    p.loreEntry.count(),
    p.quote.count(),
    p.person.count(),
    p.series.count(),
  ]);
  console.log(`Episodes: ${total} (${enriched} enriched)`);
  console.log(`Topics: ${topics}`);
  console.log(`Lore: ${lore}`);
  console.log(`Quotes: ${quotes}`);
  console.log(`People: ${people}`);
  console.log(`Series: ${series}`);
  await disconnect();
}
main();
