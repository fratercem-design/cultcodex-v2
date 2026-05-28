import { prisma } from "@/lib/db";

export interface DailyQuote {
  id: string;
  text: string;
  speaker: { slug: string; displayName: string; avatarUrl: string | null } | null;
  episode: {
    slug: string;
    title: string;
    episodeNumber: number | null;
    airDate: Date | null;
  } | null;
  timestampSeconds: number | null;
}

export interface DailyEpisode {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  thumbnailUrl: string | null;
}

export interface WeeklyPulse {
  newEpisodes: number;
  newLoreEntries: number;
  newQuotes: number;
  activeThreads: number;
}

export interface DailyTransmission {
  date: string; // YYYY-MM-DD (UTC)
  quote: DailyQuote | null;
  spotlightEpisode: DailyEpisode | null;
  pulse: WeeklyPulse;
}

/**
 * UTC day number — increases by 1 every day at UTC midnight.
 * Use modulo this against any collection size to get a deterministic
 * daily-rotating pick that's the same for every viewer on a given day.
 */
function todayDaySeed(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      86_400_000
  );
}

function todayYMD(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

async function getDailyQuote(seed: number): Promise<DailyQuote | null> {
  // Only consider quotes that have a speaker AND an episode for a clean visual
  const where = {
    speakerPersonId: { not: null },
    episodeId: { not: null },
    text: { not: "" as const },
  };
  const total = await prisma.quote.count({ where });
  if (total === 0) return null;

  const offset = seed % total;
  const [row] = await prisma.quote.findMany({
    where,
    include: {
      speaker: {
        select: { slug: true, displayName: true, avatarUrl: true },
      },
      episode: {
        select: { slug: true, title: true, episodeNumber: true, airDate: true },
      },
    },
    orderBy: { id: "asc" },
    skip: offset,
    take: 1,
  });
  if (!row) return null;

  return {
    id: row.id,
    text: row.text,
    speaker: row.speaker,
    episode: row.episode,
    timestampSeconds: row.timestampSeconds,
  };
}

async function getSpotlightEpisode(seed: number): Promise<DailyEpisode | null> {
  // Rotate through episodes with valid thumbnails for visual quality
  const where = {
    status: "published",
    airDate: { not: null },
    thumbnailUrl: { not: null },
  } as const;
  const total = await prisma.episode.count({ where });
  if (total === 0) return null;

  // Use a different seed offset so spotlight episode doesn't always rhyme
  // with the daily quote
  const offset = (seed * 7919) % total;
  const [row] = await prisma.episode.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      episodeNumber: true,
      airDate: true,
      thumbnailUrl: true,
    },
    orderBy: { id: "asc" },
    skip: offset,
    take: 1,
  });
  return row ?? null;
}

async function getWeeklyPulse(): Promise<WeeklyPulse> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [newEpisodes, newLoreEntries, newQuotes, activeThreads] =
    await Promise.all([
      prisma.episode.count({
        where: { status: "published", createdAt: { gte: weekAgo } },
      }),
      prisma.loreEntry.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.quote.count({
        where: { createdAt: { gte: weekAgo } },
      }),
      prisma.psychenomiconThread
        .count({ where: { status: { in: ["active", "emerging", "evolving", "contested"] } } })
        .catch(() => 0),
    ]);

  return { newEpisodes, newLoreEntries, newQuotes, activeThreads };
}

export async function getDailyTransmission(): Promise<DailyTransmission> {
  const seed = todayDaySeed();
  const date = todayYMD();

  const [quote, spotlightEpisode, pulse] = await Promise.all([
    getDailyQuote(seed),
    getSpotlightEpisode(seed),
    getWeeklyPulse(),
  ]);

  return { date, quote, spotlightEpisode, pulse };
}
