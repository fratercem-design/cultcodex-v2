/**
 * POST /api/admin/apply-migration
 *
 * One-shot endpoint to apply the pgvector migration manually from a machine
 * that can't reach Neon directly. Idempotent (uses IF NOT EXISTS).
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const steps: Array<{ step: string; ok: boolean; error?: string }> = [];

  // Each statement runs separately because $executeRawUnsafe takes a single statement
  const statements: Array<{ name: string; sql: string }> = [
    {
      name: "enable pgvector extension",
      sql: `CREATE EXTENSION IF NOT EXISTS vector`,
    },
    {
      name: "add embedding column to TranscriptSegment",
      sql: `ALTER TABLE "TranscriptSegment" ADD COLUMN IF NOT EXISTS "embedding" vector(1536)`,
    },
    {
      name: "create HNSW index on embedding",
      sql: `CREATE INDEX IF NOT EXISTS "TranscriptSegment_embedding_hnsw_idx" ON "TranscriptSegment" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64)`,
    },
    {
      name: "create SearchKind enum",
      sql: `DO $$ BEGIN CREATE TYPE "SearchKind" AS ENUM ('simple', 'deep', 'oracle'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
    },
    {
      name: "create SavedSearch table",
      sql: `CREATE TABLE IF NOT EXISTS "SavedSearch" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "kind" "SearchKind" NOT NULL,
        "query" TEXT NOT NULL DEFAULT '',
        "concepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "thresholds" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
        "eraId" TEXT,
        "personSlug" TEXT,
        "archetype" TEXT,
        "pinned" BOOLEAN NOT NULL DEFAULT false,
        "lastRunAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
      )`,
    },
    {
      name: "add SavedSearch user fk",
      sql: `DO $$ BEGIN ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    },
    {
      name: "index SavedSearch by user",
      sql: `CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId")`,
    },
    {
      name: "index SavedSearch by user+pinned",
      sql: `CREATE INDEX IF NOT EXISTS "SavedSearch_userId_pinned_idx" ON "SavedSearch"("userId", "pinned")`,
    },
    {
      name: "index SavedSearch by user+kind",
      sql: `CREATE INDEX IF NOT EXISTS "SavedSearch_userId_kind_idx" ON "SavedSearch"("userId", "kind")`,
    },
  ];

  for (const stmt of statements) {
    try {
      await prisma.$executeRawUnsafe(stmt.sql);
      steps.push({ step: stmt.name, ok: true });
    } catch (err) {
      steps.push({
        step: stmt.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Verify by counting columns
  let verified = false;
  try {
    const rows: Array<{ exists: boolean }> = await prisma.$queryRawUnsafe(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'TranscriptSegment' AND column_name = 'embedding'
      ) AS exists`
    );
    verified = rows[0]?.exists === true;
  } catch {
    verified = false;
  }

  const allOk = steps.every((s) => s.ok);
  return NextResponse.json(
    { ok: allOk, verified, steps },
    { status: allOk ? 200 : 500 }
  );
}
