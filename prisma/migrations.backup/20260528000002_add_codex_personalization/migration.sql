-- Add codex page personalization fields to CodexUser
ALTER TABLE "CodexUser" ADD COLUMN "codexBanner" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN "codexLinks" JSONB;
ALTER TABLE "CodexUser" ADD COLUMN "codexShowCards" BOOLEAN NOT NULL DEFAULT false;
