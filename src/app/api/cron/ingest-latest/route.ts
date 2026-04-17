/**
 * Daily cron: poll @CultofPsyche and @PsychesNightmares for new uploads
 * and insert any not-yet-seen videos as Episode rows.
 *
 * - Auth: Bearer CRON_SECRET (Vercel Cron sets Authorization header
 *   automatically when CRON_SECRET env var exists; manual callers need
 *   to send it themselves).
 * - Runtime: Node.js (googleapis requires Node, not Edge).
 * - Strategy: fetch only the most-recent page of each channel's uploads
 *   playlist (50 videos per channel). More than enough to catch a day's
 *   worth of new streams even on a heavy upload day.
 * - Idempotent: skips videos whose youtubeVideoId already exists in DB.
 */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────
// Channels to poll. Add more here later if needed.
// ──────────────────────────────────────────────────────
const CHANNEL_HANDLES = ["@CultofPsyche", "@PsychesNightmares"] as const;

// ──────────────────────────────────────────────────────
// Helpers (self-contained, no filesystem or dotenv)
// ──────────────────────────────────────────────────────
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
  const cleaned = description
    .replace(/https?:\/\/\S+/g, "")
    .replace(/support the stream:?\s*/gi, "")
    .replace(/streaming software/gi, "")
    .replace(/support:?\s*/gi, "")
    .trim();
  return cleaned.length > 10 ? cleaned.slice(0, 500) : null;
}

interface FetchedVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  duration: string | null;
  thumbnailUrl: string | null;
  channelTitle: string;
}

async function fetchRecentUploads(
  yt: ReturnType<typeof google.youtube>,
  handle: string,
  maxResults = 50,
): Promise<FetchedVideo[]> {
  // Resolve channel
  const channelRes = await yt.channels.list({
    part: ["snippet", "contentDetails"],
    forHandle: handle.startsWith("@") ? handle : `@${handle}`,
  });
  const channel = channelRes.data.items?.[0];
  if (!channel) {
    throw new Error(`Channel not found for handle: ${handle}`);
  }
  const title = channel.snippet!.title!;
  const uploads = channel.contentDetails!.relatedPlaylists!.uploads!;

  // Grab most recent N items from the uploads playlist.
  // Playlist items come in reverse-chronological order.
  const playlistRes = await yt.playlistItems.list({
    part: ["snippet"],
    playlistId: uploads,
    maxResults,
  });
  const items = (playlistRes.data.items || []).flatMap((item) => {
    const s = item.snippet;
    const vid = s?.resourceId?.videoId;
    if (!s || !vid) return [];
    return [
      {
        videoId: vid,
        title: s.title || "",
        description: s.description || "",
        publishedAt: s.publishedAt || new Date().toISOString(),
        thumbnailUrl:
          s.thumbnails?.maxres?.url ||
          s.thumbnails?.high?.url ||
          s.thumbnails?.default?.url ||
          null,
      },
    ];
  });

  if (items.length === 0) return [];

  // Fetch durations in one call
  const detailRes = await yt.videos.list({
    part: ["contentDetails"],
    id: items.map((i) => i.videoId),
  });
  const durationById = new Map<string, string | null>();
  for (const v of detailRes.data.items || []) {
    durationById.set(
      v.id!,
      parseIsoDurationToDisplay(v.contentDetails?.duration || ""),
    );
  }

  return items.map((i) => ({
    ...i,
    duration: durationById.get(i.videoId) ?? null,
    channelTitle: title,
  }));
}

// ──────────────────────────────────────────────────────
// POST/GET handler
// ──────────────────────────────────────────────────────
async function handle(req: NextRequest) {
  // Auth
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  if (auth !== expected) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  // YouTube client
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "YOUTUBE_API_KEY not configured" },
      { status: 500 },
    );
  }
  const yt = google.youtube({ version: "v3", auth: apiKey });

  const started = Date.now();
  const perChannel: Record<
    string,
    { fetched: number; newCount: number; titles: string[] }
  > = {};

  // Seed the set of known videoIds once so we don't re-query per video
  const existingVideoIds = new Set<string>(
    (
      await prisma.episode.findMany({
        where: { youtubeVideoId: { not: null } },
        select: { youtubeVideoId: true },
      })
    ).map((e) => e.youtubeVideoId!),
  );

  // Track max episode number; increments as we create
  const maxEpAgg = await prisma.episode.aggregate({
    _max: { episodeNumber: true },
  });
  let nextEpNum = (maxEpAgg._max.episodeNumber ?? 0) + 1;

  // Track existing slugs for collision avoidance
  const existingSlugs = new Set<string>(
    (await prisma.episode.findMany({ select: { slug: true } })).map(
      (e) => e.slug,
    ),
  );

  for (const handle of CHANNEL_HANDLES) {
    const summary = { fetched: 0, newCount: 0, titles: [] as string[] };
    try {
      const videos = await fetchRecentUploads(yt, handle, 50);
      summary.fetched = videos.length;
      // Oldest first so episode numbers go in chronological order
      const newVideos = videos
        .filter((v) => !existingVideoIds.has(v.videoId))
        .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

      for (const v of newVideos) {
        let slug = slugify(v.title);
        let n = 2;
        const base = slug;
        while (existingSlugs.has(slug)) {
          slug = `${base}-${n++}`;
        }
        existingSlugs.add(slug);

        const summaryShort = extractSummary(v.description);
        const searchText = buildSearchText(v.title, summaryShort);

        await prisma.episode.create({
          data: {
            title: v.title,
            slug,
            episodeNumber: nextEpNum++,
            airDate: new Date(v.publishedAt),
            duration: v.duration,
            youtubeVideoId: v.videoId,
            thumbnailUrl: v.thumbnailUrl,
            summaryShort,
            searchText,
            status: ContentStatus.published,
          },
        });

        existingVideoIds.add(v.videoId);
        summary.newCount++;
        summary.titles.push(`[${v.publishedAt.split("T")[0]}] ${v.title}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          ok: false,
          error: `Failed on ${handle}: ${msg}`,
          perChannel,
        },
        { status: 500 },
      );
    }
    perChannel[handle] = summary;
  }

  const elapsed = Date.now() - started;
  const totalNew = Object.values(perChannel).reduce(
    (acc, s) => acc + s.newCount,
    0,
  );

  return NextResponse.json({
    ok: true,
    totalNew,
    elapsedMs: elapsed,
    perChannel,
  });
}

export { handle as GET, handle as POST };
