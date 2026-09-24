-- ChatMessage gains moderation columns, matching the LLM moderation already
-- applied to episode comments and salon posts (src/lib/moderation.ts).
ALTER TABLE "ChatMessage"
    ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "moderationReason" TEXT;
