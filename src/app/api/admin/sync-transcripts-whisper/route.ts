import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { createReadStream } from "fs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 600;
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Escape a string for safe use inside a shell double-quoted argument
function shellEsc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

interface WhisperResult {
  episodeId: string;
  slug: string;
  videoId: string;
  status: "ok" | "no_audio" | "error";
  segments?: number;
  error?: string;
}

// Resolve yt-dlp via shell PATH — handles Nix store symlinks transparently
async function findYtDlp(): Promise<string> {
  const candidates = [
    "which yt-dlp",
    "command -v yt-dlp",
  ];
  for (const cmd of candidates) {
    try {
      const { stdout } = await execAsync(cmd);
      const path = stdout.trim();
      if (path) return path;
    } catch {
      // try next
    }
  }
  // Try common Nix paths explicitly
  const nixPaths = [
    "/nix/var/nix/profiles/default/bin/yt-dlp",
    "/root/.nix-profile/bin/yt-dlp",
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
  ];
  for (const p of nixPaths) {
    try {
      await execAsync(`"${p}" --version`);
      return p;
    } catch {
      // try next
    }
  }
  throw new Error("yt-dlp not found — Railway must rebuild with nixpacks.toml containing yt-dlp");
}

async function downloadAudio(ytDlp: string, videoId: string, outDir: string): Promise<string | null> {
  const url = `https://www.youtube.com/watch?v=${shellEsc(videoId)}`;
  const outTemplate = shellEsc(join(outDir, "%(id)s.%(ext)s"));
  const cmd = `"${ytDlp}" "${url}" --extract-audio --audio-format mp3 --audio-quality 5 --max-filesize 50m --no-playlist --quiet --output "${outTemplate}"`;
  try {
    await execAsync(cmd, { timeout: 120_000 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // yt-dlp exits non-zero for age-restricted / unavailable videos
    if (msg.includes("Sign in") || msg.includes("age") || msg.includes("unavailable") || msg.includes("private")) {
      return null;
    }
    throw err;
  }

  // Find the downloaded file
  const files = await readdir(outDir);
  const audio = files.find((f) => f.startsWith(videoId) && f.endsWith(".mp3"));
  return audio ? join(outDir, audio) : null;
}

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

async function transcribeWithWhisper(openai: OpenAI, audioPath: string): Promise<WhisperSegment[] | null> {
  const stream = createReadStream(audioPath);
  const resp = await openai.audio.transcriptions.create({
    file: stream,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
    language: "en",
  });

  const segs = (resp as { segments?: WhisperSegment[] }).segments;
  if (!segs || segs.length === 0) return null;
  return segs;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  let ytDlp: string;
  try {
    ytDlp = await findYtDlp();
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(Math.max(1, body.limit ?? 5), 20);

  const openai = new OpenAI({ apiKey: openaiKey });

  // Find episodes marked no_captions (confirmed no YouTube captions — Whisper bypass)
  const episodesWithTranscripts = await prisma.transcriptSegment.groupBy({
    by: ["episodeId"],
    _count: { id: true },
  });
  const hasTranscript = new Set(episodesWithTranscripts.map((e) => e.episodeId));

  const episodes = await prisma.episode.findMany({
    where: {
      youtubeVideoId: { not: null },
      status: "published",
    },
    select: { id: true, slug: true, youtubeVideoId: true },
    orderBy: { airDate: "asc" },
  });

  const pending = episodes.filter((ep) => !hasTranscript.has(ep.id)).slice(0, limit);
  const totalPending = episodes.filter((ep) => !hasTranscript.has(ep.id)).length;

  const results: WhisperResult[] = [];

  for (let i = 0; i < pending.length; i++) {
    const ep = pending[i];
    const videoId = ep.youtubeVideoId!;
    const outDir = join(tmpdir(), `whisper_${videoId}_${Date.now()}`);

    try {
      await execAsync(`mkdir -p "${shellEsc(outDir)}"`);

      const audioPath = await downloadAudio(ytDlp, videoId, outDir);

      if (!audioPath) {
        // Mark permanently so regular transcript sync also skips it
        await prisma.episode.update({
          where: { id: ep.id },
          data: { transcriptRaw: "no_captions" },
        });
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "no_audio" });
        continue;
      }

      const segs = await transcribeWithWhisper(openai, audioPath);

      if (!segs || segs.length === 0) {
        results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: "Whisper returned no segments" });
        continue;
      }

      await prisma.transcriptSegment.createMany({
        data: segs.map((s) => {
          const text = s.text.replace(/\[.*?\]/g, "").trim();
          return {
            episodeId: ep.id,
            startSeconds: Math.round(s.start),
            endSeconds: Math.round(s.end),
            text,
            searchText: text.toLowerCase(),
          };
        }),
        skipDuplicates: true,
      });

      const rawText = segs.map((s) => s.text).join(" ");
      await prisma.episode.update({
        where: { id: ep.id },
        data: {
          transcriptRaw: rawText.slice(0, 200000),
          searchText: [ep.slug, rawText].join(" ").toLowerCase().slice(0, 10000),
        },
      });

      results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "ok", segments: segs.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ episodeId: ep.id, slug: ep.slug, videoId, status: "error", error: msg.slice(0, 200) });
    } finally {
      // Clean up temp audio file
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }

    if (i < pending.length - 1) await sleep(2000);
  }

  const summary = {
    processed: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    no_audio: results.filter((r) => r.status === "no_audio").length,
    errors: results.filter((r) => r.status === "error").length,
    remaining: totalPending - results.length,
  };

  return NextResponse.json({ ok: true, summary, results });
}
