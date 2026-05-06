/**
 * Sync a YouTube channel's videos to the PersonMedia table.
 *
 * Usage:
 *   YOUTUBE_API_KEY=... DATABASE_URL=... \
 *   PERSON_SLUG=alexandra-mayers \
 *   YOUTUBE_CHANNEL_HANDLE=@irlnewstime \
 *   npx tsx scripts/sync-person-youtube.ts
 *
 * Runs idempotently: upserts by (source, sourceId).
 */
import "dotenv/config";
import { getYouTube, parseDuration } from "./scrape/lib";
import { getPrisma, disconnect } from "./ingest/lib";

const PERSON_SLUG = process.env.PERSON_SLUG ?? "alexandra-mayers";
const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE ?? "@irlnewstime";

async function resolveChannelUploadsPlaylist(handleOrId: string): Promise<{
  channelId: string;
  channelTitle: string;
  uploadsPlaylistId: string;
}> {
  const yt = getYouTube();

  let channelId: string;
  let channelTitle: string;

  if (handleOrId.startsWith("UC")) {
    const res = await yt.channels.list({ part: ["snippet", "contentDetails"], id: [handleOrId] });
    const ch = res.data.items?.[0];
    if (!ch) throw new Error(`Channel not found: ${handleOrId}`);
    channelId = ch.id!;
    channelTitle = ch.snippet!.title!;
    const uploadsPlaylistId = ch.contentDetails!.relatedPlaylists!.uploads!;
    return { channelId, channelTitle, uploadsPlaylistId };
  }

  const handle = handleOrId.startsWith("@") ? handleOrId : `@${handleOrId}`;
  const res = await yt.channels.list({ part: ["snippet", "contentDetails"], forHandle: handle });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found: ${handle}`);
  channelId = ch.id!;
  channelTitle = ch.snippet!.title!;
  const uploadsPlaylistId = ch.contentDetails!.relatedPlaylists!.uploads!;
  return { channelId, channelTitle, uploadsPlaylistId };
}

async function fetchPlaylistItems(playlistId: string) {
  const yt = getYouTube();
  const items: Array<{
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string | null;
  }> = [];
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
        title: sn.title ?? "Untitled",
        description: sn.description ?? "",
        publishedAt: sn.publishedAt ?? "",
        thumbnailUrl:
          sn.thumbnails?.maxres?.url ??
          sn.thumbnails?.high?.url ??
          sn.thumbnails?.medium?.url ??
          null,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
    console.log(`  Fetched ${items.length} videos...`);
  } while (pageToken);

  return items;
}

async function fetchVideoDetails(videoIds: string[]) {
  const yt = getYouTube();
  const map = new Map<string, { durationStr: string | null; viewCount: number | null }>();

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({ part: ["contentDetails", "statistics"], id: batch });
    for (const item of res.data.items ?? []) {
      map.set(item.id!, {
        durationStr: parseDuration(item.contentDetails?.duration ?? ""),
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount, 10) : null,
      });
    }
  }

  return map;
}

async function main() {
  console.log(`Syncing ${CHANNEL_HANDLE} → PersonMedia[${PERSON_SLUG}]`);

  const { channelTitle, uploadsPlaylistId } = await resolveChannelUploadsPlaylist(CHANNEL_HANDLE);
  console.log(`Channel: ${channelTitle}`);
  console.log(`Playlist: ${uploadsPlaylistId}\n`);

  console.log("Fetching playlist...");
  const items = await fetchPlaylistItems(uploadsPlaylistId);
  console.log(`Total videos: ${items.length}\n`);

  console.log("Fetching video details...");
  const details = await fetchVideoDetails(items.map((i) => i.videoId));

  const prisma = getPrisma();
  let upserted = 0;

  for (const item of items) {
    const detail = details.get(item.videoId);
    const videoUrl = `https://www.youtube.com/watch?v=${item.videoId}`;

    await prisma.personMedia.upsert({
      where: { source_sourceId: { source: "youtube", sourceId: item.videoId } },
      create: {
        personSlug: PERSON_SLUG,
        source: "youtube",
        sourceId: item.videoId,
        sourceUrl: videoUrl,
        title: item.title,
        description: item.description?.slice(0, 2000) ?? null,
        thumbnailUrl: item.thumbnailUrl,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        durationStr: detail?.durationStr ?? null,
        viewCount: detail?.viewCount ?? null,
        channelHandle: CHANNEL_HANDLE,
      },
      update: {
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        durationStr: detail?.durationStr ?? null,
        viewCount: detail?.viewCount ?? null,
        channelHandle: CHANNEL_HANDLE,
      },
    });

    upserted++;
    if (upserted % 25 === 0) console.log(`  Upserted ${upserted}/${items.length}...`);
  }

  console.log(`\n── Summary ──────────────────────────────────────────`);
  console.log(`  Upserted: ${upserted} videos`);
  console.log(`  Channel: ${CHANNEL_HANDLE} (${channelTitle})`);
  console.log(`  Person: ${PERSON_SLUG}`);

  await disconnect();
}

main().catch((e) => {
  console.error("Fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
