-- Add subscription tier tracking and personal codex page fields
ALTER TABLE "CodexUser" ADD COLUMN "subscriptionTier" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN "bio" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN "codexSlug" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN "codexPagePublic" BOOLEAN NOT NULL DEFAULT true;
CREATE UNIQUE INDEX "CodexUser_codexSlug_key" ON "CodexUser"("codexSlug");
