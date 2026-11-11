-- Reverse lookup for the EpisodeMentionedPerson join table: its primary key leads with
-- "episodeId", so filtering by "personId" alone scanned the whole table.
-- One statement per file: CONCURRENTLY cannot run inside a transaction block.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EpisodeMentionedPerson_personId_idx" ON "EpisodeMentionedPerson" ("personId");
