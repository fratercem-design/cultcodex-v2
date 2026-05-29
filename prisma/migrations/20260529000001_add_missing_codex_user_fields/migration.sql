-- Add missing CodexUser columns that exist in schema but had no migration
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "memberTitle" TEXT;

-- Unique constraints (IF NOT EXISTS via DO block)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CodexUser_stripeCustomerId_key'
  ) THEN
    ALTER TABLE "CodexUser" ADD CONSTRAINT "CodexUser_stripeCustomerId_key" UNIQUE ("stripeCustomerId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CodexUser_subscriptionId_key'
  ) THEN
    ALTER TABLE "CodexUser" ADD CONSTRAINT "CodexUser_subscriptionId_key" UNIQUE ("subscriptionId");
  END IF;
END $$;
