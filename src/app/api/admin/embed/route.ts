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
 *   { processed, remaining, done }
 *
 * The route queries WHERE embedding IS NULL directly, so it always
 * finds the next unembedded rows. No cursor needed — just call in a
 * loop until done=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { embedBatch, segmentToEmbedText, vectorLiteral } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_BATCH = 500;
const DEFAULT_BATCH = 100;
// OpenAI hard limit per embeddings call
const OPENAI_BATCH_LIMIT = 2048;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { batch?: number } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const batchSize = Math.min(body.batch ?? DEFAULT_BATCH, MAX_BATCH);

  // Find the next N segment ids that still need embedding.
  // Index-scans the HNSW partial NULL set on TranscriptSegment.embedding.
  const needsEmbedRaw: Array<{ id: string }> = await prisma.$queryRawUnsafe(
    `SELECT id FROM "TranscriptSegment" WHERE embedding IS NULL ORDER BY id LIMIT ${batchSize}`
  );
  const toEmbedIds = needsEmbedRaw.map((r) => r.id);

  if (toEmbedIds.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0, done: true });
  }

  // Fetch the speaker label + text for those ids via Prisma
  const toProcess = await prisma.transcriptSegment.findMany({
    where: { id: { in: toEmbedIds } },
    select: { id: true, speakerLabel: true, text: true },
  });

  // Embed in sub-batches of OPENAI_BATCH_LIMIT (toProcess <= MAX_BATCH <= 500 so only one call)
  const texts = toProcess.map((s) => segmentToEmbedText(s.speakerLabel, s.text));
  let allVectors: number[][] = [];

  for (let i = 0; i < texts.length; i += OPENAI_BATCH_LIMIT) {
    const chunk = texts.slice(i, i + OPENAI_BATCH_LIMIT);
    const vecs = await embedBatch(chunk);
    allVectors = allVectors.concat(vecs);
  }

  // Write embeddings back — one raw UPDATE per segment
  // Using a single unnest UPDATE would be cleaner but requires pg-specific syntax
  // that's harder to compose safely. Row-by-row is fine at batch=100.
  let processed = 0;
  for (let i = 0; i < toProcess.length; i++) {
    const seg = toProcess[i];
    const vec = allVectors[i];
    await prisma.$executeRawUnsafe(
      `UPDATE "TranscriptSegment" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral(vec),
      seg.id
    );
    processed++;
  }

  const remaining = await countUnembedded();

  return NextResponse.json({ processed, remaining, done: remaining === 0 });
}

async function countUnembedded(): Promise<number> {
  const result: Array<{ count: string }> = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::text AS count FROM "TranscriptSegment" WHERE embedding IS NULL`
  );
  return parseInt(result[0]?.count ?? "0", 10);
}
