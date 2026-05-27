-- Add human review flags to Episode
-- isHumanReviewed: true when a human has read and verified the AI summary
-- humanReviewedAt: timestamp of the most recent review

ALTER TABLE "Episode" ADD COLUMN "isHumanReviewed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Episode" ADD COLUMN "humanReviewedAt" TIMESTAMP(3);
