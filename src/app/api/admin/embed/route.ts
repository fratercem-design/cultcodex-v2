/**
 * POST /api/admin/embed
 *
 * Batch-embeds TranscriptSegment rows that have no embedding yet.
 * Designed to be called in a loop until done=true.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 *
 * Body (JSON, all optional):
 *   batch   number of segments per call (default 100, max 500)
 *
 * Returns:
 *   { processed, done }
 *
 * The route queries WHERE embedding IS NULL directly, so it always
 * finds the next unembedded rows. No cursor needed — just call in a
 * loop until done=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireEnrichSecret } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";
import { embedBatch, segmentToEmbedText, vectorLiteral } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BATCH = 500;
// OpenAI rejects a request over 300k tokens in total and any input over 8,191.
// 2,000 characters is ~500 tokens, so a full batch stays under both. Caption
// segments are far shorter; this only guards against a runaway row.
const MAX_INPUT_CHARS = 2000;
const DEFAULT_BATCH = 100;
// OpenAI hard limit per embeddings call
const OPENAI_BATCH_LIMIT = 2048;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = requireEnrichSecret(req);
  if (denied) return denied;

  let body: { batch?: number } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const batchSize = Math.min(body.batch ?? DEFAULT_BATCH, MAX_BATCH);

  // An unhandled throw becomes an empty 500, which left the backfill workflow
  // with nothing to report. Return the message instead.
  try {
    return await embedNextBatch(batchSize);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/embed]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function embedNextBatch(batchSize: number): Promise<NextResponse> {

  // Find the next N segment ids that still need embedding. Served by the partial
  // index TranscriptSegment_embedding_null_idx, so this stays cheap on 4.86M rows.
  // Blank segments are skipped: OpenAI rejects an empty input, there is nothing
  // to search in them, and one would otherwise fail every batch it lands in.
  const needsEmbedRaw: Array<{ id: string }> = await prisma.$queryRawUnsafe(
    `SELECT id FROM "TranscriptSegment" WHERE embedding IS NULL AND btrim(text) <> '' ORDER BY id LIMIT ${batchSize}`
  );
  const toEmbedIds = needsEmbedRaw.map((r) => r.id);

  if (toEmbedIds.length === 0) {
    return NextResponse.json({ processed: 0, done: true });
  }

  // Fetch the speaker label + text for those ids via Prisma
  const toProcess = await prisma.transcriptSegment.findMany({
    where: { id: { in: toEmbedIds } },
    select: { id: true, speakerLabel: true, text: true },
  });

  // Embed in sub-batches of OPENAI_BATCH_LIMIT (toProcess <= MAX_BATCH <= 500 so only one call)
  const texts = toProcess.map((s) => segmentToEmbedText(s.speakerLabel, s.text).slice(0, MAX_INPUT_CHARS));
  let allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += OPENAI_BATCH_LIMIT) {
    const chunk = texts.slice(i, i + OPENAI_BATCH_LIMIT);
    const vecs = await embedBatch(chunk);
    allVectors = allVectors.concat(vecs);
  }

  // Write the whole batch in one UPDATE: the backfill is ~10k calls, and one
  // round trip per row would be millions.
  const processed = await prisma.$executeRawUnsafe(
    `UPDATE "TranscriptSegment" AS s SET embedding = v.embedding::vector
     FROM unnest($1::text[], $2::text[]) AS v(id, embedding)
     WHERE s.id = v.id`,
    toProcess.map((s) => s.id),
    allVectors.map(vectorLiteral)
  );

  // No COUNT(*) of the rest: on 4.86M rows it cost more than the batch itself.
  // A short batch means the NULL set ran out.
  return NextResponse.json({ processed, done: toEmbedIds.length < batchSize });
}
