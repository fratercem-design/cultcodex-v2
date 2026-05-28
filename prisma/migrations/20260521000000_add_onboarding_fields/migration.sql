-- Add onboarding fields to CodexUser
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "sigilGlyph" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Mark all existing users as having already completed onboarding
UPDATE "CodexUser" SET "onboardingCompleted" = true;

-- Unique index for handle
CREATE UNIQUE INDEX IF NOT EXISTS "CodexUser_handle_key" ON "CodexUser"("handle");
