/**
 * Import @PsychesNightmares live stream transcripts via Vercel.
 *
 * Requires Vercel deployment to have the /api/admin/nightmares endpoint.
 * The DB and YouTube are both accessible from Vercel; this sandbox can reach neither.
 *
 * Steps:
 *   1. Upsert all 235 episodes from youtube-raw-psychesnightmares.json
 *   2. Fetch transcripts for all episodes that are missing them
 *
 * Usage:
 *   npx tsx scripts/import-nightmares.ts [--step episodes|transcripts|all] [--batch N] [--delay MS]
 *
 * Env vars (from .env):
 *   ENRICH_SECRET   — API auth key
 *   VERCEL_URL      — defaults to https://cultcodex.me
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const BASE_URL = (process.env.VERCEL_URL ?? "https://cultcodex.me").replace(/\/$/, "");
const SECRET = process.env.ENRICH_SECRET ?? "";
const RAW_FILE = path.join(__dirname, "scrape", "data", "youtube-raw-psychesnightmares.json");

if (!SECRET) {
  console.error("ENRICH_SECRET not set in .env");
  process.exit(1);
}

// ── Args ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let step: "episodes" | "transcripts" | "all" = "all";
  let batchSize = 20;
  let delayMs = 2000;
  let maxTranscripts = 0; // 0 = unlimited

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--step" && args[i + 1]) { step = args[++i] as typeof step; }
    if (args[i] === "--batch" && args[i + 1]) { batchSize = parseInt(args[++i]); }
    if (args[i] === "--delay" && args[i + 1]) { delayMs = parseInt(args[++i]); }
    if (args[i] === "--max" && args[i + 1]) { maxTranscripts = parseInt(args[++i]); }
  }
  return { step, batchSize, delayMs, maxTranscripts };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function apiPost(path: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, BASE_URL);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
          "x-enrich-secret": SECRET,
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error(`Non-JSON response (HTTP ${res.statusCode}): ${raw.slice(0, 200)}`)); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1: Upsert episodes ───────────────────────────────────────────────────

async function importEpisodes(batchSize: number, delayMs: number) {
  if (!fs.existsSync(RAW_FILE)) {
    console.error(`Raw file not found: ${RAW_FILE}`);
    console.error("Run: npx tsx scripts/_fetch-psychesnightmares.ts");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8")) as {
    totalVideos: number;
    videos: Array<{
      videoId: string;
      title: string;
      description: string;
      publishedAt: string;
      duration: string | null;
      thumbnailUrl: string | null;
    }>;
  };

  console.log(`\n── STEP 1: Upsert Episodes ──────────────────────────────`);
  console.log(`  ${raw.totalVideos} videos from channel data`);
  console.log(`  Sending in batches of ${batchSize}...\n`);

  const videos = raw.videos;
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    const progress = `[${i + batch.length}/${videos.length}]`;

    try {
      const result = await apiPost("/api/admin/nightmares", {
        mode: "upsert-episodes",
        videos: batch.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          description: v.description,
          publishedAt: v.publishedAt,
          duration: v.duration,
          thumbnailUrl: v.thumbnailUrl,
        })),
      }) as { created: number; skipped: number; errors: number };

      totalCreated += result.created ?? 0;
      totalSkipped += result.skipped ?? 0;
      totalErrors += result.errors ?? 0;

      process.stdout.write(
        `\r  ${progress} created: ${totalCreated}  skipped: ${totalSkipped}  errors: ${totalErrors}    `
      );
    } catch (err) {
      console.error(`\n  Error on batch ${i / batchSize + 1}:`, String(err).slice(0, 120));
    }

    if (i + batchSize < videos.length) await sleep(delayMs);
  }

  console.log(`\n\n  Done — created: ${totalCreated}, already existed: ${totalSkipped}, errors: ${totalErrors}`);
}

// ── Step 2: Fetch transcripts ─────────────────────────────────────────────────

async function importTranscripts(delayMs: number, maxTranscripts: number) {
  console.log(`\n── STEP 2: Fetch Transcripts ────────────────────────────`);

  // First get status from Vercel
  const status = await apiPost("/api/admin/nightmares", { mode: "status" }) as {
    total: number;
    withTranscripts: number;
    withoutTranscripts: number;
    missing: Array<{ videoId: string; title: string; episodeNumber: number | null }>;
  };

  console.log(`  Total livestream episodes: ${status.total}`);
  console.log(`  Already have transcripts:  ${status.withTranscripts}`);
  console.log(`  Missing transcripts:       ${status.withoutTranscripts}`);

  if (!status.missing?.length) {
    console.log("  Nothing to fetch. All caught up.");
    return;
  }

  const toProcess = maxTranscripts > 0 ? status.missing.slice(0, maxTranscripts) : status.missing;
  console.log(`  Fetching ${toProcess.length} transcripts (delay: ${delayMs}ms between each)\n`);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const video = toProcess[i];
    const epLabel = video.episodeNumber ? `EP.${String(video.episodeNumber).padStart(4, "0")}` : "EP.????";
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      const result = await apiPost("/api/admin/nightmares", {
        mode: "fetch-transcript",
        videoId: video.videoId,
      }) as { ok: boolean; skipped?: boolean; segments?: number; error?: string; episodeSlug?: string };

      if (result.ok && result.skipped) {
        skipped++;
        process.stdout.write(`\r  ${progress} ${epLabel} already has transcript. fetched:${fetched} skip:${skipped} fail:${failed}  `);
      } else if (result.ok) {
        fetched++;
        console.log(`  ${progress} ${epLabel} ✓ ${result.segments} segments — ${video.title.slice(0, 50)}`);
      } else {
        failed++;
        const errMsg = `${epLabel} ${video.videoId}: ${result.error}`;
        failures.push(errMsg);
        console.log(`  ${progress} ${epLabel} ✗ ${result.error} — ${video.title.slice(0, 40)}`);
      }
    } catch (err) {
      failed++;
      const errMsg = `${epLabel} ${video.videoId}: ${String(err).slice(0, 80)}`;
      failures.push(errMsg);
      console.log(`  ${progress} ✗ network error: ${String(err).slice(0, 80)}`);
    }

    if (i < toProcess.length - 1) await sleep(delayMs);
  }

  console.log(`\n  Done — fetched: ${fetched}, skipped: ${skipped}, failed: ${failed}`);

  if (failures.length) {
    const logPath = path.join(__dirname, "scrape", "data", "transcript-failures-vercel.log");
    fs.writeFileSync(logPath, failures.join("\n"));
    console.log(`  Failures logged: ${logPath}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { step, batchSize, delayMs, maxTranscripts } = parseArgs();

  console.log(`Psyche's Nightmares Import Pipeline`);
  console.log(`  Target:  ${BASE_URL}`);
  console.log(`  Step:    ${step}`);
  console.log(`  Batch:   ${batchSize}`);
  console.log(`  Delay:   ${delayMs}ms`);

  try {
    if (step === "episodes" || step === "all") {
      await importEpisodes(batchSize, delayMs);
    }
    if (step === "transcripts" || step === "all") {
      await importTranscripts(delayMs, maxTranscripts);
    }
    console.log("\nPipeline complete.");
  } catch (err) {
    console.error("\nFatal error:", err);
    process.exit(1);
  }
}

main();
