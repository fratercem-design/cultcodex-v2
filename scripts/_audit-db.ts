import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();

  const byStatus = await p.episode.groupBy({ by: ["status"], _count: true });
  for (const s of byStatus) {
    console.log("status=" + s.status + " count=" + s._count);
  }

  const byType = await p.episode.groupBy({ by: ["contentType"], _count: true });
  for (const t of byType) {
    console.log("type=" + t.contentType + " count=" + t._count);
  }

  const nullDates = await p.episode.count({ where: { airDate: null } });
  const nullDuration = await p.episode.count({ where: { duration: null } });
  console.log("nullDates=" + nullDates + " nullDuration=" + nullDuration);

  const totalPeople = await p.person.count();
  const totalLore = await p.loreEntry.count();
  const totalTopics = await p.topic.count();
  const totalSeries = await p.series.count();
  const totalQuotes = await p.quote.count();
  console.log("people=" + totalPeople + " lore=" + totalLore + " topics=" + totalTopics + " series=" + totalSeries + " quotes=" + totalQuotes);

  // Check for encoding artifacts
  const badChars = await p.episode.count({
    where: {
      OR: [
        { title: { contains: "\uFFFD" } },
        { summaryShort: { contains: "\uFFFD" } },
        { summaryLong: { contains: "\uFFFD" } },
      ],
    },
  });
  console.log("encodingArtifacts=" + badChars);

  // Check series types
  const allSeries = await p.series.findMany({
    select: { title: true, slug: true, type: true, status: true },
  });
  for (const s of allSeries) {
    console.log("series: " + s.type + " | " + s.status + " | " + s.title);
  }

  // Check zero-duration episodes
  const zeroDuration = await p.episode.count({ where: { duration: "0" } });
  const emptyDuration = await p.episode.count({ where: { duration: "" } });
  console.log("zeroDuration=" + zeroDuration + " emptyDuration=" + emptyDuration);

  // Check comments and reactions
  const comments = await p.codexComment.count();
  const reactions = await p.episodeReaction.count();
  console.log("comments=" + comments + " reactions=" + reactions);

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
