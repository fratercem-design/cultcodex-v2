// One-off: fetch @PsychesNightmares channel and report which videos
// are not yet in the DB. Does NOT modify youtube-raw.json — that file
// is owned by the primary channel (@CultofPsyche). Writes a separate
// raw file for the secondary channel.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { getYouTube, parseDuration } from './scrape/lib';
import { getPrisma, disconnect } from './ingest/lib';

const OUTPUT = path.join(
  __dirname,
  'scrape',
  'data',
  'youtube-raw-psychesnightmares.json',
);

async function getChannelId(handle: string) {
  const yt = getYouTube();
  const res = await yt.channels.list({
    part: ['snippet', 'contentDetails'],
    forHandle: handle,
  });
  const ch = res.data.items?.[0];
  if (!ch) throw new Error(`Channel not found for handle: ${handle}`);
  return {
    channelId: ch.id!,
    title: ch.snippet!.title!,
    uploads: ch.contentDetails!.relatedPlaylists!.uploads!,
  };
}

async function fetchPlaylist(playlistId: string) {
  const yt = getYouTube();
  const items: Array<{
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string | null;
  }> = [];
  let pageToken: string | undefined = undefined;
  do {
    const res = await yt.playlistItems.list({
      part: ['snippet'],
      playlistId,
      maxResults: 50,
      pageToken,
    });
    for (const item of res.data.items || []) {
      const s = item.snippet!;
      const vid = s.resourceId?.videoId;
      if (!vid) continue;
      items.push({
        videoId: vid,
        title: s.title || '',
        description: s.description || '',
        publishedAt: s.publishedAt || new Date().toISOString(),
        thumbnailUrl:
          s.thumbnails?.maxres?.url ||
          s.thumbnails?.high?.url ||
          s.thumbnails?.default?.url ||
          null,
      });
    }
    pageToken = res.data.nextPageToken || undefined;
    console.log(`  Fetched ${items.length} playlist items...`);
  } while (pageToken);
  return items;
}

async function fetchDetails(videoIds: string[]) {
  const yt = getYouTube();
  const details = new Map<string, { duration: number | null; viewCount: number | null }>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const res = await yt.videos.list({
      part: ['contentDetails', 'statistics'],
      id: batch,
    });
    for (const item of res.data.items || []) {
      details.set(item.id!, {
        duration: parseDuration(item.contentDetails?.duration || ''),
        viewCount: item.statistics?.viewCount
          ? parseInt(item.statistics.viewCount, 10)
          : null,
      });
    }
  }
  return details;
}

(async () => {
  const handle = '@PsychesNightmares';
  console.log(`Resolving ${handle}...`);
  const { channelId, title, uploads } = await getChannelId(handle);
  console.log(`Channel: ${title} (${channelId})`);
  console.log(`Uploads playlist: ${uploads}\n`);

  console.log('Fetching playlist items...');
  const items = await fetchPlaylist(uploads);

  console.log(`\nFetching video details for ${items.length} videos...`);
  const details = await fetchDetails(items.map((i) => i.videoId));

  const videos = items.map((i) => {
    const d = details.get(i.videoId);
    return {
      videoId: i.videoId,
      title: i.title,
      description: i.description,
      publishedAt: i.publishedAt,
      duration: d?.duration || null,
      thumbnailUrl: i.thumbnailUrl,
      viewCount: d?.viewCount || null,
      channelTitle: title,
    };
  });

  const output = {
    channelId,
    channelTitle: title,
    fetchedAt: new Date().toISOString(),
    totalVideos: videos.length,
    videos: videos.sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)),
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`\nSaved ${videos.length} videos to ${OUTPUT}`);

  // Cross-reference with DB
  console.log('\nCross-referencing with DB...');
  const prisma = getPrisma();
  const dbIds = new Set(
    (
      await prisma.episode.findMany({
        where: { youtubeVideoId: { not: null } },
        select: { youtubeVideoId: true },
      })
    ).map((e) => e.youtubeVideoId!),
  );
  const newVideos = videos.filter((v) => !dbIds.has(v.videoId));
  console.log(`Total on PsychesNightmares: ${videos.length}`);
  console.log(`Already in DB: ${videos.length - newVideos.length}`);
  console.log(`NEW (not yet ingested): ${newVideos.length}\n`);

  newVideos
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 50)
    .forEach((v) => {
      const mins = v.duration ? Math.round(v.duration / 60) : '?';
      console.log(
        `  [${v.publishedAt.split('T')[0]}] ${v.videoId} (${mins}m): ${v.title}`,
      );
    });
  if (newVideos.length > 50) {
    console.log(`  ... and ${newVideos.length - 50} more`);
  }

  await disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
