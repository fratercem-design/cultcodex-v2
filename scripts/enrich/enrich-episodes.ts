// AI enrichment for main @CultofPsyche channel episodes.
// Finds original episodes in the DB that lack summaryLong, reads their
// transcripts from DB (with optional local file fallback), and enriches
// them with Claude. Saves each result as scripts/enrich/data/<slug>.json,
// which import-enriched.ts then imports back into the DB.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/enrich/enrich-episodes.ts [--batch N] [--force]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichEpisode, buildTranscriptText } from "./lib";

const TRANSCRIPTS_DIR = path.join(__dirname, "..", "scrape", "data", "transcripts");
const RAW_PATH = path.join(__dirname, "..", "scrape", "data", "youtube-raw.json");
const DATA_DIR = path.join(__dirname, "data");
const LOG_PATH = path.join(__dirname, "enrich-episodes.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

interface RawVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "10", 10);
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) {
      batch = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") force = true;
  }

  return { batch, force };
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  // Load optional local metadata for descriptions (gitignored, may not exist in CI)
  const videoMeta = new Map<string, RawVideo>();
  if (fs.existsSync(RAW_PATH)) {
    const raw = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8")) as { videos: RawVideo[] };
    for (const v of raw.videos) videoMeta.set(v.videoId, v);
    log(`Loaded ${videoMeta.size} video metadata entries from local file`);
  } else {
    log("No local raw JSON — descriptions will be sourced from DB summaryShort");
  }

  // Find original episodes needing enrichment
  const episodes = await prisma.episode.findMany({
    where: {
      contentType: "original",
      youtubeVideoId: { not: null },
      OR: [{ summaryLong: null }, { summaryLong: "" }],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      episodeNumber: true,
      airDate: true,
      youtubeVideoId: true,
      summaryShort: true,
    },
    orderBy: { episodeNumber: "asc" },
  });

  log(`Found ${episodes.length} original episodes needing enrichment`);

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const candidates = await Promise.all(
    episodes
      .filter((ep) => {
        if (!ep.youtubeVideoId) return false;
        if (!force) {
          const enrichedPath = path.join(DATA_DIR, `${ep.slug}.json`);
          if (fs.existsSync(enrichedPath)) return false;
        }
        return true;
      })
      .map(async (ep) => {
        const localPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId}.json`);
        const hasLocal = fs.existsSync(localPath);
        if (!hasLocal) {
          const count = await prisma.transcriptSegment.count({ where: { episodeId: ep.id } });
          if (count === 0) { log(`  SKIP (no transcript): ${ep.slug}`); return null; }
        }
        return ep;
      })
  ).then((eps) => eps.filter(Boolean) as typeof episodes);

  log(`${candidates.length} candidates with transcripts (batch: ${batch})`);

  const toProcess = candidates.slice(0, batch);
  let success = 0;
  let failures = 0;

  for (const ep of toProcess) {
    const epLabel = ep.episodeNumber != null ? `EP.${String(ep.episodeNumber).padStart(4, "0")}` : ep.slug;
    log(`Processing: ${epLabel} — ${ep.title}`);

    try {
      const localPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId!}.json`);
      let segments: Array<{ offset: number; duration: number; text: string }>;

      if (fs.existsSync(localPath)) {
        segments = JSON.parse(fs.readFileSync(localPath, "utf-8"));
      } else {
        const dbSegs = await prisma.transcriptSegment.findMany({
          where: { episodeId: ep.id },
          orderBy: { startSeconds: "asc" },
          select: { startSeconds: true, endSeconds: true, text: true },
        });
        segments = dbSegs.map((s) => ({
          offset: s.startSeconds * 1000,
          duration: Math.max((s.endSeconds - s.startSeconds) * 1000, 1000),
          text: s.text,
        }));
      }

      const transcriptText = buildTranscriptText(segments);
      const MAX_CHARS = 400_000;
      const truncated =
        transcriptText.length > MAX_CHARS
          ? transcriptText.slice(0, MAX_CHARS) + "\n\n[TRANSCRIPT TRUNCATED]"
          : transcriptText;

      const meta = videoMeta.get(ep.youtubeVideoId!);
      const result = await enrichEpisode({
        title: ep.title,
        episodeNumber: ep.episodeNumber ?? 0,
        airDate: ep.airDate?.toISOString().split("T")[0] ?? (meta?.publishedAt?.split("T")[0] ?? "unknown"),
        description: meta?.description ?? ep.summaryShort ?? "",
        transcript: truncated,
      });

      const outPath = path.join(DATA_DIR, `${ep.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      log(`  ✓ Saved → ${ep.slug}.json (${result.guests.length} guests, ${result.quotes.length} quotes)`);
      success++;

      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${epLabel}: ${msg}`);
      failures++;
      if (msg.includes("429")) {
        log("  Rate limited — waiting 60s...");
        await new Promise((r) => setTimeout(r, 60_000));
      }
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}`);
  log(`Run 'npx tsx scripts/enrich/import-enriched.ts' to import into DB.`);

  await disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
