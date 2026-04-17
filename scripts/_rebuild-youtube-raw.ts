// Rebuild scripts/scrape/data/youtube-raw.json from the DB, merging with
// the current live playlist. Use this after running fetch-youtube.ts so
// the file contains the full historical video list (incl. ones now
// private/deleted) plus fresh metadata for currently-public videos.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { getPrisma, disconnect } from './ingest/lib';

interface RawFile {
  channelId: string;
  channelTitle: string;
  fetchedAt: string;
  totalVideos: number;
  videos: Array<{
    videoId: string;
    title: string;
    description: string;
    publishedAt: string;
    duration: number | null;
    thumbnailUrl: string | null;
    viewCount: number | null;
    channelTitle: string;
  }>;
}

const OUTPUT = path.join(__dirname, 'scrape', 'data', 'youtube-raw.json');

(async () => {
  const prisma = getPrisma();
  const current: RawFile = fs.existsSync(OUTPUT)
    ? (JSON.parse(fs.readFileSync(OUTPUT, 'utf-8')) as RawFile)
    : {
        channelId: 'UCWw3dB8Fj_wsG4YFMMznqyw',
        channelTitle: 'Cult of Psyche',
        fetchedAt: new Date().toISOString(),
        totalVideos: 0,
        videos: [],
      };

  const byId = new Map(current.videos.map((v) => [v.videoId, v]));
  console.log(`Loaded ${byId.size} from current youtube-raw.json`);

  const dbEpisodes = await prisma.episode.findMany({
    where: { youtubeVideoId: { not: null } },
    select: {
      youtubeVideoId: true,
      title: true,
      airDate: true,
      duration: true,
      thumbnailUrl: true,
    },
  });
  console.log(`Loaded ${dbEpisodes.length} episodes from DB`);

  let added = 0;
  for (const ep of dbEpisodes) {
    const id = ep.youtubeVideoId!;
    if (byId.has(id)) continue;
    // duration is stored as ISO8601 string (e.g. "PT1H2M3S") — keep as null
    // in raw file since the schema expects number | null and we don't want
    // to mis-parse. Fresh runs of fetch-youtube.ts will repopulate these
    // from the YouTube API if the video becomes public again.
    byId.set(id, {
      videoId: id,
      title: ep.title,
      description: '',
      publishedAt: (ep.airDate ?? new Date()).toISOString(),
      duration: null,
      thumbnailUrl: ep.thumbnailUrl ?? null,
      viewCount: null,
      channelTitle: current.channelTitle,
    });
    added++;
  }

  const merged = Array.from(byId.values()).sort((a, b) =>
    a.publishedAt.localeCompare(b.publishedAt),
  );

  const output: RawFile = {
    channelId: current.channelId,
    channelTitle: current.channelTitle,
    fetchedAt: new Date().toISOString(),
    totalVideos: merged.length,
    videos: merged,
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2));
  console.log(`Added ${added} missing videos from DB`);
  console.log(`Final total: ${merged.length}`);

  await disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
