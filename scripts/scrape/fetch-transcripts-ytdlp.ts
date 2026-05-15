// Fetch transcripts for @PsychesNightmares using yt-dlp (bypasses CAPTCHA).
// Requires yt-dlp installed: pip install yt-dlp
// Saves same format as fetch-transcripts-nightmares.ts: [{offset, duration, text}]
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { tmpdir } from "os";

const SCRAPE_DIR = join(__dirname, "data");
const RAW_FILE = join(SCRAPE_DIR, "youtube-raw-psychesnightmares.json");
const TRANSCRIPT_DIR = join(SCRAPE_DIR, "transcripts");

type Segment = { offset: number; duration: number; text: string };

function parseVtt(vtt: string): Segment[] {
  const segments: Segment[] = [];
  const blocks = vtt.split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim().split(" ")[0]);
    const text = lines
      .filter((l) => !l.includes("-->") && !l.match(/^\d+$/) && l !== "WEBVTT" && !l.startsWith("Kind:") && !l.startsWith("Language:"))
      .join(" ")
      .replace(/<[^>]+>/g, "")   // strip VTT tags like <c>
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .trim();
    if (!text) continue;
    const start = toMs(startStr);
    const end = toMs(endStr);
    segments.push({ offset: start, duration: end - start, text });
  }
  return segments;
}

function toMs(ts: string): number {
  const parts = ts.split(":").map(Number);
  if (parts.length === 3) return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000);
  return Math.round((parts[0] * 60 + parts[1]) * 1000);
}

function fetchWithYtdlp(videoId: string): Segment[] {
  const tmp = join(tmpdir(), `ytdlp-${videoId}`);
  try {
    execSync(
      `yt-dlp --skip-download --write-auto-subs --sub-lang en --sub-format vtt ` +
      `--output "${tmp}" "https://www.youtube.com/watch?v=${videoId}"`,
      { stdio: "pipe", timeout: 60000 }
    );
    // yt-dlp saves as tmp.en.vtt
    const files = readdirSync(tmpdir()).filter((f) => f.startsWith(`ytdlp-${videoId}`) && f.endsWith(".vtt"));
    if (!files.length) throw new Error("No VTT file produced");
    const vtt = readFileSync(join(tmpdir(), files[0]), "utf-8");
    files.forEach((f) => { try { unlinkSync(join(tmpdir(), f)); } catch {} });
    return parseVtt(vtt);
  } catch (err) {
    // Clean up any partial files
    try {
      readdirSync(tmpdir())
        .filter((f) => f.startsWith(`ytdlp-${videoId}`))
        .forEach((f) => unlinkSync(join(tmpdir(), f)));
    } catch {}
    throw err;
  }
}

async function main() {
  if (!existsSync(RAW_FILE)) {
    console.error("youtube-raw-psychesnightmares.json not found. Run _fetch-psychesnightmares.ts first.");
    process.exit(1);
  }

  // Check yt-dlp is installed
  try { execSync("yt-dlp --version", { stdio: "pipe" }); }
  catch { console.error("yt-dlp not found. Install: pip install yt-dlp"); process.exit(1); }

  const raw = JSON.parse(readFileSync(RAW_FILE, "utf-8")) as {
    totalVideos: number;
    videos: Array<{ videoId: string; title: string }>;
  };

  if (!existsSync(TRANSCRIPT_DIR)) mkdirSync(TRANSCRIPT_DIR, { recursive: true });

  let fetched = 0, skipped = 0, failed = 0;
  const failures: string[] = [];

  for (let i = 0; i < raw.videos.length; i++) {
    const video = raw.videos[i];
    const outFile = join(TRANSCRIPT_DIR, `${video.videoId}.json`);
    if (existsSync(outFile)) { skipped++; continue; }

    console.log(`[${i + 1}/${raw.videos.length}] ${video.title.slice(0, 70)}`);
    try {
      const segments = fetchWithYtdlp(video.videoId);
      if (!segments.length) throw new Error("Empty transcript");
      writeFileSync(outFile, JSON.stringify(segments, null, 2));
      console.log(`  ✓ ${segments.length} segments`);
      fetched++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ ${msg.slice(0, 120)}`);
      failures.push(`${video.videoId}: ${msg.slice(0, 100)}`);
      failed++;
    }
  }

  console.log(`\nDone — fetched: ${fetched}, skipped: ${skipped}, failed: ${failed}`);
  if (failures.length) {
    writeFileSync(join(SCRAPE_DIR, "transcript-failures-ytdlp.log"), failures.join("\n"));
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
