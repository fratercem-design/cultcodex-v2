// scripts/ingest/import-transcripts.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect } from "./lib";
import { z } from "zod";

const TranscriptSegmentRowSchema = z.object({
  episodeSlug: z.string().min(1),
  startSeconds: z.number().int().min(0),
  endSeconds: z.number().int().min(0),
  text: z.string().min(1),
  speakerLabel: z.string().optional(),
});

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-transcripts.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(TranscriptSegmentRowSchema).parse(raw);
  const prisma = getPrisma();

  // Group segments by episode slug
  const byEpisode = new Map<string, typeof rows>();
  for (const row of rows) {
    const existing = byEpisode.get(row.episodeSlug) || [];
    existing.push(row);
    byEpisode.set(row.episodeSlug, existing);
  }

  let episodesProcessed = 0;
  let segmentsCreated = 0;
  const warnings: string[] = [];

  for (const [slug, segments] of byEpisode) {
    const episode = await prisma.episode.findUnique({
      where: { slug },
    });
    if (!episode) {
      warnings.push(`Episode "${slug}" not found — skipping ${segments.length} segments`);
      continue;
    }

    // Replace this episode's segments atomically. skipDuplicates rides on the
    // (episodeId, startSeconds, endSeconds, text) unique index, so a repeated
    // cue in the input file or a concurrent writer can't double-insert.
    const { count } = await prisma.$transaction(async (tx) => {
      await tx.transcriptSegment.deleteMany({ where: { episodeId: episode.id } });
      return tx.transcriptSegment.createMany({
        data: segments.map((seg) => ({
          episodeId: episode.id,
          startSeconds: seg.startSeconds,
          endSeconds: seg.endSeconds,
          text: seg.text,
          speakerLabel: seg.speakerLabel || null,
          searchText: seg.text.toLowerCase(),
        })),
        skipDuplicates: true,
      });
    });
    segmentsCreated += count;

    episodesProcessed++;
  }

  console.log(`Transcripts: ${segmentsCreated} segments across ${episodesProcessed} episodes`);
  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
