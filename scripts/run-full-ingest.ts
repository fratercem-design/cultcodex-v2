#!/usr/bin/env npx tsx
/**
 * Full Codex Ingest — run once to import all episodes + transcripts.
 *
 *   npx tsx scripts/run-full-ingest.ts
 *
 * Steps performed automatically:
 *   1. Sweep @CultofPsyche & @PsychesNightmares — all videos → Episode rows
 *   2. Fetch YouTube auto-captions → TranscriptSegment rows
 *   3. Print Psychenomicon-ready episode list
 *
 * Env vars required (already in your .env):
 *   DATABASE_URL      — Neon connection string
 *   YOUTUBE_API_KEY   — YouTube Data API v3
 */
import "dotenv/config";
import { getYouTube, parseDuration } from "./scrape/lib";
import { getPrisma, disconnect, slugify } from "./ingest/lib";
import { ContentStatus, ContentType } from "../src/generated/prisma/enums";
import { YoutubeTranscript } from "youtube-transcript";

const CHANNELS = ["@CultofPsyche", "@PsychesNightmares"];
const TRANSCRIPT_DELAY_MS = 1200;
const MAX_TRANSCRIPTS_PER_RUN = 9999; // unlimited — fetch all

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── YouTube helpers ───────────────────────────────────────────────────────────

async function resolveUploadsPlaylist(handle: string) {
  const yt = getYouTube();
  const res = await yt.channels.list({
    part: ["snippet", "contentDetails"],
    forHandle: handle.startsWith("@") ? handle : `@${handle}`,
  });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found: ${handle}`);
  const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) throw new Error(`No uploads playlist: ${handle}`);
  return { channelTitle: ch.snippet?.title ?? handle, uploadsId };
}

async function fetchAllPlaylistItems(playlistId: string) {
  const yt = getYouTube();
  const items: Array<{
    videoId: string; title: string; description: string;
    publishedAt: string; thumbnailUrl: string | null;
  }> = [];
  let pageToken: string | undefined;
  do {
    const res = await yt.playlistItems.list({
      part: ["snippet"], playlistId, maxResults: 50, pageToken,
    });
    for (const item of res.data.items ?? []) {
      const sn = item.snippet;
      const videoId = sn?.resourceId?.videoId;
      if (!videoId || !sn) continue;
      items.push({
        videoId,
        title: sn.title || "Untitled",
        description: sn.description || "",
        publishedAt: sn.publishedAt || "",
        thumbnailUrl: sn.thumbnails?.high?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
    process.stdout.write(`\r  Fetched ${items.length} playlist items...`);
  } while (pageToken);
  console.log();
  return items;
}

async function fetchVideoDetails(videoIds: string[]) {
  const yt = getYouTube();
  const map = new Map<string, { display: string | null; seconds: number | null }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const res = await yt.videos.list({ part: ["contentDetails"], id: videoIds.slice(i, i + 50) });
    for (const v of res.data.items ?? []) {
      const iso = v.contentDetails?.duration ?? "";
      const dur = parseDuration(iso);
      const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
      const seconds = m
        ? parseInt(m[1] || "0") * 3600 + parseInt(m[2] || "0") * 60 + parseInt(m[3] || "0")
        : null;
      map.set(v.id!, { display: dur, seconds });
    }
  }
  return map;
}

function detectContentType(s: number | null): ContentType {
  if (s === null) return ContentType.original;
  if (s <= 90) return ContentType.short;
  if (s > 3600) return ContentType.livestream;
  return ContentType.original;
}

function extractSummary(desc: string) {
  const cleaned = desc.replace(/https?:\/\/\S+/g, "").replace(/support\s*(the stream)?:?\s*/gi, "").trim();
  return cleaned.length > 10 ? cleaned.slice(0, 500) : undefined;
}

// ── Step 1: Episode sync ──────────────────────────────────────────────────────

async function syncEpisodes() {
  console.log("\n══════════════════════════════════════════");
  console.log("STEP 1 — Sync YouTube Episodes");
  console.log("══════════════════════════════════════════");

  const prisma = getPrisma();

  const [existingRows, slugRows] = await Promise.all([
    prisma.episode.findMany({ where: { youtubeVideoId: { not: null } }, select: { youtubeVideoId: true } }),
    prisma.episode.findMany({ select: { slug: true } }),
  ]);
  const existingIds = new Set(existingRows.map((e) => e.youtubeVideoId!));
  const takenSlugs = new Set(slugRows.map((e) => e.slug));
  console.log(`  Existing episodes in DB: ${existingIds.size}`);

  let totalCreated = 0;

  for (const handle of CHANNELS) {
    console.log(`\n  Channel: ${handle}`);
    const { channelTitle, uploadsId } = await resolveUploadsPlaylist(handle);
    console.log(`  → ${channelTitle}`);

    const items = await fetchAllPlaylistItems(uploadsId);
    const newItems = items.filter((v) => !existingIds.has(v.videoId));
    console.log(`  Total: ${items.length} | New: ${newItems.length} | Already in DB: ${items.length - newItems.length}`);

    if (newItems.length === 0) continue;

    console.log(`  Fetching video details...`);
    const details = await fetchVideoDetails(newItems.map((v) => v.videoId));

    let created = 0;
    for (const item of newItems.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))) {
      const det = details.get(item.videoId) ?? { display: null, seconds: null };
      let slug = slugify(item.title);
      let n = 2;
      const base = slug;
      while (takenSlugs.has(slug)) slug = `${base}-${n++}`;
      takenSlugs.add(slug);

      try {
        await prisma.episode.create({
          data: {
            title: item.title, slug,
            youtubeVideoId: item.videoId,
            contentType: detectContentType(det.seconds),
            status: ContentStatus.published,
            airDate: item.publishedAt ? new Date(item.publishedAt) : null,
            duration: det.display,
            thumbnailUrl: item.thumbnailUrl,
            summaryShort: extractSummary(item.description),
            searchText: item.title.toLowerCase(),
          },
        });
        existingIds.add(item.videoId);
        created++;
        totalCreated++;
        if (created % 50 === 0) console.log(`  Inserted ${created}/${newItems.length}...`);
      } catch { /* slug collision */ }
    }
    console.log(`  ✓ Created ${created} new episodes`);
  }

  console.log(`\n  Total new episodes: ${totalCreated}`);
  return totalCreated;
}

// ── Step 2: Transcript fetch ──────────────────────────────────────────────────

async function syncTranscripts() {
  console.log("\n══════════════════════════════════════════");
  console.log("STEP 2 — Fetch Transcripts");
  console.log("══════════════════════════════════════════");

  const prisma = getPrisma();

  const withTranscript = new Set(
    (await prisma.transcriptSegment.groupBy({ by: ["episodeId"] })).map((e) => e.episodeId)
  );

  const episodes = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null }, status: "published" },
    select: { id: true, slug: true, youtubeVideoId: true, title: true },
    orderBy: { airDate: "desc" },
  });

  const pending = episodes.filter((ep) => !withTranscript.has(ep.id));
  const toProcess = pending.slice(0, MAX_TRANSCRIPTS_PER_RUN);

  console.log(`  Episodes with transcripts: ${withTranscript.size}`);
  console.log(`  Episodes needing transcripts: ${pending.length}`);
  console.log(`  Processing: ${toProcess.length}\n`);

  let ok = 0, noCaption = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const ep = toProcess[i];
    const pct = Math.round(((i + 1) / toProcess.length) * 100);
    process.stdout.write(`\r  [${pct}%] ${i + 1}/${toProcess.length} — ${ep.slug.slice(0, 50)}`);

    try {
      const raw = await YoutubeTranscript.fetchTranscript(ep.youtubeVideoId!, { lang: "en" });

      if (!raw || raw.length === 0) {
        noCaption++;
      } else {
        await prisma.transcriptSegment.createMany({
          data: raw.map((seg) => {
            const start = Math.round((seg.offset ?? 0) / 1000);
            const end = seg.duration ? Math.round(((seg.offset ?? 0) + seg.duration) / 1000) : start + 5;
            const text = seg.text.replace(/\[.*?\]/g, "").trim();
            return { episodeId: ep.id, startSeconds: start, endSeconds: end, text, searchText: text.toLowerCase() };
          }),
          skipDuplicates: true,
        });

        const rawText = raw.map((s) => s.text).join(" ");
        await prisma.episode.update({
          where: { id: ep.id },
          data: {
            transcriptRaw: rawText.slice(0, 200000),
            searchText: ep.title.toLowerCase() + " " + rawText.slice(0, 9000),
          },
        });
        ok++;
      }
    } catch {
      errors++;
    }

    if (i < toProcess.length - 1) await sleep(TRANSCRIPT_DELAY_MS);
  }

  console.log(`\n\n  ✓ Fetched:       ${ok}`);
  console.log(`  — No captions:   ${noCaption}`);
  console.log(`  ✗ Errors:        ${errors}`);
  console.log(`  Remaining after: ${Math.max(0, pending.length - toProcess.length)}`);

  return { ok, noCaption, errors };
}

// ── Step 3: Summary ───────────────────────────────────────────────────────────

async function printSummary() {
  console.log("\n══════════════════════════════════════════");
  console.log("STEP 3 — Summary & Next Steps");
  console.log("══════════════════════════════════════════");

  const prisma = getPrisma();

  const [totalEp, withTranscript] = await Promise.all([
    prisma.episode.count({ where: { status: "published" } }),
    prisma.episode.count({
      where: { status: "published", youtubeVideoId: { not: null }, segments: { some: {} } },
    }),
  ]);

  console.log(`\n  Total published episodes: ${totalEp}`);
  console.log(`  Episodes with transcripts: ${withTranscript}`);
  console.log(`  Ready for Psychenomicon:  ${withTranscript}`);
  console.log(`\n  Next: go to /admin/psychenomicon → Batch mode → generate chapters`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════╗");
  console.log("║     CULT CODEX — Full Ingest Pipeline    ║");
  console.log("╚══════════════════════════════════════════╝");

  try {
    await syncEpisodes();
    await syncTranscripts();
    await printSummary();
    console.log("\n  ✓ All done.\n");
  } catch (err) {
    console.error("\n  Fatal:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

main();
