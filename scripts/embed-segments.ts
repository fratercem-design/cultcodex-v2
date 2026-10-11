/**
 * Backfill TranscriptSegment.embedding directly against the database.
 *
 * Same work as POST /api/admin/embed, but run on the GitHub runner with its own
 * connection, so it does not compete with the site for the app's pool. Calling
 * the route in a loop kept hitting "timeout exceeded when trying to connect" and
 * requests that hung for minutes.
 *
 * Resumable: each batch takes the next NULL rows by id, so a run can stop at any
 * point and the next one carries on.
 *
 * Env: DATABASE_URL, OPENAI_API_KEY, and optionally
 *   BATCH         rows per batch (default 500, max 500)
 *   MAX_MINUTES   stop starting new batches after this long (default 330)
 *   MAX_SEGMENTS  stop after about this many rows, 0 = no limit (default 0)
 *   PAUSE_MS      sleep between batches to keep write load down (default 250)
 *
 * Usage: npx tsx scripts/embed-segments.ts
 */
import { getPrisma, disconnect } from "./ingest/lib";
import { embedBatch, segmentToEmbedText, vectorLiteral } from "../src/lib/embeddings";

// OpenAI rejects a request over 300k tokens in total and any input over 8,191.
// 2,000 characters is ~500 tokens, so a full batch stays under both.
const MAX_INPUT_CHARS = 2000;

const int = (name: string, fallback: number) => {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

async function main() {
  const batch = Math.min(int("BATCH", 500), 500) || 500;
  const deadline = Date.now() + int("MAX_MINUTES", 330) * 60_000;
  const maxSegments = int("MAX_SEGMENTS", 0);
  const pauseMs = int("PAUSE_MS", 250);
  const prisma = getPrisma();

  let total = 0;
  let batches = 0;
  while (Date.now() < deadline) {
    // Served by the partial index TranscriptSegment_embedding_null_idx. Blank
    // segments are skipped: OpenAI rejects empty input and there is nothing to search.
    const rows: Array<{ id: string; speakerLabel: string | null; text: string }> =
      await prisma.$queryRawUnsafe(
        `SELECT id, "speakerLabel", text FROM "TranscriptSegment"
         WHERE embedding IS NULL AND btrim(text) <> ''
         ORDER BY id LIMIT ${batch}`
      );
    if (rows.length === 0) {
      console.log(`::notice title=Embeddings::Backfill complete. ${total} segments embedded this run.`);
      return;
    }

    const vectors = await embedBatch(
      rows.map((r) => segmentToEmbedText(r.speakerLabel, r.text).slice(0, MAX_INPUT_CHARS))
    );
    total += await prisma.$executeRawUnsafe(
      `UPDATE "TranscriptSegment" AS s SET embedding = v.embedding::vector
       FROM unnest($1::text[], $2::text[]) AS v(id, embedding)
       WHERE s.id = v.id`,
      rows.map((r) => r.id),
      vectors.map(vectorLiteral)
    );

    batches++;
    if (batches % 20 === 0) console.log(`${batches} batches, ${total} segments embedded this run`);
    if (rows.length < batch) {
      console.log(`::notice title=Embeddings::Backfill complete. ${total} segments embedded this run.`);
      return;
    }
    if (maxSegments > 0 && total >= maxSegments) {
      console.log(`::notice title=Embeddings::Stopped at max_segments. ${total} segments embedded this run; re-run to continue.`);
      return;
    }
    if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
  }
  console.log(`::notice title=Embeddings::Time limit reached. ${total} segments embedded this run; re-run to continue.`);
}

main()
  .catch((err) => {
    console.error(`::error::${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  })
  .finally(disconnect);
