-- Enable the pgvector extension used by semantic search.
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to TranscriptSegment
ALTER TABLE "TranscriptSegment" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

-- HNSW index for fast approximate nearest-neighbour search
-- m=16 ef_construction=64 are standard defaults; tune after profiling
CREATE INDEX IF NOT EXISTS "TranscriptSegment_embedding_hnsw_idx"
  ON "TranscriptSegment"
  USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
