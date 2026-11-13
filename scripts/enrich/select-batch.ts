// Which un-enriched episodes a run works on first.
//
// A run enriches `batch` episodes (50 on the daily schedule) and the queue can
// be far longer than that: on 2026-11-12 it held every episode aired since
// 2026-09-24. The order decides which pages get a real summary and meta
// description today and which wait a week.

export interface BatchCandidate {
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
}

/**
 * Picks the episodes for this run: newest first, so this week's streams get a
 * summary while people are still searching for them and the older backlog
 * drains behind. Episodes without an air date sort after dated ones, newest
 * episode number first.
 */
export function selectBatch<T extends BatchCandidate>(candidates: T[], batch: number): T[] {
  return [...candidates]
    .sort(
      (a, b) =>
        (b.airDate?.getTime() ?? -Infinity) - (a.airDate?.getTime() ?? -Infinity) ||
        (b.episodeNumber ?? -Infinity) - (a.episodeNumber ?? -Infinity),
    )
    .slice(0, batch);
}
