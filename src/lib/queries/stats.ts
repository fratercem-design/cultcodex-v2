import { prisma } from "@/lib/db";
import type { ArchiveStats } from "@/types";

export async function getArchiveStats(): Promise<ArchiveStats> {
  const [episodes, people, loreEntries, quotes, series, topics] =
    await Promise.all([
      prisma.episode.count({ where: { status: "published" } }),
      prisma.person.count(),
      prisma.loreEntry.count(),
      prisma.quote.count(),
      prisma.series.count(),
      prisma.topic.count(),
    ]);

  return { episodes, people, loreEntries, quotes, series, topics };
}
