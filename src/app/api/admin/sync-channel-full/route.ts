/**
 * POST /api/admin/sync-channel-full
 *
 * Full historical sweep of one or both YouTube channels.
 * Paginates through the entire uploads playlist — safe to re-run,
 * only inserts episodes whose youtubeVideoId is not already in the DB.
 *
 * Body: { channels?: string[] }
 *   channels defaults to ["@CultofPsyche", "@PsychesNightmares"]
 *
 * Requires YOUTUBE_API_KEY env var.
 * Admin-only.
 */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ContentStatus, ContentType } from "@/generated/prisma/client";
import { cleanSummary, isJunkSummary, isTemplateJunk } from "@/lib/content-hygiene";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DEFAULT_CHANNELS = ["@CultofPsyche", "@PsychesNightmares", "@NightmareFrequenciesTV"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function parseIsoDuration(iso: string): { display: string | null; seconds: number | null } {
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return { display: null, seconds: null };
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  const seconds = h * 3600 + min * 60 + s;
  const display = h > 0
    ? `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${min}:${String(s).padStart(2, "0")}`;
  return { display, seconds };
}

function detectContentType(seconds: number | null): ContentType {
  if (seconds === null) return ContentType.original;
  if (seconds <= 90) return ContentType.short;
  if (seconds > 3600) return ContentType.livestream;
  return ContentType.original;
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
  // Shared content-hygiene seam — keeps StreamYard/vidIQ promo boilerplate
  // out of the DB (same patterns as data-ops clean-episode-summaries).
  if (isTemplateJunk(candidate)) return null;
  const cleaned = cleanSummary(candidate);
  return isJunkSummary(cleaned) ? null : cleaned.slice(0, 500);
}

interface PlaylistItem {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string | null;
}

async function fetchAllUploads(
  yt: ReturnType<typeof google.youtube>,
  handle: string,
): Promise<PlaylistItem[]> {
  const channelRes = await yt.channels.list({
    part: ["contentDetails", "snippet"],
    forHandle: handle.startsWith("@") ? handle : `@${handle}`,
  });
  const channel = channelRes.data.items?.[0];
  if (!channel) throw new Error(`Channel not found: ${handle}`);
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error(`No uploads playlist for: ${handle}`);

  const items: PlaylistItem[] = [];
  let pageToken: string | undefined;

  do {
    const res = await yt.playlistItems.list({
      part: ["snippet"],
      playlistId: uploadsPlaylistId,
      maxResults: 50,
      pageToken,
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
        thumbnailUrl: sn.thumbnails?.high?.url ?? sn.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(
  yt: ReturnType<typeof google.youtube>,
  videoIds: string[],
): Promise<Map<string, { display: string | null; seconds: number | null }>> {
  const map = new Map<string, { display: string | null; seconds: number | null }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({ part: ["contentDetails"], id: batch });
    for (const v of res.data.items ?? []) {
      map.set(v.id!, parseIsoDuration(v.contentDetails?.duration ?? ""));
    }
  }
  return map;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { channels?: string[] };
  const channels = body.channels ?? DEFAULT_CHANNELS;

  const yt = google.youtube({ version: "v3", auth: apiKey });

  // Pre-load existing video IDs and slugs
  const [existingRows, existingSlugRows] = await Promise.all([
    prisma.episode.findMany({
      where: { youtubeVideoId: { not: null } },
      select: { youtubeVideoId: true },
    }),
    prisma.episode.findMany({ select: { slug: true } }),
  ]);
  const existingVideoIds = new Set(existingRows.map((e) => e.youtubeVideoId!));
  const takenSlugs = new Set(existingSlugRows.map((e) => e.slug));

  const results: Record<string, { fetched: number; created: number; skipped: number }> = {};
  let totalCreated = 0;

  for (const handle of channels) {
    let fetched = 0;
    let created = 0;
    let skipped = 0;

    try {
      const allItems = await fetchAllUploads(yt, handle);
      fetched = allItems.length;

      const newItems = allItems.filter((v) => !existingVideoIds.has(v.videoId));
      skipped = allItems.length - newItems.length;

      if (newItems.length > 0) {
        const detailMap = await fetchVideoDetails(yt, newItems.map((v) => v.videoId));

        for (const item of newItems.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))) {
          const detail = detailMap.get(item.videoId) ?? { display: null, seconds: null };
          const contentType = detectContentType(detail.seconds);

          let slug = slugify(item.title);
          let n = 2;
          const base = slug;
          while (takenSlugs.has(slug)) slug = `${base}-${n++}`;
          takenSlugs.add(slug);

          try {
            await prisma.episode.create({
              data: {
                title: item.title,
                slug,
                youtubeVideoId: item.videoId,
                contentType,
                status: ContentStatus.published,
                airDate: item.publishedAt ? new Date(item.publishedAt) : null,
                duration: detail.display,
                thumbnailUrl: item.thumbnailUrl,
                summaryShort: extractSummary(item.description),
                searchText: item.title.toLowerCase(),
              },
            });
            existingVideoIds.add(item.videoId);
            created++;
            totalCreated++;
          } catch {
            // slug collision edge case — skip
            skipped++;
          }
        }
      }
    } catch (err) {
      results[handle] = { fetched, created, skipped };
      return NextResponse.json(
        { ok: false, error: `Failed on ${handle}: ${err instanceof Error ? err.message : String(err)}`, results },
        { status: 500 },
      );
    }

    results[handle] = { fetched, created, skipped };
  }

  return NextResponse.json({ ok: true, totalCreated, results });
}
