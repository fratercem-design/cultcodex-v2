/**
 * Channel Sweep — sync @CultofPsyche YouTube uploads to the DB.
 *
 * Safe to re-run: uses upsert by youtubeVideoId, never renumbers existing
 * episodes, only inserts rows that are genuinely missing.
 *
 * ContentType detection (same rules as fix-content-types.ts):
 *   duration ≤ 90s  → short
 *   duration > 3600s → livestream
 *   otherwise        → original
 *
 * Env vars:
 *   YOUTUBE_API_KEY  — YouTube Data API v3 key (required)
 *   DATABASE_URL     — Postgres connection string (required)
 *
 * Usage:
 *   YOUTUBE_API_KEY=... DATABASE_URL=... npx tsx scripts/sync-youtube-channel.ts
 *   YOUTUBE_CHANNEL_HANDLE=@CultofPsyche npx tsx scripts/sync-youtube-channel.ts
 */
import "dotenv/config";
import { getYouTube, parseDuration } from "./scrape/lib";
import { getPrisma, disconnect, slugify } from "./ingest/lib";
import { ContentStatus, ContentType } from "../src/generated/prisma/enums";
import { cleanSummary, isJunkSummary, isTemplateJunk } from "../src/lib/content-hygiene";

const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE ?? "@CultofPsyche";

// ── YouTube helpers ──────────────────────────────────────────────────────────

async function resolveChannel(handleOrId: string): Promise<{ channelId: string; title: string }> {
  const yt = getYouTube();

  if (handleOrId.startsWith("UC")) {
    const res = await yt.channels.list({ part: ["snippet"], id: [handleOrId] });
    const ch = res.data.items?.[0];
    if (!ch) throw new Error(`Channel not found: ${handleOrId}`);
    return { channelId: ch.id!, title: ch.snippet!.title! };
  }

  const handle = handleOrId.startsWith("@") ? handleOrId : `@${handleOrId}`;
  const res = await yt.channels.list({ part: ["snippet", "contentDetails"], forHandle: handle });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found for handle: ${handle}`);
  return { channelId: ch.id!, title: ch.snippet!.title! };
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const yt = getYouTube();
  const res = await yt.channels.list({ part: ["contentDetails"], id: [channelId] });
  const id = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!id) throw new Error("Could not find uploads playlist");
  return id;
}

async function fetchAllPlaylistItems(
  playlistId: string,
): Promise<Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }>> {
  const yt = getYouTube();
  const items: Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }> = [];
  let pageToken: string | undefined;

  do {
    const res = await yt.playlistItems.list({
      part: ["snippet"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of res.data.items ?? []) {
      const sn = item.snippet!;
      const videoId = sn.resourceId?.videoId;
      if (!videoId) continue;
      items.push({
        videoId,
        title: sn.title || "Untitled",
        description: sn.description || "",
        publishedAt: sn.publishedAt || "",
        thumbnailUrl: sn.thumbnails?.high?.url ?? sn.thumbnails?.medium?.url ?? null,
      });
    }

    pageToken = res.data.nextPageToken ?? undefined;
    console.log(`  Fetched ${items.length} playlist items...`);
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(
  videoIds: string[],
): Promise<Map<string, { durationStr: string | null; durationSecs: number | null; viewCount: number | null }>> {
  const yt = getYouTube();
  const details = new Map<string, { durationStr: string | null; durationSecs: number | null; viewCount: number | null }>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({ part: ["contentDetails", "statistics"], id: batch });

    for (const item of res.data.items ?? []) {
      const isoStr = item.contentDetails?.duration ?? "";
      const durationStr = parseDuration(isoStr);

      // Also compute raw seconds for contentType detection
      const m = isoStr.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
      let durationSecs: number | null = null;
      if (m) {
        durationSecs =
          parseInt(m[1] || "0") * 3600 +
          parseInt(m[2] || "0") * 60 +
          parseInt(m[3] || "0");
      }

      details.set(item.id!, {
        durationStr,
        durationSecs,
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      });
    }

    console.log(`  Details: ${Math.min(i + 50, videoIds.length)}/${videoIds.length}`);
  }

  return details;
}

// ── Content type detection ────────────────────────────────────────────────────

function detectContentType(durationSecs: number | null): ContentType {
  if (durationSecs === null) return ContentType.original;
  if (durationSecs <= 90) return ContentType.short;
  if (durationSecs > 3600) return ContentType.livestream;
  return ContentType.original;
}

// ── Slug dedup helper ─────────────────────────────────────────────────────────

function makeUniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Channel Sweep — ${CHANNEL_HANDLE}`);

  const { channelId, title: channelTitle } = await resolveChannel(CHANNEL_HANDLE);
  console.log(`Channel: ${channelTitle} (${channelId})`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  console.log(`Uploads playlist: ${uploadsPlaylistId}\n`);

  console.log("Fetching uploads playlist...");
  const playlistItems = await fetchAllPlaylistItems(uploadsPlaylistId);
  console.log(`Total public videos: ${playlistItems.length}\n`);

  const prisma = getPrisma();

  // Load all existing YouTube video IDs and slugs from DB
  const [existingByVideoId, existingSlugs] = await Promise.all([
    prisma.episode.findMany({
      where: { youtubeVideoId: { not: null } },
      select: { youtubeVideoId: true },
    }),
    prisma.episode.findMany({ select: { slug: true } }),
  ]);

  const existingVideoIds = new Set(existingByVideoId.map((e) => e.youtubeVideoId!));
  const takenSlugs = new Set(existingSlugs.map((e) => e.slug));
  console.log(`Existing episodes in DB: ${existingVideoIds.size}`);

  // Find new videos
  const newItems = playlistItems.filter((v) => !existingVideoIds.has(v.videoId));
  console.log(`New videos to import: ${newItems.length}\n`);

  if (!newItems.length) {
    console.log("Nothing new to import. DB is up to date.");
    await disconnect();
    return;
  }

  // Fetch details only for new videos
  console.log("Fetching video details for new videos...");
  const details = await fetchVideoDetails(newItems.map((v) => v.videoId));
  console.log("");

  // Import new videos
  let created = 0;
  let skipped = 0;
  const byContentType: Record<string, number> = {};

  for (const item of newItems) {
    const detail = details.get(item.videoId);
    const contentType = detectContentType(detail?.durationSecs ?? null);
    const baseSlug = slugify(item.title);
    const slug = makeUniqueSlug(baseSlug, takenSlugs);

    const label = `${ContentType[contentType as keyof typeof ContentType] ?? contentType}`.padEnd(10);

    try {
      await prisma.episode.create({
        data: {
          title: item.title,
          slug,
          youtubeVideoId: item.videoId,
          contentType,
          status: ContentStatus.published,
          airDate: item.publishedAt ? new Date(item.publishedAt) : null,
          duration: detail?.durationStr ?? null,
          thumbnailUrl: item.thumbnailUrl ?? null,
          summaryShort: extractSummary(item.description),
          searchText: item.title.toLowerCase(),
        },
      });
      created++;
      byContentType[contentType] = (byContentType[contentType] ?? 0) + 1;
      console.log(`  + [${label}] ${item.title.slice(0, 60)}`);
    } catch (err) {
      // Likely a slug collision from a duplicate title edge case
      const msg = err instanceof Error ? err.message : String(err);
      skipped++;
      console.log(`  ✗ SKIP ${item.videoId}: ${msg.slice(0, 80)}`);
    }
  }

  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  for (const [ct, n] of Object.entries(byContentType)) {
    console.log(`    ${ct}: ${n}`);
  }
  console.log(`  Total in DB (was): ${existingVideoIds.size}`);

  await disconnect();
}

function extractSummary(description: string): string | undefined {
  if (!description) return undefined;
  const withoutUrls = description.replace(/https?:\/\/\S+/g, "").trim();
  const candidate = withoutUrls
    .replace(/support the stream:?\s*/gi, "")
    .replace(/streaming software/gi, "")
    .replace(/support:?\s*/gi, "")
    .trim();
  if (candidate.length <= 10) return undefined;
  // Shared content-hygiene seam — keeps StreamYard/vidIQ promo boilerplate
  // out of the DB (same patterns as data-ops clean-episode-summaries).
  if (isTemplateJunk(candidate)) return undefined;
  const cleaned = cleanSummary(candidate);
  return isJunkSummary(cleaned) ? undefined : cleaned.slice(0, 500);
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
