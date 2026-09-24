-- Safety migration: ensure all CodexUser columns exist regardless of prior migration state.
-- Every statement uses IF NOT EXISTS so this is always safe to apply.
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "isLifetimeMember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "memberTitle" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "isPublicMember" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "codexSlug" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "codexPagePublic" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "codexBanner" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "codexLinks" JSONB;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "codexShowCards" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "sigilGlyph" TEXT;
-- Create unique indexes only if they don't already exist
CREATE UNIQUE INDEX IF NOT EXISTS "CodexUser_codexSlug_key" ON "CodexUser"("codexSlug");
CREATE UNIQUE INDEX IF NOT EXISTS "CodexUser_handle_key" ON "CodexUser"("handle");
