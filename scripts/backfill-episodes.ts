/**
 * Backfill Episode rows for YouTube videos the daily cron never saw.
 *
 * Why this exists:
 *   /api/cron/ingest-latest only reads the 50 most recent uploads per channel
 *   (fetchRecentUploads(yt, handle, 50), not overridable from the request).
 *   On heavy upload days, or for videos that were private when the cron ran,
 *   uploads fall outside that window and become permanently unreachable — the
 *   cron can never look back far enough to find them again. Those videos have
 *   no Episode row, so episodes-pipeline.yml never sees them either: it only
 *   transcribes rows that already exist and lack a transcript.
 *
 *   This script takes explicit video IDs and creates the missing rows using the
 *   same field shape and helpers as ingest-latest. Once the rows exist,
 *   episodes-pipeline.yml picks them up on its next run with no further work.
 *
 * Usage:
 *   npx tsx scripts/backfill-episodes.ts --ids-file scripts/data/backfill-ids.txt
 *   npx tsx scripts/backfill-episodes.ts --ids dQw4w9WgXcQ,abc123 --commit
 *
 * Flags:
 *   --ids-file PATH   newline-delimited YouTube video IDs
 *   --ids A,B,C       comma-separated IDs (alternative to --ids-file)
 *   --commit          actually write. DRY RUN BY DEFAULT.
 *
 * Env:
 *   YOUTUBE_API_KEY   required
 *   DATABASE_URL      required (via @/lib/db)
 */
import "dotenv/config";
import * as fs from "fs";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/client";
import { cleanSummary, isJunkSummary, isTemplateJunk } from "@/lib/content-hygiene";

// ── Helpers: copied verbatim from ingest-latest/route.ts ────────────────────
// They are file-local there, not exported. Kept identical so backfilled rows
// are indistinguishable from cron-created ones.

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSearchText(...parts: (string | null | undefined)[]): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map((p) => p.toLowerCase())
    .join(" ");
}

function parseIsoDurationToDisplay(iso: string): string | null {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function extractSummary(description: string): string | null {
  if (!description) return null;
  const candidate = description
    .replace(/https?:\/\/\S+/g, "")
    .replace(/support the stream:?\s*/gi, "")
    .replace(/streaming software/gi, "")
    .replace(/support:?\s*/gi, "")
    .trim();
  if (candidate.length <= 10) return null;
  if (isTemplateJunk(candidate)) return null;
  const cleaned = cleanSummary(candidate);
  return isJunkSummary(cleaned) ? null : cleaned.slice(0, 500);
}

// ── Args ────────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let idsFile = "";
  let idsInline = "";
  let commit = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ids-file" && args[i + 1]) idsFile = args[++i];
    else if (args[i] === "--ids" && args[i + 1]) idsInline = args[++i];
    else if (args[i] === "--commit") commit = true;
  }
  return { idsFile, idsInline, commit };
}

function loadIds({ idsFile, idsInline }: { idsFile: string; idsInline: string }): string[] {
  let raw: string[] = [];
  if (idsFile) {
    if (!fs.existsSync(idsFile)) {
      console.error(`ids file not found: ${idsFile}`);
      process.exit(1);
    }
    raw = fs.readFileSync(idsFile, "utf8").split(/\r?\n/);
  } else if (idsInline) {
    raw = idsInline.split(",");
  } else {
    console.error("Provide --ids-file PATH or --ids A,B,C");
    process.exit(1);
  }

  const ids = [
    ...new Set(
      raw
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("#")),
    ),
  ];
  const bad = ids.filter((id) => !/^[A-Za-z0-9_-]{11}$/.test(id));
  if (bad.length) {
    console.error(`Not valid YouTube video IDs (${bad.length}): ${bad.slice(0, 5).join(", ")}`);
    process.exit(1);
  }
  return ids;
}

// ── YouTube metadata ────────────────────────────────────────────────────────

interface FetchedVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  duration: string | null;
  thumbnailUrl: string | null;
}

async function fetchVideosByIds(
  yt: ReturnType<typeof google.youtube>,
  ids: string[],
): Promise<FetchedVideo[]> {
  const out: FetchedVideo[] = [];
  // videos.list accepts at most 50 ids per call.
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const res = await yt.videos.list({
      part: ["snippet", "contentDetails"],
      id: chunk,
      maxResults: 50,
    });
    for (const item of res.data.items || []) {
      const s = item.snippet;
      if (!item.id || !s) continue;
      const thumbs = s.thumbnails || {};
      out.push({
        videoId: item.id,
        title: s.title || "(untitled)",
        description: s.description || "",
        publishedAt: s.publishedAt || new Date().toISOString(),
        duration: item.contentDetails?.duration
          ? parseIsoDurationToDisplay(item.contentDetails.duration)
          : null,
        thumbnailUrl:
          thumbs.maxres?.url || thumbs.standard?.url || thumbs.high?.url || null,
      });
    }
  }
  return out;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const { idsFile, idsInline, commit } = parseArgs();
  const ids = loadIds({ idsFile, idsInline });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY not set");
    process.exit(1);
  }
  const yt = google.youtube({ version: "v3", auth: apiKey });

  console.log(`\n── Backfill Episode rows ${commit ? "(COMMIT)" : "(DRY RUN)"} ──`);
  console.log(`Requested IDs: ${ids.length}`);

  const videos = await fetchVideosByIds(yt, ids);
  const foundIds = new Set(videos.map((v) => v.videoId));
  const notOnYouTube = ids.filter((id) => !foundIds.has(id));
  console.log(`Resolved on YouTube: ${videos.length}`);
  if (notOnYouTube.length) {
    console.log(`Not resolvable (deleted/private): ${notOnYouTube.length}`);
    for (const id of notOnYouTube) console.log(`   missing  ${id}`);
  }

  // Idempotency: skip anything already present.
  const existingVideoIds = new Set<string>(
    (
      await prisma.episode.findMany({
        where: { youtubeVideoId: { in: [...foundIds] } },
        select: { youtubeVideoId: true },
      })
    ).map((e) => e.youtubeVideoId!),
  );

  const toCreate = videos
    .filter((v) => !existingVideoIds.has(v.videoId))
    // Oldest first so episode numbers go in chronological order, as in the cron.
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  console.log(`Already in DB: ${videos.length - toCreate.length}`);
  console.log(`To create: ${toCreate.length}\n`);

  if (!toCreate.length) {
    console.log("Nothing to do.");
    await prisma.$disconnect();
    return;
  }

  const maxEpAgg = await prisma.episode.aggregate({ _max: { episodeNumber: true } });
  let nextEpNum = (maxEpAgg._max.episodeNumber ?? 0) + 1;

  const existingSlugs = new Set<string>(
    (await prisma.episode.findMany({ select: { slug: true } })).map((e) => e.slug),
  );

  let created = 0;
  const failures: string[] = [];

  for (const v of toCreate) {
    let slug = slugify(v.title);
    let n = 2;
    const base = slug;
    while (existingSlugs.has(slug)) slug = `${base}-${n++}`;
    existingSlugs.add(slug);

    const summaryShort = extractSummary(v.description);
    const searchText = buildSearchText(v.title, summaryShort);
    const epNum = nextEpNum++;

    const label = `EP.${epNum} [${v.publishedAt.split("T")[0]}] ${v.title.slice(0, 60)}`;

    if (!commit) {
      console.log(`  would create  ${label}`);
      console.log(`                slug=${slug} video=${v.videoId} dur=${v.duration ?? "?"}`);
      continue;
    }

    try {
      await prisma.episode.create({
        data: {
          title: v.title,
          slug,
          episodeNumber: epNum,
          airDate: new Date(v.publishedAt),
          duration: v.duration,
          youtubeVideoId: v.videoId,
          thumbnailUrl: v.thumbnailUrl,
          summaryShort,
          searchText,
          status: ContentStatus.published,
        },
      });
      created++;
      console.log(`  created  ${label}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push(`${v.videoId}: ${msg.slice(0, 120)}`);
      console.error(`  FAILED   ${label}\n           ${msg.slice(0, 160)}`);
    }
  }

  console.log("");
  if (commit) {
    console.log(`Done — created ${created}, failed ${failures.length}.`);
    if (failures.length) for (const f of failures) console.log(`  ${f}`);
    console.log("\nNext: run episodes-pipeline.yml. It will find these rows in the");
    console.log("missing-transcript list and fetch their transcripts via yt-dlp.");
  } else {
    console.log(`Dry run only — nothing written. Re-run with --commit to apply.`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
