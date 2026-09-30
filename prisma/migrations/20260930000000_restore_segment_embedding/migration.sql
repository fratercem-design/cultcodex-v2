-- TranscriptSegment.embedding was added by 20260517000000_add_pgvector (1536
-- dims) but is missing from production: the migration is recorded as applied,
-- the column is not there. It comes back at 512 dims (text-embedding-3-small
-- with `dimensions: 512`), a third of the storage for 4.86M rows. Nullable with
-- no default, so this is a catalog-only change.
ALTER TABLE "TranscriptSegment" ADD COLUMN IF NOT EXISTS "embedding" vector(512);
