// Prepare the 16 new @PsychesNightmares videos for ingestion.
// Reads youtube-raw-psychesnightmares.json, filters to videos not yet in
// the DB by youtubeVideoId, assigns fresh episode numbers starting from
// (maxExistingEpisodeNumber + 1), and writes an EpisodeRow[] JSON file
// for import-episodes.ts to consume.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { getPrisma, disconnect } from './ingest/lib';

interface Video {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  duration: number | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  channelTitle: string;
}

const RAW = path.join(
  __dirname,
  'scrape',
  'data',
  'youtube-raw-psychesnightmares.json',
);
const OUT = path.join(__dirname, 'ingest', 'data', 'new-nightmares.json');

function isoDurationFromSeconds(sec: number | null): string | undefined {
  if (sec == null || Number.isNaN(sec) || sec === 0) return undefined;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  let out = 'PT';
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

function extractSummary(description: string): string | undefined {
  if (!description) return undefined;
  const withoutUrls = description.replace(/https?:\/\/\S+/g, '').trim();
  const cleaned = withoutUrls
    .replace(/support the stream:?\s*/gi, '')
    .replace(/streaming software/gi, '')
    .replace(/support:?\s*/gi, '')
    .trim();
  return cleaned.length > 10 ? cleaned.slice(0, 500) : undefined;
}

(async () => {
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf-8')) as {
    channelTitle: string;
    videos: Video[];
  };

  const prisma = getPrisma();
  const dbVids = new Set(
    (
      await prisma.episode.findMany({
        where: { youtubeVideoId: { not: null } },
        select: { youtubeVideoId: true },
      })
    ).map((e) => e.youtubeVideoId!),
  );

  // Find max episode number
  const maxEp = await prisma.episode.aggregate({
    _max: { episodeNumber: true },
  });
  let nextNum = (maxEp._max.episodeNumber ?? 0) + 1;
  console.log(`Max existing episodeNumber: ${maxEp._max.episodeNumber}`);
  console.log(`New episodes will start at: ${nextNum}\n`);

  const newVideos = raw.videos
    .filter((v) => !dbVids.has(v.videoId))
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt)); // oldest first

  const rows = newVideos.map((v) => ({
    title: v.title,
    episodeNumber: nextNum++,
    airDate: v.publishedAt,
    duration: isoDurationFromSeconds(v.duration),
    youtubeVideoId: v.videoId,
    thumbnailUrl:
      v.thumbnailUrl && /^https?:\/\//.test(v.thumbnailUrl)
        ? v.thumbnailUrl
        : undefined,
    summaryShort: extractSummary(v.description),
    guests: [] as string[],
    topics: [] as string[],
    lore: [] as string[],
  }));

  if (!fs.existsSync(path.dirname(OUT)))
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));

  console.log(`Wrote ${rows.length} new episode rows to ${OUT}\n`);
  rows.forEach((r) =>
    console.log(`  EP.${r.episodeNumber} ${r.airDate.split('T')[0]}: ${r.title}`),
  );

  await disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
