import { getPrisma, disconnect } from "./lib";

async function main() {
  const p = getPrisma();
  const total = await p.episode.count();
  const withYt = await p.episode.count({ where: { youtubeVideoId: { not: null } } });
  const latest = await p.episode.findFirst({ orderBy: { episodeNumber: "desc" }, select: { episodeNumber: true, title: true, airDate: true } });
  const oldest = await p.episode.findFirst({ orderBy: { episodeNumber: "asc" }, select: { episodeNumber: true, title: true, airDate: true } });
  console.log(JSON.stringify({ total, withYt, latest, oldest }, null, 2));
  await disconnect();
}

main();
