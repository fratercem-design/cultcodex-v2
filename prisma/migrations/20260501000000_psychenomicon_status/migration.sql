-- Add status field to PsychenomiconChapter
-- Values: stable | contested | evolving
ALTER TABLE "PsychenomiconChapter"
    ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'stable';
