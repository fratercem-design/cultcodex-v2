/**
 * POST /api/admin/apply-pending-migrations
 *
 * One-shot endpoint to apply the three migrations that were added while
 * Railway's build command wasn't running prisma migrate deploy:
 *   - 20260520000001_add_salon         (SalonThread + SalonPost tables)
 *   - 20260520000002_add_weekly_digest  (WeeklyDigest table)
 *   - 20260521000000_fix_typos_seed_packs (episode typos + card pack seeds)
 *
 * All statements use IF NOT EXISTS / ON CONFLICT DO NOTHING so running
 * this more than once is safe.
 *
 * Auth: X-Enrich-Secret header must match ENRICH_SECRET env var.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireEnrichSecret } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = requireEnrichSecret(req);
  if (denied) return denied;

  const steps: Array<{ step: string; ok: boolean; error?: string }> = [];

  async function run(name: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      steps.push({ step: name, ok: true });
    } catch (err) {
      steps.push({ step: name, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // ── 20260520000001_add_salon ──────────────────────────────────────────────

  await run("create SalonThread", `
    CREATE TABLE IF NOT EXISTS "SalonThread" (
      "id" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "prompt" TEXT NOT NULL,
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "closed" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "SalonThread_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("create SalonPost", `
    CREATE TABLE IF NOT EXISTS "SalonPost" (
      "id" TEXT NOT NULL,
      "threadId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "flagged" BOOLEAN NOT NULL DEFAULT false,
      "flaggedReason" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SalonPost_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("fk SalonPost→SalonThread", `
    DO $$ BEGIN
      ALTER TABLE "SalonPost" ADD CONSTRAINT "SalonPost_threadId_fkey"
        FOREIGN KEY ("threadId") REFERENCES "SalonThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `);

  await run("fk SalonPost→CodexUser", `
    DO $$ BEGIN
      ALTER TABLE "SalonPost" ADD CONSTRAINT "SalonPost_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN null; END $$
  `);

  await run("index SalonThread pinned+createdAt", `CREATE INDEX IF NOT EXISTS "SalonThread_pinned_createdAt_idx" ON "SalonThread"("pinned", "createdAt")`);
  await run("index SalonPost threadId+createdAt", `CREATE INDEX IF NOT EXISTS "SalonPost_threadId_createdAt_idx" ON "SalonPost"("threadId", "createdAt")`);
  await run("index SalonPost userId", `CREATE INDEX IF NOT EXISTS "SalonPost_userId_idx" ON "SalonPost"("userId")`);

  await run("seed welcome SalonThread", `
    INSERT INTO "SalonThread" ("id", "title", "prompt", "pinned", "updatedAt")
    VALUES (
      'salon_welcome',
      'Welcome to the Salon',
      'This is the Oracle-tier salon — the room behind the room. Introduce yourself: what first pulled you into the archive, and what pattern are you still trying to decode?',
      true,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO NOTHING
  `);

  // ── 20260520000002_add_weekly_digest ──────────────────────────────────────

  await run("create WeeklyDigest", `
    CREATE TABLE IF NOT EXISTS "WeeklyDigest" (
      "id" TEXT NOT NULL,
      "weekOf" TIMESTAMP(3) NOT NULL,
      "title" TEXT NOT NULL,
      "blurb" TEXT,
      "published" BOOLEAN NOT NULL DEFAULT false,
      "quoteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "episodeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "personIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "WeeklyDigest_pkey" PRIMARY KEY ("id")
    )
  `);

  await run("unique index WeeklyDigest weekOf", `CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyDigest_weekOf_key" ON "WeeklyDigest"("weekOf")`);
  await run("index WeeklyDigest weekOf", `CREATE INDEX IF NOT EXISTS "WeeklyDigest_weekOf_idx" ON "WeeklyDigest"("weekOf")`);

  // ── 20260521000000_fix_typos_seed_packs ───────────────────────────────────

  await run("fix typo: truth is fierce curry", `
    UPDATE "Episode" SET title = 'Truth Is Fierce — Curry Panel' WHERE title = 'truth is fierce curry'
  `);

  await run("fix typo: Party Continues Ooen Panel", `
    UPDATE "Episode" SET title = 'Party Continues — Open Panel' WHERE title = 'Party Continues Ooen Panel'
  `);

  await run("collapse double spaces in episode titles", `
    UPDATE "Episode" SET title = regexp_replace(title, '  +', ' ', 'g') WHERE title ~ '  +'
  `);

  await run("seed pack: static-transmission", `
    INSERT INTO "CardPack" (
      id, slug, name, description,
      price, cost, "cardCount", "isAvailable", "sortOrder",
      "weightStatic", "weightSignal", "weightTransmission", "weightAnomaly",
      "weightOracle", "weightLegendary", "weightMythic", "weightForbidden",
      "artTheme", "createdAt", "updatedAt"
    ) VALUES (
      'pack_static_transmission', 'static-transmission', 'Static Transmission',
      'Low-noise entry pack. Mostly foundational Signal and Static cards — the bedrock of the archive.',
      75, 75, 3, true, 10, 55, 30, 10, 4, 1, 0, 0, 0, 'terminal', NOW(), NOW()
    ) ON CONFLICT (slug) DO NOTHING
  `);

  await run("seed pack: occult-signal", `
    INSERT INTO "CardPack" (
      id, slug, name, description,
      price, cost, "cardCount", "isAvailable", "sortOrder",
      "weightStatic", "weightSignal", "weightTransmission", "weightAnomaly",
      "weightOracle", "weightLegendary", "weightMythic", "weightForbidden",
      "artTheme", "createdAt", "updatedAt"
    ) VALUES (
      'pack_occult_signal', 'occult-signal', 'Occult Signal',
      'Deeper into the archive. Higher Signal and Transmission weight — rare patterns begin to surface.',
      150, 150, 3, true, 20, 35, 35, 20, 7, 2.5, 0.5, 0, 0, 'occult', NOW(), NOW()
    ) ON CONFLICT (slug) DO NOTHING
  `);

  await run("seed pack: oracles-cache", `
    INSERT INTO "CardPack" (
      id, slug, name, description,
      price, cost, "cardCount", "isAvailable", "sortOrder",
      "weightStatic", "weightSignal", "weightTransmission", "weightAnomaly",
      "weightOracle", "weightLegendary", "weightMythic", "weightForbidden",
      "artTheme", "createdAt", "updatedAt"
    ) VALUES (
      'pack_oracles_cache', 'oracles-cache', 'Oracle''s Cache',
      'From the deepest strata. Anomaly and Oracle cards emerge. Foil probability tripled.',
      400, 400, 5, true, 30, 20, 28, 22, 16, 8, 3.5, 2, 0.5, 'chaos', NOW(), NOW()
    ) ON CONFLICT (slug) DO NOTHING
  `);

  const allOk = steps.every((s) => s.ok);
  const failed = steps.filter((s) => !s.ok);

  return NextResponse.json({ ok: allOk, steps, failed }, { status: allOk ? 200 : 207 });
}
