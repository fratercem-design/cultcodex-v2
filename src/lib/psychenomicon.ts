import { prisma } from "@/lib/db";

/**
 * Psychenomicon free-preview pipeline.
 *
 * Free chapters are config-driven — no DB flag, no migration. Set
 * PSYCHENOMICON_FREE_CHAPTERS="2254,2263" (chapter numbers, comma-separated)
 * to pin the preview set. When unset, the three earliest chapters by
 * broadcast order (episode air date) are free — chapterNumber is a stable
 * id, not a rank, so "1,2,3" would match nothing.
 */

const DEFAULT_FREE_COUNT = 3;

function envFreeChapterNumbers(): number[] | null {
  const raw = process.env.PSYCHENOMICON_FREE_CHAPTERS;
  if (!raw) return null;
  const parsed = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  return parsed.length > 0 ? parsed : null;
}

export async function getFreePreviewChapterNumbers(): Promise<number[]> {
  const fromEnv = envFreeChapterNumbers();
  if (fromEnv) return fromEnv;
  const earliest = await prisma.psychenomiconChapter
    .findMany({
      orderBy: { episode: { airDate: "asc" } },
      take: DEFAULT_FREE_COUNT,
      select: { chapterNumber: true },
    })
    .catch(() => []);
  return earliest.map((c) => c.chapterNumber);
}

export async function isFreePreviewChapter(chapterNumber: number): Promise<boolean> {
  return (await getFreePreviewChapterNumbers()).includes(chapterNumber);
}
