-- Add missing CodexUser columns that exist in schema but had no migration
-- Using IF NOT EXISTS so this is safe whether or not columns already exist
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "CodexUser" ADD COLUMN IF NOT EXISTS "memberTitle" TEXT;
