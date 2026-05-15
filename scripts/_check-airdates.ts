import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";
async function main() {
  const p = getPrisma();
  
  // Count null airDate
  const nullCount = await p.episode.count({ where: { airDate: null } });
  const totalCount = await p.episode.count();
  console.log(`Null airDate: ${nullCount} / ${totalCount}`);
  
  // Check if those have youtubeVideoId
  const nullWithYT = await p.episode.count({ where: { airDate: null, youtubeVideoId: { not: null } } });
  const nullNoYT = await p.episode.count({ where: { airDate: null, youtubeVideoId: null } });
  console.log(`  With YouTube ID: ${nullWithYT}`);
  console.log(`  Without YouTube ID: ${nullNoYT}`);
  
  // Sample: first 10 null airDate episodes
  const samples = await p.episode.findMany({
    where: { airDate: null },
    select: { title: true, slug: true, episodeNumber: true, youtubeVideoId: true, createdAt: true },
    orderBy: { episodeNumber: "desc" },
    take: 15,
  });
  console.log("\nSample null-airDate episodes:");
  for (const e of samples) {
    console.log(`  EP ${e.episodeNumber ?? "?"} | YT: ${e.youtubeVideoId ?? "none"} | ${e.title?.slice(0, 60)}`);
  }
  
  // Check how many have episodeNumber
  const nullWithEpNum = await p.episode.count({ where: { airDate: null, episodeNumber: { not: null } } });
  const nullNoEpNum = await p.episode.count({ where: { airDate: null, episodeNumber: null } });
  console.log(`\n  With episodeNumber: ${nullWithEpNum}`);
  console.log(`  Without episodeNumber: ${nullNoEpNum}`);
  
  // Check enrichment coverage
  const enriched = await p.episode.count({ where: { summaryLong: { not: null }, NOT: { summaryLong: "" } } });
  const withTranscript = await p.episode.count({ where: { segments: { some: {} } } });
  const noTranscript = totalCount - withTranscript;
  console.log(`\nEnriched: ${enriched}`);
  console.log(`With transcript: ${withTranscript}`);
  console.log(`No transcript: ${noTranscript}`);
  
  // Check for remaining encoding artifacts
  const badEncoding = await p.episode.count({ where: { title: { contains: "�" } } });
  const badSummary = await p.episode.count({ where: { summaryShort: { contains: "�" } } });
  console.log(`\nBad encoding in titles: ${badEncoding}`);
  console.log(`Bad encoding in summaries: ${badSummary}`);
  
  await disconnect();
}
main();
