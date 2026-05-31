import { google } from "googleapis";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 120; // re-check live status every 2 min

export const metadata: Metadata = {
  title: "Alexandra Mayers — CultCodex",
  description: "Latest videos and live streams from Alexandra Mayers across IRL Newstime, IP2WikiInfo, and @AlexandraMayers.",
  alternates: { canonical: "/irl-newstime" },
};

const CHANNELS = [
  { handle: "@IRLnewsTime",     label: "IRL Newstime"    },
  { handle: "@ip2wikiinfo",     label: "IP2Wiki"          },
  { handle: "@alexandramayers", label: "Alexandra Mayers" },
];

/** One colour per channel — extend as channels are added */
const CHANNEL_COLORS = [
  "text-accent-gold",
  "text-accent-cyan",
  "text-accent-violet",
] as const;

interface VideoItem {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelTitle: string;
  channelHandle: string;
  isLive: boolean;
  viewCount?: string;
  duration?: string;
}

async function fetchChannelVideos(
  yt: ReturnType<typeof google.youtube>,
  handle: string,
  label: string,
): Promise<VideoItem[]> {
  // 1. Resolve handle → channelId + uploadsPlaylistId
  const chanRes = await yt.channels.list({
    part: ["contentDetails", "snippet"],
    forHandle: handle,
    maxResults: 1,
  });
  const channel = chanRes.data.items?.[0];
  if (!channel) return [];
  const channelId = channel.id!;
  const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) return [];

  // 2. Fetch up to 20 recent uploads
  const plRes = await yt.playlistItems.list({
    part: ["snippet"],
    playlistId: uploadsId,
    maxResults: 20,
  });
  const videoIds = (plRes.data.items ?? [])
    .map((i) => i.snippet?.resourceId?.videoId)
    .filter(Boolean) as string[];

  if (videoIds.length === 0) return [];

  // 3. Batch-fetch stats + liveStreamingDetails
  const vidRes = await yt.videos.list({
    part: ["snippet", "statistics", "liveStreamingDetails", "contentDetails"],
    id: videoIds,
  });

  // 4. Check for active live streams via search
  const liveSearch = await yt.search.list({
    part: ["id"],
    channelId,
    eventType: "live",
    type: ["video"],
    maxResults: 5,
  }).catch(() => ({ data: { items: [] } }));
  const liveIds = new Set(
    (liveSearch.data.items ?? []).map((i) => i.id?.videoId).filter(Boolean) as string[]
  );

  return (vidRes.data.items ?? []).map((v) => {
    const snippet = v.snippet!;
    const thumb =
      snippet.thumbnails?.maxres?.url ??
      snippet.thumbnails?.high?.url ??
      snippet.thumbnails?.medium?.url ??
      "";
    return {
      videoId: v.id!,
      title: snippet.title ?? "",
      thumbnailUrl: thumb,
      publishedAt: snippet.publishedAt ?? "",
      channelTitle: label,
      channelHandle: handle,
      isLive: liveIds.has(v.id!) || snippet.liveBroadcastContent === "live",
      viewCount: v.statistics?.viewCount ?? undefined,
      duration: v.contentDetails?.duration ?? undefined,
    };
  });
}

function formatViews(n?: string): string | null {
  if (!n) return null;
  const num = parseInt(n, 10);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K views`;
  return `${num} views`;
}

function formatDuration(iso?: string): string | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const h = parseInt(m[1] || "0", 10);
  const min = parseInt(m[2] || "0", 10);
  const s = parseInt(m[3] || "0", 10);
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${min}:${String(s).padStart(2, "0")}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 6) return `${Math.floor(days / 7)}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

export default async function IRLNewstimePage() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return (
      <main className="p-8">
        <p className="font-mono text-sm text-red-400">YOUTUBE_API_KEY not configured.</p>
      </main>
    );
  }

  const yt = google.youtube({ version: "v3", auth: apiKey });

  // Fetch all channels in parallel; failures don't block the others
  const results = await Promise.allSettled(
    CHANNELS.map((ch) => fetchChannelVideos(yt, ch.handle, ch.label))
  );
  const channelVideos = results.map((r) => (r.status === "fulfilled" ? r.value : []));

  // Flatten with channel index for colour coding
  const allVideos = channelVideos.flatMap((videos, idx) =>
    videos.map((v) => ({ ...v, channelIdx: idx }))
  );

  // Live streams first, then sorted by date
  allVideos.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const liveCount = allVideos.filter((v) => v.isLive).length;

  return (
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">{"/// alexandra_mayers"}</p>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">Alexandra Mayers</h1>
          {liveCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-red-600/90 px-3 py-1 font-mono text-[10px] font-bold text-white animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {liveCount} LIVE
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-xs text-text-muted">
          {CHANNELS.map((ch) => (
            <a
              key={ch.handle}
              href={`https://www.youtube.com/${ch.handle}/videos`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent-gold transition-colors"
            >
              ↗ {ch.label}
            </a>
          ))}
        </div>
      </div>

      {allVideos.length === 0 && (
        <p className="font-mono text-sm text-text-muted">No videos found. Check YOUTUBE_API_KEY and channel handles.</p>
      )}

      {/* Channel legend */}
      <div className="flex flex-wrap gap-3">
        {CHANNELS.map((ch, i) => (
          <span key={ch.handle} className="rounded border border-border bg-surface px-3 py-1 font-mono text-[10px] text-text-muted">
            <span className={CHANNEL_COLORS[i] ?? "text-text-muted"}>{ch.label}</span>
            {" · "}{channelVideos[i].length} videos
          </span>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allVideos.map((v) => {
          const dur = formatDuration(v.duration);
          const views = formatViews(v.viewCount);
          const channelColor = CHANNEL_COLORS[v.channelIdx] ?? "text-text-muted";
          return (
            <a
              key={v.videoId}
              href={`https://www.youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-border bg-surface overflow-hidden hover:border-accent-gold/40 transition-colors"
            >
              {/* Thumbnail */}
              <div className="relative w-full overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                {v.thumbnailUrl ? (
                  <Image
                    src={v.thumbnailUrl}
                    alt={v.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:opacity-90 transition-opacity"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/10 to-void" />
                )}
                {v.isLive && (
                  <span className="absolute top-2 left-2 flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 font-mono text-[9px] font-bold text-white uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </span>
                )}
                {dur && !v.isLive && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-white">
                    {dur}
                  </span>
                )}
              </div>
              {/* Info */}
              <div className="p-3 space-y-1 flex-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider">
                  <span className={channelColor}>{v.channelTitle}</span>
                </p>
                <p className="text-xs font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-accent-gold transition-colors">
                  {v.title}
                </p>
                <div className="flex items-center gap-2 font-mono text-[9px] text-text-muted">
                  {views && <span>{views}</span>}
                  {!v.isLive && v.publishedAt && (
                    <span>{timeAgo(v.publishedAt)}</span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>

    </main>
  );
}
