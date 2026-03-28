import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
async function main() {
  const p = getPrisma();
  const nullCount = await p.episode.count({ where: { airDate: null } });
  const total = await p.episode.count();
  console.log(`Null airDate: ${nullCount} / ${total}`);
  await disconnect();
}
main();
