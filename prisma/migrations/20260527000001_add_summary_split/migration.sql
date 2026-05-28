-- Structured fact/interpretation split for episode summaries.
-- summaryFacts  = transcript-grounded recap (what happened, who appeared, timestamps)
-- summaryThemes = AI interpretive layer (recurring patterns, thematic significance)
--
-- summaryLong is preserved as a legacy field — existing content is untouched.
-- New enrichment runs populate summaryFacts + summaryThemes instead of summaryLong.

ALTER TABLE "Episode" ADD COLUMN "summaryFacts"  TEXT;
ALTER TABLE "Episode" ADD COLUMN "summaryThemes" TEXT;
