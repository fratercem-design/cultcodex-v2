-- Adds QuoteReaction table — reactions on individual quotes,
-- mirroring EpisodeReaction. Uses the existing ReactionType enum.

CREATE TABLE IF NOT EXISTS "QuoteReaction" (
  "userId" TEXT NOT NULL,
  "quoteId" TEXT NOT NULL,
  "reactionType" "ReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuoteReaction_pkey" PRIMARY KEY ("userId", "quoteId", "reactionType")
);

DO $$ BEGIN
  ALTER TABLE "QuoteReaction"
    ADD CONSTRAINT "QuoteReaction_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "CodexUser"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "QuoteReaction"
    ADD CONSTRAINT "QuoteReaction_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "QuoteReaction_quoteId_idx" ON "QuoteReaction"("quoteId");
