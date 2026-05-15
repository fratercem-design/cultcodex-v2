// Fix bad duration strings on the 16 PsychesNightmares episodes that
// were ingested with "PTNaNHNaNMNaNS" because the prep script treated
// the raw-file `duration` field as seconds when it's actually already a
// "H:MM:SS" string. Re-reads the raw file and updates each episode.
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { getPrisma, disconnect } from './ingest/lib';

const RAW = path.join(
  __dirname,
  'scrape',
  'data',
  'youtube-raw-psychesnightmares.json',
);

(async () => {
  const raw = JSON.parse(fs.readFileSync(RAW, 'utf-8')) as {
    videos: Array<{ videoId: string; duration: string | null }>;
  };
  const byId = new Map(raw.videos.map((v) => [v.videoId, v.duration]));

  const prisma = getPrisma();
  const bad = await prisma.episode.findMany({
    where: { duration: { contains: 'NaN' } },
    select: { id: true, slug: true, youtubeVideoId: true, title: true },
  });
  console.log(`Found ${bad.length} episodes with NaN duration`);

  let fixed = 0;
  for (const ep of bad) {
    if (!ep.youtubeVideoId) continue;
    const dur = byId.get(ep.youtubeVideoId);
    await prisma.episode.update({
      where: { id: ep.id },
      data: { duration: dur ?? null },
    });
    console.log(`  EP ${ep.slug}: duration -> ${dur ?? 'null'}`);
    fixed++;
  }
  console.log(`\nFixed ${fixed} episodes`);

  await disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
