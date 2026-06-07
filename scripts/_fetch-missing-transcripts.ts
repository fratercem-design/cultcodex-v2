import "dotenv/config";
import { fetchTranscript } from "youtube-transcript";
import { getPrisma, disconnect } from "./ingest/lib";

const DELAY_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const prisma = getPrisma();

  // Find episodes that have a YouTube ID but no transcript segments
  const episodes = await prisma.episode.findMany({
    where: {
      youtubeVideoId: { not: null },
      segments: { none: {} },
    },
    select: {
      id: true,
      slug: true,
      episodeNumber: true,
      title: true,
      youtubeVideoId: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  console.log(`Found ${episodes.length} episodes without transcripts.\n`);

  let fetched = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    const label = `EP.${String(ep.episodeNumber ?? "?").padStart(3, "0")} [${ep.youtubeVideoId}] ${ep.title.slice(0, 50)}`;
    process.stdout.write(`[${i + 1}/${episodes.length}] ${label} ... `);

    try {
      const segments = await fetchTranscript(ep.youtubeVideoId!);

      if (segments.length === 0) {
        console.log("no captions");
        failures.push(`${ep.youtubeVideoId} — no captions available`);
        failed++;
      } else {
        // Delete any existing segments (safety) then bulk insert
        await prisma.transcriptSegment.deleteMany({ where: { episodeId: ep.id } });

        await prisma.transcriptSegment.createMany({
          data: segments.map((seg) => ({
            episodeId: ep.id,
            startSeconds: Math.round(seg.offset / 1000),
            endSeconds: Math.round((seg.offset + (seg.duration ?? 0)) / 1000),
            text: seg.text,
            searchText: seg.text.toLowerCase(),
          })),
        });

        console.log(`✓ ${segments.length} segments`);
        fetched++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`✗ ${msg.slice(0, 80)}`);
      failures.push(`${ep.youtubeVideoId} (${ep.title.slice(0, 40)}) — ${msg}`);
      failed++;
    }

    if (i < episodes.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n─────────────────────────────────`);
  console.log(`Fetched:  ${fetched}`);
  console.log(`Failed:   ${failed}`);

  if (failures.length > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  - ${f}`);
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
