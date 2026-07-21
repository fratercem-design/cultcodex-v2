import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// TEMPORARY one-shot: create the GameScore table on prod (Vercel build does not
// run migrate deploy, and prod creds aren't available locally). Token-guarded.
// Idempotent (IF NOT EXISTS). Delete this route after it has run once.
export async function POST(req: NextRequest) {
  const token = process.env.SEED_FUN_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "GameScore" (
        "id" TEXT NOT NULL,
        "handle" TEXT NOT NULL,
        "userId" TEXT,
        "score" INTEGER NOT NULL,
        "correct" INTEGER NOT NULL,
        "total" INTEGER NOT NULL,
        "round" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
      );`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GameScore_createdAt_idx" ON "GameScore"("createdAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "GameScore_score_idx" ON "GameScore"("score");`);
    const count = await prisma.gameScore.count();
    return NextResponse.json({ ok: true, rows: count });
  } catch (e) {
    return NextResponse.json({ error: String(e).slice(0, 300) }, { status: 500 });
  }
}
