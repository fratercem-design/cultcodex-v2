-- Reverse lookup for the EpisodeTopic join table: its primary key leads with
-- "episodeId", so filtering by "topicId" alone scanned the whole table.
-- One statement per file: CONCURRENTLY cannot run inside a transaction block.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "EpisodeTopic_topicId_idx" ON "EpisodeTopic" ("topicId");
