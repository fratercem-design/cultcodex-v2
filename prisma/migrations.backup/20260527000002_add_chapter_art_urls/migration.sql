-- Add AI-generated art image URLs and generation timestamp to PsychenomiconChapter.
-- URLs are Supabase Storage public URLs set by the art pipeline script.
-- Shape of artImageUrls: { "cover": "...", "scene_01": "...", "scene_02": "...", "scene_03": "..." }

ALTER TABLE "PsychenomiconChapter"
  ADD COLUMN IF NOT EXISTS "artImageUrls"   JSONB,
  ADD COLUMN IF NOT EXISTS "artGeneratedAt" TIMESTAMP(3);
