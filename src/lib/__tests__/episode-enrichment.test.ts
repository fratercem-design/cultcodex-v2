import { describe, expect, it } from "vitest";
import { SUMMARY_FACTS_PLACEHOLDER, unenrichedEpisodeWhere } from "../episode-enrichment";

describe("unenrichedEpisodeWhere", () => {
  it("only re-selects placeholder episodes when they are queued", () => {
    const where = unenrichedEpisodeWhere();
    const factsClause = (where.AND as Array<{ OR: unknown[] }>)[1].OR;
    expect(factsClause).toContainEqual({
      AND: [{ summaryFacts: SUMMARY_FACTS_PLACEHOLDER }, { enrichmentQueued: true }],
    });
    expect(factsClause).not.toContainEqual({ summaryFacts: SUMMARY_FACTS_PLACEHOLDER });
  });

  it("adds the transcript filter only when asked", () => {
    expect(unenrichedEpisodeWhere()).not.toHaveProperty("segments");
    expect(unenrichedEpisodeWhere({ withTranscriptOnly: true }).segments).toEqual({ some: {} });
  });
});
