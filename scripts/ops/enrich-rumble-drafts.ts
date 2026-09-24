/**
 * Enrich, then publish, the draft episodes created by rumble-transcripts.ts.
 *
 * Scope: draft episodes whose rumbleVideoId is in the committed Rumble index,
 * that have transcript segments and no summary yet. Each one is enriched with
 * the shared prompt (scripts/enrich/lib.ts), imported with the shared importer
 * (guests, quotes, topics, lore), and published only if both steps succeed.
 *
 * Read-only by default (lists what would run). The -apply wrapper does the work
 * for the Run DB Script workflow, whose job times out at 30 minutes: the run
 * stops starting new episodes after TIME_BUDGET_MS, and a rerun picks up the
 * rest because finished episodes no longer match.
 */
import { readFileSync } from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichEpisode } from "../enrich/lib";
import { importEnrichment } from "../enrich/import-enriched";
import { parseIndex, rumbleIdFromUrl } from "./rumble-transcripts";

const DATA_DIR = path.resolve(__dirname, "../ingest/data/rumble-transcripts");
const CONCURRENCY = 3;
const TIME_BUDGET_MS = 24 * 60_000;
// ~75k tokens: leaves Haiku's 200k window room for the prompt and the reply.
const MAX_TRANSCRIPT_CHARS = 300_000;

interface Segment { startSeconds: number; speakerLabel: string | null; text: string }

function timestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

/** The whole stream, thinned evenly when too long, so the summary covers the end too. */
export function transcriptText(segments: Segment[], maxChars = MAX_TRANSCRIPT_CHARS): string {
  const lines = segments.map((s) => `[${timestamp(s.startSeconds)}] ${s.speakerLabel ? `${s.speakerLabel}: ` : ""}${s.text}`);
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  if (total <= maxChars) return lines.join("\n");
  const keepEvery = Math.ceil(total / maxChars);
  return lines.filter((_, i) => i % keepEvery === 0).join("\n");
}

export async function run(apply: boolean) {
  process.env.ENRICHMENT_PROVIDER ??= "anthropic";
  process.env.ENRICHMENT_MODEL ??= "claude-haiku-4-5-20251001";

  const prisma = getPrisma();
  const rumbleIds = parseIndex(readFileSync(path.join(DATA_DIR, "index.csv"), "utf8"))
    .map((r) => rumbleIdFromUrl(r.rumbleUrl))
    .filter((id): id is string => !!id);

  const todo = await prisma.episode.findMany({
    where: {
      status: "draft",
      rumbleVideoId: { in: rumbleIds },
      segments: { some: {} },
      OR: [{ summaryLong: null }, { summaryLong: "" }],
    },
    select: { id: true, slug: true, title: true, episodeNumber: true, airDate: true, _count: { select: { segments: true } } },
    orderBy: { airDate: "desc" },
  });

  console.log(`${apply ? "APPLY" : "REPORT (read-only)"} — ${todo.length} Rumble draft episodes to enrich and publish\n`);
  if (!apply) {
    for (const ep of todo) console.log(`  ${ep.airDate?.toISOString().slice(0, 10) ?? "????-??-??"} ${ep.slug} (${ep._count.segments} segments)`);
    await disconnect();
    return;
  }

  const started = Date.now();
  const tally = { published: 0, failed: 0 };
  let next = 0;

  const worker = async () => {
    while (next < todo.length && Date.now() - started < TIME_BUDGET_MS) {
      const ep = todo[next++];
      try {
        const segments = await prisma.transcriptSegment.findMany({
          where: { episodeId: ep.id },
          select: { startSeconds: true, speakerLabel: true, text: true },
          orderBy: { startSeconds: "asc" },
        });
        const data = await enrichEpisode({
          title: ep.title,
          episodeNumber: ep.episodeNumber ?? 0,
          airDate: ep.airDate?.toISOString().slice(0, 10) ?? "unknown",
          description: "",
          transcript: transcriptText(segments),
        });
        await importEnrichment(prisma, { slug: ep.slug, filePath: "", data });
        await prisma.episode.update({ where: { id: ep.id }, data: { status: "published" } });
        tally.published++;
        console.log(`  ✓ ${ep.slug}: ${data.guests.length} guests, ${data.quotes.length} quotes, ${data.topics.length} topics — published`);
      } catch (err) {
        tally.failed++;
        console.log(`  ✗ ${ep.slug}: ${err instanceof Error ? err.message : String(err)} — left as draft`);
      }
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const left = todo.length - tally.published - tally.failed;
  console.log(
    `\nSummary: enriched and published ${tally.published} · failed ${tally.failed} (still drafts) · ` +
      `not reached ${left}${left ? " — run again to continue" : ""}`,
  );
  await disconnect();
}

if (process.argv[1]?.endsWith("enrich-rumble-drafts.ts")) {
  run(process.argv.includes("--apply")).catch(async (e) => {
    console.error(e);
    await disconnect();
    process.exit(1);
  });
}
