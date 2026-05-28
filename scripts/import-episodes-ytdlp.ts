/**
 * Import @CultofPsyche main channel transcripts using yt-dlp + YouTube cookies.
 *
 * Usage:
 *   npx tsx scripts/import-episodes-ytdlp.ts [--delay MS] [--max N] [--content-type TYPE]
 *
 * Env vars:
 *   ENRICH_SECRET          — API auth key (required)
 *   VERCEL_URL             — defaults to https://cultcodex.me
 *   YOUTUBE_COOKIES_FILE   — path to Netscape cookies file (required for CI)
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as os from "os";
import { execFileSync } from "child_process";

const BASE_URL = (process.env.VERCEL_URL ?? "https://cultcodex.me").replace(/\/$/, "");
const SECRET = (process.env.ENRICH_SECRET ?? "").trim();
const COOKIES_FILE = process.env.YOUTUBE_COOKIES_FILE ?? "";

if (!SECRET) {
  console.error("ENRICH_SECRET not set");
  process.exit(1);
}

// ── Args ──────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let delayMs = 2000;
  let maxTranscripts = 0;
  let contentType = "original";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--delay" && args[i + 1]) { delayMs = parseInt(args[++i]); }
    if (args[i] === "--max" && args[i + 1]) { maxTranscripts = parseInt(args[++i]); }
    if (args[i] === "--content-type" && args[i + 1]) { contentType = args[++i]; }
  }
  return { delayMs, maxTranscripts, contentType };
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

function apiPost(urlPath: string, body: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(urlPath, BASE_URL);
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
          catch { reject(new Error(`Non-JSON (HTTP ${res.statusCode}): ${raw.slice(0, 200)}`)); }
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

// ── VTT parsing ───────────────────────────────────────────────────────────────

type Segment = { offset: number; duration: number; text: string };

function toMs(ts: string): number {
  const clean = ts.split(" ")[0];
  const parts = clean.split(":").map(Number);
  if (parts.length === 3) return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
  return Math.round((parts[0] * 60 + parts[1]) * 1000);
}

function parseVtt(vtt: string): Segment[] {
  const segments: Segment[] = [];
  const seen = new Set<string>();
  const blocks = vtt.split(/\n\n+/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    const text = lines
      .filter((l) =>
        !l.includes("-->") &&
        !/^\d+$/.test(l.trim()) &&
        l.trim() !== "WEBVTT" &&
        !l.startsWith("Kind:") &&
        !l.startsWith("Language:")
      )
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
      .trim();

    if (!text) continue;

    const start = toMs(startStr);
    const end = toMs(endStr);
    const key = `${start}:${text}`;
    if (seen.has(key)) continue;
    seen.add(key);

    segments.push({ offset: start, duration: Math.max(end - start, 1000), text });
  }

  return segments;
}

// ── yt-dlp fetch ──────────────────────────────────────────────────────────────

function fetchVtt(videoId: string): string {
  const tmpBase = path.join(os.tmpdir(), `yt-episodes-${videoId}`);

  for (const f of fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith(`yt-episodes-${videoId}`))) {
    try { fs.unlinkSync(path.join(os.tmpdir(), f)); } catch {}
  }

  const args = [
    "--skip-download",
    "--write-auto-subs",
    "--sub-lang", "en",
    "--sub-format", "vtt",
    "--output", tmpBase,
  ];

  if (COOKIES_FILE && fs.existsSync(COOKIES_FILE)) {
    args.push("--cookies", COOKIES_FILE);
  }

  args.push(`https://www.youtube.com/watch?v=${videoId}`);

  execFileSync("yt-dlp", args, { stdio: "pipe", timeout: 30_000 });

  const produced = fs.readdirSync(os.tmpdir()).filter(
    (f) => f.startsWith(`yt-episodes-${videoId}`) && f.endsWith(".vtt")
  );
  if (!produced.length) throw new Error("no_vtt_produced");

  const vtt = fs.readFileSync(path.join(os.tmpdir(), produced[0]), "utf-8");
  for (const f of produced) {
    try { fs.unlinkSync(path.join(os.tmpdir(), f)); } catch {}
  }

  return vtt;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const { delayMs, maxTranscripts, contentType } = parseArgs();

  console.log(`CultofPsyche — yt-dlp Transcript Import`);
  console.log(`  Target:       ${BASE_URL}`);
  console.log(`  Content type: ${contentType}`);
  console.log(`  Delay:        ${delayMs}ms`);
  console.log(`  Cookies:      ${COOKIES_FILE && fs.existsSync(COOKIES_FILE) ? COOKIES_FILE : "none (unauthenticated)"}`);

  try {
    execFileSync("yt-dlp", ["--version"], { stdio: "pipe" });
  } catch {
    console.error("yt-dlp not found — install with: pip install yt-dlp");
    process.exit(1);
  }

  console.log(`\n── Fetching missing list from Vercel ─────────────────────`);
  let status: { total: number; withTranscripts: number; withoutTranscripts: number; missing: Array<{ videoId: string; title: string; episodeNumber: number | null }> };
  try {
    status = await apiPost("/api/admin/episodes", { mode: "status", contentType }) as typeof status;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FATAL: status endpoint failed — ${msg}`);
    process.exit(1);
  }

  console.log(`  Total episodes:    ${status.total}`);
  console.log(`  Have transcripts:  ${status.withTranscripts}`);
  console.log(`  Missing:           ${status.withoutTranscripts}`);

  if (!status.missing?.length) {
    console.log("  Nothing to do — all caught up.");
    return;
  }

  const toProcess = maxTranscripts > 0 ? status.missing.slice(0, maxTranscripts) : status.missing;
  console.log(`\n── Importing ${toProcess.length} transcripts ──────────────────────\n`);

  let fetched = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < toProcess.length; i++) {
    const video = toProcess[i];
    const epLabel = video.episodeNumber
      ? `EP.${String(video.episodeNumber).padStart(4, "0")}`
      : "EP.????";
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      const vtt = fetchVtt(video.videoId);
      const segments = parseVtt(vtt);
      if (!segments.length) throw new Error("empty_transcript");

      const result = await apiPost("/api/admin/episodes", {
        mode: "import-segments",
        videoId: video.videoId,
        segments,
      }) as { ok: boolean; skipped?: boolean; segments?: number; error?: string; episodeSlug?: string };

      if (result.ok && result.skipped) {
        skipped++;
        process.stdout.write(`\r  ${progress} ${epLabel} already imported. fetched:${fetched} skip:${skipped} fail:${failed}  `);
      } else if (result.ok) {
        fetched++;
        console.log(`  ${progress} ${epLabel} ✓ ${result.segments} segs — ${video.title.slice(0, 50)}`);
      } else {
        failed++;
        failures.push(`${epLabel} ${video.videoId}: ${result.error}`);
        console.log(`  ${progress} ${epLabel} ✗ ${result.error} — ${video.title.slice(0, 40)}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${epLabel} ${video.videoId}: ${msg.slice(0, 100)}`);
      console.log(`  ${progress} ${epLabel} ✗ ${msg.slice(0, 80)} — ${video.title.slice(0, 30)}`);
    }

    if (i < toProcess.length - 1) await sleep(delayMs);
  }

  console.log(`\n  Done — fetched: ${fetched}, skipped: ${skipped}, failed: ${failed}`);

  if (failures.length) {
    const logPath = path.join(__dirname, "scrape", "data", "transcript-failures-episodes.log");
    fs.writeFileSync(logPath, failures.join("\n"));
    console.log(`  Failures logged: ${logPath}`);
  }
}

main().catch((e) => {
  console.error("\nFatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
