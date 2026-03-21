import { prisma } from "@/lib/db";

export interface EpisodeTranscriptSummary {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  segmentCount: number;
  duration: string | null;
  speakers: string[];
}

export interface TranscriptSearchHit {
  segmentId: string;
  text: string;
  speakerLabel: string | null;
  startSeconds: number;
  episodeId: string;
  episodeTitle: string;
  episodeSlug: string;
  episodeNumber: number | null;
}

export interface TranscriptSearchResults {
  hits: TranscriptSearchHit[];
  totalCount: number;
}

export interface TranscriptStats {
  episodeCount: number;
  totalSegments: number;
}

export async function getEpisodesWithTranscripts(options: {
  take: number;
  skip: number;
}): Promise<EpisodeTranscriptSummary[]> {
  const episodes = await prisma.episode.findMany({
    where: {
      status: "published",
      segments: { some: {} },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      duration: true,
      _count: { select: { segments: true } },
      segments: {
        select: { speakerLabel: true },
        distinct: ["speakerLabel"],
      },
    },
    orderBy: { episodeNumber: "desc" },
    take: options.take,
    skip: options.skip,
  });

  return episodes.map((ep) => ({
    id: ep.id,
    title: ep.title,
    slug: ep.slug,
    episodeNumber: ep.episodeNumber,
    airDate: ep.airDate,
    segmentCount: ep._count.segments,
    duration: ep.duration,
    speakers: ep.segments
      .map((s) => s.speakerLabel)
      .filter((l): l is string => l != null),
  }));
}

export async function getEpisodesWithTranscriptsCount(): Promise<number> {
  return prisma.episode.count({
    where: {
      status: "published",
      segments: { some: {} },
    },
  });
}

export async function searchWithinTranscripts(
  query: string,
  options: { take: number; skip: number }
): Promise<TranscriptSearchResults> {
  const where = {
    text: { contains: query, mode: "insensitive" as const },
    episode: { status: "published" as const },
  };

  const [hits, totalCount] = await Promise.all([
    prisma.transcriptSegment.findMany({
      where,
      select: {
        id: true,
        text: true,
        speakerLabel: true,
        startSeconds: true,
        episode: {
          select: { id: true, title: true, slug: true, episodeNumber: true },
        },
      },
      orderBy: { startSeconds: "asc" },
      take: options.take,
      skip: options.skip,
    }),
    prisma.transcriptSegment.count({ where }),
  ]);

  return {
    hits: hits.map((h) => ({
      segmentId: h.id,
      text: h.text,
      speakerLabel: h.speakerLabel,
      startSeconds: h.startSeconds,
      episodeId: h.episode.id,
      episodeTitle: h.episode.title,
      episodeSlug: h.episode.slug,
      episodeNumber: h.episode.episodeNumber,
    })),
    totalCount,
  };
}

export async function getTranscriptStats(): Promise<TranscriptStats> {
  const [episodeCount, totalSegments] = await Promise.all([
    prisma.episode.count({
      where: { status: "published", segments: { some: {} } },
    }),
    prisma.transcriptSegment.count({
      where: { episode: { status: "published" } },
    }),
  ]);
  return { episodeCount, totalSegments };
}
