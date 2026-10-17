import type { Prisma } from "@/generated/prisma/client";

// Sentinel written when AI returns no summaryFacts (e.g. title-only clips).
export const SUMMARY_FACTS_PLACEHOLDER = "—";

/**
 * The one definition of "this episode still needs enrichment".
 *
 * Shared by the /admin/sync "Need enrichment" card and
 * POST /api/admin/enrich-episodes so the count and the batch query can't drift.
 *
 * withTranscriptOnly narrows to episodes that have transcript segments, which is
 * what the "Enrich Next" button processes.
 */
export function unenrichedEpisodeWhere(
  opts: { withTranscriptOnly?: boolean } = {},
): Prisma.EpisodeWhereInput {
  const summaryFactsMissing: Prisma.EpisodeWhereInput[] = [
    { summaryFacts: null },
    { summaryFacts: "" },
    // A placeholder means a prior run produced nothing; only retry it when someone
    // explicitly queued it, so title-only clips don't get re-billed on every Run All.
    { AND: [{ summaryFacts: SUMMARY_FACTS_PLACEHOLDER }, { enrichmentQueued: true }] },
  ];

  return {
    AND: [
      { OR: [{ summaryShort: null }, { summaryShort: "" }] },
      { OR: summaryFactsMissing },
      { OR: [{ summaryLong: null }, { summaryLong: "" }] },
    ],
    ...(opts.withTranscriptOnly ? { segments: { some: {} } } : {}),
  };
}
