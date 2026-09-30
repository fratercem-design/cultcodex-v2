-- Nearest-neighbour index for src/lib/queries/semantic.ts. Built while the
-- column is empty, then filled as the backfill writes rows. CONCURRENTLY so
-- ingest writes are not blocked; one statement per file for the same reason.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "TranscriptSegment_embedding_hnsw_idx" ON "TranscriptSegment" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
