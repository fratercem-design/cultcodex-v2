-- Matches the optional Episode.rumbleVideoId field used by the archive and
-- prerendered pages. IF NOT EXISTS keeps the migration safe for databases
-- where the column was added manually before this migration was committed.
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "rumbleVideoId" TEXT;
