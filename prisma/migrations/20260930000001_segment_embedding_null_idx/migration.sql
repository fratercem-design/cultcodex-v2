-- Rows still waiting for an embedding. /api/admin/embed walks this instead of
-- scanning the table, and it shrinks to nothing as the backfill finishes.
-- One statement per file: CONCURRENTLY cannot run inside a transaction block.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TranscriptSegment_embedding_null_idx" ON "TranscriptSegment" ("id") WHERE "embedding" IS NULL;
