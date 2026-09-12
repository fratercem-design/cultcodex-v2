-- Unique natural key for TranscriptSegment.
--
-- Every transcript writer (Vercel cron, GitHub Actions pipelines, the Windows
-- whisper daemon, the admin API routes) does check-then-insert, and they
-- overlap in time. The `skipDuplicates: true` / ON CONFLICT DO NOTHING they
-- already use only suppresses conflicts against a unique index, and until now
-- the only one was the primary key — so those clauses were dead code.
--
-- ORDER MATTERS: run
--   npx tsx scripts/maintenance/dedupe-transcript-segments.ts --apply
-- BEFORE this migration is deployed. CREATE UNIQUE INDEX fails if duplicates
-- exist, which fails the Vercel build (the previous deployment keeps serving)
-- and leaves this migration in the failed state; clear it with
--   npx prisma migrate resolve --rolled-back 20260911000000_transcript_segment_natural_key
-- after deduping, then redeploy. Deliberately no DELETE in here: deleting rows
-- is a human-approved step, not something a deploy should do on its own.

CREATE UNIQUE INDEX "TranscriptSegment_episodeId_startSeconds_endSeconds_text_key"
  ON "TranscriptSegment"("episodeId", "startSeconds", "endSeconds", "text");
