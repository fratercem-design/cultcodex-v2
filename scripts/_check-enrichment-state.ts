import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Survey what remains to enrich, and what blocks enrichment
 * (no transcript segments => needs ASR first).
 */
async function main() {
  const p = getPrisma();

  const totalEps = await p.episode.count();
  const unenriched = await p.episode.findMany({
    where: { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    select: {
      id: true,
      episodeNumber: true,
      slug: true,
      title: true,
      airDate: true,
      youtubeVideoId: true,
      status: true,
      _count: { select: { segments: true } },
    },
    orderBy: { episodeNumber: "asc" },
  });

  const publishedUnenriched = unenriched.filter((e) => e.status === "published");
  const unavailable = unenriched.filter((e) => e.status === "unavailable");
  const draft = unenriched.filter((e) => e.status === "draft");
  const archived = unenriched.filter((e) => e.status === "archived");

  const withTx = publishedUnenriched.filter((e) => e._count.segments > 0);
  const noTx = publishedUnenriched.filter((e) => e._count.segments === 0);
  const noYt = publishedUnenriched.filter((e) => !e.youtubeVideoId);

  console.log(`Total episodes: ${totalEps}`);
  console.log(`Unenriched (any status): ${unenriched.length}`);
  console.log(`  published: ${publishedUnenriched.length}`);
  console.log(`  draft:     ${draft.length}`);
  console.log(`  archived:  ${archived.length}`);
  console.log(`  unavailable: ${unavailable.length}`);
  console.log();
  console.log(`Of published unenriched (${publishedUnenriched.length}):`);
  console.log(`  with transcript segments: ${withTx.length}`);
  console.log(`  without transcript (need ASR): ${noTx.length}`);
  console.log(`  missing youtubeVideoId: ${noYt.length}`);
  console.log();
  console.log("Published unenriched needing ASR (first 25):");
  for (const e of noTx.slice(0, 25)) {
    console.log(
      `  EP.${e.episodeNumber ?? "?"} ${e.youtubeVideoId ?? "NO-YT"} | ${(e.title ?? "").slice(0, 60)}`
    );
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
