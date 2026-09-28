/**
 * Re-fetches the full captions for one episode whose stored transcript stops
 * partway through (flagged "ends early" by ops/squashed-transcripts.ts).
 *
 * REPORT by default: fetches the captions and compares them with what's
 * stored, but changes nothing.
 *
 *   npx tsx scripts/ops/refetch-transcript.ts            # report
 *   npx tsx scripts/ops/refetch-transcript.ts --apply    # replace the transcript
 *
 * From GitHub Actions (Run DB Script workflow), which cannot pass flags:
 *   script = ops/refetch-transcript.ts         → report
 *   script = ops/refetch-transcript-apply.ts   → apply
 *
 * The episode is set by SLUG below; change it in a PR to target another.
 * YouTube is tried first. When that fails or also stops early, Supadata is
 * tried if SUPADATA_API_KEY is set, and whichever reaches further wins.
 * Apply refuses captions that don't end later than the stored transcript or
 * that look squashed, then replaces segments and re-links quotes exactly as
 * the squashed-transcripts repair does. Re-run the admin embed job afterwards.
 */
import { getPrisma, disconnect } from "../ingest/lib";
import { captionsToMs } from "@/lib/transcript/caption-units";
import { fetchFromSupadata, fetchFromYouTube } from "@/lib/stream-alchemist/youtube-fetch";
import type { CaptionChunk } from "@/lib/stream-alchemist/youtube";
import { fmt, looksSquashed, replaceTranscript, toSegments, type NewSegment } from "./squashed-transcripts";

const SLUG = "like-i-fing-care-youll-all-be-doing-it-tomorrow";
/** Captions reaching this share of the runtime count as complete. */
const COMPLETE = 0.8;
/** Supadata runs long videos as an async job; leave room inside the workflow's 30-minute timeout. */
const SUPADATA_DEADLINE_MS = 15 * 60_000;

/** "4:00:03" or "5:43" → seconds; null when unparseable. */
export function durationToSeconds(duration: string | null): number | null {
  if (!duration || !/^\d+(:\d{1,2}){1,2}$/.test(duration)) return null;
  return duration.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

function lastEnd(segments: NewSegment[]): number {
  return segments.reduce((m, s) => Math.max(m, s.endSeconds), 0);
}

interface Candidate {
  source: string;
  chunks: CaptionChunk[];
  segments: NewSegment[];
}

async function fetchCandidates(videoId: string, durationSeconds: number | null): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  const add = (source: string, chunks: CaptionChunk[]) => {
    const ms = captionsToMs(chunks);
    const segments = toSegments(ms);
    candidates.push({ source, chunks: ms, segments });
    console.log(`${source}: ${segments.length} segments, ends at ${fmt(lastEnd(segments))}`);
  };

  try {
    add("youtube", await fetchFromYouTube(videoId));
  } catch (err) {
    console.log(`youtube: failed (${err instanceof Error ? err.message : String(err)})`);
  }

  const youtubeComplete =
    candidates.length > 0 && durationSeconds !== null && lastEnd(candidates[0].segments) >= durationSeconds * COMPLETE;
  if (!youtubeComplete) {
    if (process.env.SUPADATA_API_KEY) {
      try {
        add("supadata", await fetchFromSupadata(videoId, Date.now() + SUPADATA_DEADLINE_MS));
      } catch (err) {
        console.log(`supadata: failed (${err instanceof Error ? err.message : String(err)})`);
      }
    } else {
      console.log("supadata: skipped (SUPADATA_API_KEY not set)");
    }
  }
  return candidates;
}

export async function run(apply: boolean) {
  const prisma = getPrisma();
  const episode = await prisma.episode.findUnique({
    where: { slug: SLUG },
    select: { id: true, slug: true, youtubeVideoId: true, duration: true },
  });
  if (!episode) throw new Error(`No episode with slug "${SLUG}".`);
  if (!episode.youtubeVideoId) throw new Error(`"${SLUG}" has no YouTube id, so its captions can't be fetched.`);

  const durationSeconds = durationToSeconds(episode.duration);
  const stored = await prisma.transcriptSegment.aggregate({
    where: { episodeId: episode.id },
    _count: true,
    _max: { endSeconds: true },
  });
  const storedEnd = stored._max.endSeconds ?? 0;
  console.log(`${SLUG} (${episode.youtubeVideoId}), runtime ${episode.duration ?? "unknown"}`);
  console.log(`stored: ${stored._count} segments, ends at ${fmt(storedEnd)}\n`);

  const usable = (await fetchCandidates(episode.youtubeVideoId, durationSeconds)).filter(
    (c) => c.segments.length && !looksSquashed(c.segments) && lastEnd(c.segments) > storedEnd,
  );
  const best = usable.sort((a, b) => lastEnd(b.segments) - lastEnd(a.segments))[0];
  if (!best) {
    console.log("\nNo fetched captions reach further than the stored transcript. Nothing to do.");
    return;
  }

  const bestEnd = lastEnd(best.segments);
  const coverage = durationSeconds ? ` (${Math.round((bestEnd / durationSeconds) * 100)}% of the runtime)` : "";
  console.log(`\nBest: ${best.source}, ${best.segments.length} segments, ends at ${fmt(bestEnd)}${coverage}.`);
  if (!apply) {
    console.log("Report only. Run ops/refetch-transcript-apply.ts to replace the stored transcript.");
    return;
  }

  const quotes = await replaceTranscript({ episodeId: episode.id, slug: episode.slug }, best.chunks, best.segments);
  console.log(
    `Replaced the transcript with ${best.segments.length} ${best.source} segments` +
      (quotes.total ? `; quotes re-linked ${quotes.relinked}/${quotes.total}` : "") +
      ". Re-run the admin embed job for semantic search.",
  );
}

if (process.argv[1]?.endsWith("refetch-transcript.ts")) {
  run(process.argv.includes("--apply"))
    .then(disconnect)
    .catch(async (e) => {
      console.error(e);
      await disconnect();
      process.exit(1);
    });
}
