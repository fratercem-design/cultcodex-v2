#!/usr/bin/env node
/**
 * Whisper transcription for episodes that have local audio but no YouTube captions.
 * Small files (<25MB) → Whisper directly.
 * Large files (≥25MB) → ffmpeg 15-min chunks → Whisper per chunk → merge.
 * Results written to TranscriptSegment table + episode.transcriptRaw.
 */
import { execSync, spawnSync } from "node:child_process";
import { createReadStream, statSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { randomBytes, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import FormData from "form-data";
import fetch from "node-fetch";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

// Load .env
const envFile = join(ROOT, ".env");
const env = {};
for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const eq = line.indexOf("=");
  if (eq < 1) continue;
  const key = line.slice(0, eq).trim();
  const val = line.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  if (/^[A-Z_][A-Z0-9_]*$/.test(key)) env[key] = val;
}

const DATABASE_URL = env.DATABASE_URL;
const OPENAI_API_KEY = env.OPENAI_API_KEY;

const GROQ_API_KEY = env.GROQ_API_KEY;

// Whisper backend selection. Groq's whisper-large-v3-turbo is FREE and fast —
// preferred when GROQ_API_KEY is present. Falls back to paid OpenAI Whisper.
// Force with WHISPER_BACKEND=openai|groq in .env.
const WHISPER_BACKEND =
  env.WHISPER_BACKEND || (GROQ_API_KEY ? "groq" : OPENAI_API_KEY ? "openai" : null);

const WHISPER = WHISPER_BACKEND === "groq"
  ? {
      url: "https://api.groq.com/openai/v1/audio/transcriptions",
      key: GROQ_API_KEY,
      model: "whisper-large-v3-turbo",
    }
  : {
      url: "https://api.openai.com/v1/audio/transcriptions",
      key: OPENAI_API_KEY,
      model: "whisper-1",
    };

if (!DATABASE_URL || !WHISPER.key) {
  console.error("Missing DATABASE_URL or a Whisper key (GROQ_API_KEY / OPENAI_API_KEY) in .env");
  process.exit(1);
}
console.log(`Whisper backend: ${WHISPER_BACKEND} (${WHISPER.model})`);

const AUDIO_DIR = join(ROOT, "scripts/scrape/data/audio");
const MAX_WHISPER_BYTES = 24 * 1024 * 1024; // 24MB to stay under 25MB limit

// CLI flags:
//   --limit N   cap how many episodes to process this run (default: all)
//   --dry-run   list what WOULD be transcribed, then exit (no API calls, no writes)
//   --download  also include episodes with NO local audio; fetch via yt-dlp first
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const DOWNLOAD = args.includes("--download");
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) || Infinity : Infinity;

// Fetch an episode's audio from YouTube as mp3 via yt-dlp. Returns true on success.
// YouTube increasingly requires auth — set YT_DLP_COOKIES_BROWSER (chrome|edge|
// firefox|brave) to pull your logged-in cookies, or YT_DLP_COOKIES_FILE for a
// cookies.txt export. Without either, unauthenticated download is attempted.
const COOKIES_BROWSER = env.YT_DLP_COOKIES_BROWSER; // e.g. "firefox"
const COOKIES_FILE = env.YT_DLP_COOKIES_FILE;       // path to cookies.txt
function downloadAudio(videoId) {
  const out = join(AUDIO_DIR, `${videoId}.mp3`);
  console.log(`  ↓ downloading audio via yt-dlp${COOKIES_BROWSER ? ` (cookies: ${COOKIES_BROWSER})` : COOKIES_FILE ? " (cookies file)" : ""}…`);
  const cookieArgs = COOKIES_BROWSER
    ? ["--cookies-from-browser", COOKIES_BROWSER]
    : COOKIES_FILE
    ? ["--cookies", COOKIES_FILE]
    : [];
  const r = spawnSync(
    "yt-dlp",
    [...cookieArgs, "-x", "--audio-format", "mp3", "--no-playlist", "-o", out,
     `https://www.youtube.com/watch?v=${videoId}`],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  if (r.status !== 0 || !existsSync(out)) {
    console.log(`  ✗ download failed: ${(r.stderr?.toString() || "").trim().slice(-200)}`);
    return false;
  }
  return true;
}

// Discover every published episode that has NO transcript segments yet but DOES
// have a local audio file. Replaces the old hardcoded 5-episode list — this
// sweeps the whole archive. Returns [{ videoId, slug }].
async function discoverTargets() {
  const { readdirSync } = await import("node:fs");
  const localAudio = new Set(
    readdirSync(AUDIO_DIR)
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => f.slice(0, -4)) // strip ".mp3" → videoId
  );

  const { rows } = await db.query(`
    SELECT e."youtubeVideoId" AS "videoId", e.slug
    FROM "Episode" e
    WHERE e.status = 'published'
      AND e."youtubeVideoId" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM "TranscriptSegment" ts WHERE ts."episodeId" = e.id
      )
    ORDER BY e."airDate" ASC
  `);

  // Without --download, only episodes we already have audio for. With --download,
  // include every un-transcribed episode (missing audio is fetched at process time).
  return DOWNLOAD ? rows : rows.filter((r) => localAudio.has(r.videoId));
}

const db = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Simple cuid-like ID generator (matches Prisma default)
function genId() {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(8).toString("hex");
  return (timestamp + random).toLowerCase();
}

async function whisperFile(audioPath, offsetSecs = 0) {
  const form = new FormData();
  form.append("file", createReadStream(audioPath), { filename: "audio.mp3", contentType: "audio/mpeg" });
  form.append("model", WHISPER.model);
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "segment");
  // offsetSecs is added to each returned segment below to keep absolute timing.

  const res = await fetch(WHISPER.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${WHISPER.key}`, ...form.getHeaders() },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  // data.segments = [{id, seek, start, end, text, ...}]
  return (data.segments || []).map((s) => ({
    start: Math.round(s.start + offsetSecs),
    end: Math.round(s.end + offsetSecs),
    text: s.text.trim(),
  }));
}

async function transcribeFile(audioPath) {
  const size = statSync(audioPath).size;
  console.log(`  Size: ${(size / 1024 / 1024).toFixed(1)} MB`);

  if (size <= MAX_WHISPER_BYTES) {
    console.log("  → direct Whisper");
    return await whisperFile(audioPath, 0);
  }

  // Chunk with ffmpeg — 15 minute segments
  const tmpDir = join(tmpdir(), `whisper-chunks-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    console.log(`  → chunking with ffmpeg into ${tmpDir}`);
    const chunkPattern = join(tmpDir, "chunk_%03d.mp3");
    const result = spawnSync(
      "ffmpeg",
      ["-i", audioPath, "-f", "segment", "-segment_time", "900", "-c", "copy", "-y", chunkPattern],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    if (result.status !== 0) {
      throw new Error(`ffmpeg failed: ${result.stderr?.toString().slice(-500)}`);
    }

    // Collect chunks in order
    const { readdirSync } = await import("node:fs");
    const chunks = readdirSync(tmpDir)
      .filter((f) => f.startsWith("chunk_") && f.endsWith(".mp3"))
      .sort();

    console.log(`  → ${chunks.length} chunks`);

    const allSegments = [];
    let offsetSecs = 0;

    for (const chunk of chunks) {
      const chunkPath = join(tmpDir, chunk);
      const chunkSize = statSync(chunkPath).size;
      console.log(`     ${chunk}: ${(chunkSize / 1024 / 1024).toFixed(1)} MB, offset=${offsetSecs}s`);

      const segs = await whisperFile(chunkPath, offsetSecs);
      allSegments.push(...segs);

      // Advance offset by actual chunk duration
      const durResult = spawnSync("ffprobe", [
        "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", chunkPath,
      ], { stdio: ["ignore", "pipe", "pipe"] });
      const dur = parseFloat(durResult.stdout?.toString().trim() || "900");
      offsetSecs += isNaN(dur) ? 900 : dur;

      // Small delay to avoid hammering the API
      await new Promise((r) => setTimeout(r, 500));
    }

    return allSegments;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function processEpisode(target) {
  const { videoId, slug } = target;
  console.log(`\n[${slug}] videoId=${videoId}`);

  const audioPath = join(AUDIO_DIR, `${videoId}.mp3`);
  if (!existsSync(audioPath)) {
    if (!DOWNLOAD || !downloadAudio(videoId)) {
      console.log("  ✗ audio file not found, skipping" + (DOWNLOAD ? " (download failed)" : " (use --download to fetch)"));
      return;
    }
  }

  // Look up episode in DB
  const epRow = await db.query(
    `SELECT id, "transcriptRaw" FROM "Episode" WHERE "youtubeVideoId" = $1 LIMIT 1`,
    [videoId]
  );
  if (epRow.rows.length === 0) {
    console.log("  ✗ episode not found in DB, skipping");
    return;
  }
  const episode = epRow.rows[0];
  console.log(`  episodeId: ${episode.id}`);

  // Check if already transcribed
  const existing = await db.query(
    `SELECT COUNT(*) AS cnt FROM "TranscriptSegment" WHERE "episodeId" = $1`,
    [episode.id]
  );
  if (parseInt(existing.rows[0].cnt) > 0) {
    console.log(`  ✓ already has ${existing.rows[0].cnt} segments, skipping`);
    return;
  }

  let segments;
  try {
    segments = await transcribeFile(audioPath);
  } catch (err) {
    console.error(`  ✗ transcription failed: ${err.message}`);
    return;
  }

  if (!segments || segments.length === 0) {
    console.log("  ✗ no segments returned");
    return;
  }

  console.log(`  → ${segments.length} segments, writing to DB...`);

  // Insert segments one at a time (simple, reliable)
  const now = new Date();
  for (const seg of segments) {
    await db.query(
      `INSERT INTO "TranscriptSegment" (id, "episodeId", "startSeconds", "endSeconds", text, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
      [genId(), episode.id, seg.start, seg.end, seg.text, now, now]
    );
  }

  // Update episode.transcriptRaw
  const rawText = segments.map((s) => s.text).join(" ");
  await db.query(
    `UPDATE "Episode" SET "transcriptRaw" = $1 WHERE id = $2`,
    [rawText.slice(0, 200000), episode.id]
  );

  console.log(`  ✓ done — ${segments.length} segments written`);
}

async function main() {
  await db.connect();
  console.log("Connected to DB");

  const all = await discoverTargets();
  const targets = all.slice(0, LIMIT);
  console.log(`Sweep: ${all.length} un-transcribed episode(s) ${DOWNLOAD ? "(audio fetched as needed)" : "with local audio"}` +
    (LIMIT !== Infinity ? ` — processing ${targets.length} this run` : "") + ".");

  if (DRY_RUN) {
    for (const t of targets) console.log(`  would transcribe: ${t.slug} (${t.videoId})`);
    if (all.length > targets.length) console.log(`  …and ${all.length - targets.length} more not shown (--limit).`);
    await db.end();
    console.log("\nDry run — nothing written.");
    return;
  }

  let done = 0;
  for (const target of targets) {
    await processEpisode(target);
    done++;
    console.log(`  [${done}/${targets.length}] complete`);
  }

  await db.end();
  console.log("\nAll done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
