import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getYouTube, parseDuration } from "./lib";
import type { YouTubeVideo, YouTubeRaw } from "./types";

const DATA_DIR = join(__dirname, "data");
const OUTPUT_FILE = join(DATA_DIR, "youtube-raw.json");

async function getChannelId(handleOrId: string): Promise<{ channelId: string; title: string }> {
  const yt = getYouTube();

  // If it starts with UC, assume it's already a channel ID
  if (handleOrId.startsWith("UC")) {
    const res = await yt.channels.list({
      part: ["snippet"],
      id: [handleOrId],
    });
    const ch = res.data.items?.[0];
    if (!ch) throw new Error(`Channel not found: ${handleOrId}`);
    return { channelId: ch.id!, title: ch.snippet!.title! };
  }

  // Otherwise resolve handle (e.g., @CultofPsyche)
  const handle = handleOrId.startsWith("@") ? handleOrId : `@${handleOrId}`;
  const res = await yt.channels.list({
    part: ["snippet", "contentDetails"],
    forHandle: handle,
  });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found for handle: ${handle}`);
  return { channelId: ch.id!, title: ch.snippet!.title! };
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const yt = getYouTube();
  const res = await yt.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });
  const playlistId = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error("Could not find uploads playlist");
  return playlistId;
}

async function fetchAllPlaylistItems(playlistId: string): Promise<Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }>> {
  const yt = getYouTube();
  const items: Array<{ videoId: string; title: string; description: string; publishedAt: string; thumbnailUrl: string | null }> = [];
  let pageToken: string | undefined = undefined;

  do {
    const res = await yt.playlistItems.list({
      part: ["snippet"],
      playlistId,
      maxResults: 50,
      pageToken,
    });

    for (const item of res.data.items || []) {
      const snippet = item.snippet!;
      const videoId = snippet.resourceId?.videoId;
      if (!videoId) continue;

      items.push({
        videoId,
        title: snippet.title || "Untitled",
        description: snippet.description || "",
        publishedAt: snippet.publishedAt || "",
        thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || null,
      });
    }

    pageToken = res.data.nextPageToken || undefined;
    console.log(`  Fetched ${items.length} playlist items...`);
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(videoIds: string[]): Promise<Map<string, { duration: string | null; viewCount: number | null }>> {
  const yt = getYouTube();
  const details = new Map<string, { duration: string | null; viewCount: number | null }>();

  // YouTube API allows max 50 IDs per request
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({
      part: ["contentDetails", "statistics"],
      id: batch,
    });

    for (const item of res.data.items || []) {
      details.set(item.id!, {
        duration: parseDuration(item.contentDetails?.duration || ""),
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      });
    }

    console.log(`  Fetched details for ${Math.min(i + 50, videoIds.length)}/${videoIds.length} videos...`);
  }

  return details;
}

async function main() {
  const handle = process.env.YOUTUBE_CHANNEL_HANDLE || "@CultofPsyche";
  console.log(`Resolving channel: ${handle}`);

  const { channelId, title: channelTitle } = await getChannelId(handle);
  console.log(`Channel: ${channelTitle} (${channelId})`);

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  console.log(`Uploads playlist: ${uploadsPlaylistId}`);

  // Load existing data for merge
  let existing = new Map<string, YouTubeVideo>();
  if (existsSync(OUTPUT_FILE)) {
    const prev: YouTubeRaw = JSON.parse(readFileSync(OUTPUT_FILE, "utf-8"));
    for (const v of prev.videos) {
      existing.set(v.videoId, v);
    }
    console.log(`Loaded ${existing.size} existing videos for merge`);
  }

  // Fetch all playlist items
  console.log("\nFetching playlist items...");
  const playlistItems = await fetchAllPlaylistItems(uploadsPlaylistId);

  // Fetch video details (duration, view count)
  console.log("\nFetching video details...");
  const videoIds = playlistItems.map((i) => i.videoId);
  const details = await fetchVideoDetails(videoIds);

  // Merge into video list
  const videos: YouTubeVideo[] = playlistItems.map((item) => {
    const detail = details.get(item.videoId);
    return {
      videoId: item.videoId,
      title: item.title,
      description: item.description,
      publishedAt: item.publishedAt,
      duration: detail?.duration || null,
      thumbnailUrl: item.thumbnailUrl,
      viewCount: detail?.viewCount || null,
      channelTitle,
    };
  });

  // Sort chronologically (oldest first)
  videos.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  // Write output
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const output: YouTubeRaw = {
    channelId,
    channelTitle,
    fetchedAt: new Date().toISOString(),
    totalVideos: videos.length,
    videos,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nDone! ${videos.length} videos saved to ${OUTPUT_FILE}`);
}

main().catch((e) => {
  console.error("Error:", e.message || e);
  process.exit(1);
});
