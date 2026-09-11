import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "./ingest/lib";

/**
 * Import transcript JSON files (produced by asr-transcribe.py) into the DB.
 *
 * Reads scripts/asr-pending.json for the work list. For each ytId with a
 * matching `scripts/scrape/data/transcripts/{ytId}.json`, creates
 * TranscriptSegment rows for the episode. Idempotent: existing segments
 * for the episode are replaced.
 *
 * Usage:
 *   npx tsx scripts/asr-import-segments.ts            # all pending
 *   npx tsx scripts/asr-import-segments.ts --limit 10 # subset
 *   npx tsx scripts/asr-import-segments.ts --dry-run  # preview
 */

type RawSeg = { offset: number; duration: number; text: string };

const TRANSCRIPT_DIR = path.join(__dirname, "scrape", "data", "transcripts");
const PENDING = path.join(__dirname, "asr-pending.json");

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1] ?? "0", 10) : undefined;

  if (!fs.existsSync(PENDING)) {
    console.error(`Missing ${PENDING}. Run asr-export-pending.ts first.`);
    process.exit(1);
  }

  type Pending = { ytId: string; ep: number; slug: string; title: string };
  const pending: Pending[] = JSON.parse(fs.readFileSync(PENDING, "utf-8"));
  const work = limit ? pending.slice(0, limit) : pending;

  const prisma = getPrisma();

  let imported = 0;
  let segmentsTotal = 0;
  let missing = 0;
  let empty = 0;
  let noEpisode = 0;

  for (const item of work) {
    const txPath = path.join(TRANSCRIPT_DIR, `${item.ytId}.json`);
    if (!fs.existsSync(txPath)) {
      missing++;
      continue;
    }

    let segs: RawSeg[] = [];
    try {
      segs = JSON.parse(fs.readFileSync(txPath, "utf-8"));
    } catch (e) {
      console.warn(`  [parse error] ${txPath}: ${(e as Error).message}`);
      continue;
    }
    if (!Array.isArray(segs) || segs.length === 0) {
      empty++;
      continue;
    }

    const episode = await prisma.episode.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });
    if (!episode) {
      console.warn(`  [no episode] slug=${item.slug} yt=${item.ytId}`);
      noEpisode++;
      continue;
    }

    if (dryRun) {
      console.log(`  [dry] EP.${item.ep} ${item.ytId} — ${segs.length} segments`);
      imported++;
      segmentsTotal += segs.length;
      continue;
    }

    await prisma.transcriptSegment.deleteMany({ where: { episodeId: episode.id } });

    const rows = segs
      .map((s) => {
        const startSeconds = Math.max(0, Math.round(s.offset / 1000));
        const endSeconds = Math.max(
          startSeconds,
          Math.round((s.offset + (s.duration ?? 0)) / 1000)
        );
        const text = (s.text ?? "").trim();
        if (!text) return null;
        return {
          episodeId: episode.id,
          startSeconds,
          endSeconds,
          text,
          searchText: text.toLowerCase(),
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length === 0) {
      empty++;
      continue;
    }

    // createMany for speed; falls back to individual creates on adapter issues.
    // Both paths tolerate the natural-key unique index: skipDuplicates on the
    // batch, and P2002 (unique violation) swallowed per row on the fallback,
    // so a repeated Whisper cue or a concurrent writer can't abort the import.
    try {
      await prisma.transcriptSegment.createMany({ data: rows, skipDuplicates: true });
    } catch {
      for (const r of rows) {
        try {
          await prisma.transcriptSegment.create({ data: r });
        } catch (err) {
          if ((err as { code?: string }).code !== "P2002") throw err;
        }
      }
    }

    imported++;
    segmentsTotal += rows.length;
    console.log(`  EP.${item.ep} ${item.ytId} — ${rows.length} segments`);
  }

  console.log(`\n=== DONE${dryRun ? " (dry run)" : ""} ===`);
  console.log(`Episodes imported:  ${imported}`);
  console.log(`Segments imported:  ${segmentsTotal}`);
  console.log(`Transcripts missing: ${missing}`);
  console.log(`Empty transcripts:   ${empty}`);
  console.log(`Episode not found:   ${noEpisode}`);

  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
