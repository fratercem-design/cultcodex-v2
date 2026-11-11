-- Reverse lookup for the EpisodeGuest join table: its primary key leads with
-- "episodeId", so filtering by "personId" alone scanned the whole table.
-- One statement per file: CONCURRENTLY cannot run inside a transaction block.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EpisodeGuest_personId_idx" ON "EpisodeGuest" ("personId");
