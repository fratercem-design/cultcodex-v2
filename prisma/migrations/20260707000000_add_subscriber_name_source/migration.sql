-- Add optional name + lead-source columns to Subscriber (lead-magnet capture).
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "source" TEXT;
