/**
 * Psychenomicon free-preview pipeline.
 *
 * Free chapters are config-driven — no DB flag, no migration. Set
 * PSYCHENOMICON_FREE_CHAPTERS="1,2,3" (chapter numbers, comma-separated)
 * to change the preview set; defaults to the first three chapters.
 */

const DEFAULT_FREE_CHAPTERS = [1, 2, 3];

export function getFreePreviewChapterNumbers(): number[] {
  const raw = process.env.PSYCHENOMICON_FREE_CHAPTERS;
  if (!raw) return DEFAULT_FREE_CHAPTERS;
  const parsed = raw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  return parsed.length > 0 ? parsed : DEFAULT_FREE_CHAPTERS;
}

export function isFreePreviewChapter(chapterNumber: number): boolean {
  return getFreePreviewChapterNumbers().includes(chapterNumber);
}
