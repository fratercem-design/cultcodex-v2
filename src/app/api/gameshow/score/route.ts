import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number | null> = { week: 7, month: 30, all: null };

function sanitizeHandle(h: unknown): string {
  const s = String(h ?? "").replace(/[^\p{L}\p{N} _.\-]/gu, "").trim().slice(0, 24);
  return s || "Anonymous Cultist";
}

export async function GET(req: NextRequest) {
  const range = req.nextUrl.searchParams.get("range") ?? "week";
  const days = RANGES[range] ?? null;
  const where = days ? { createdAt: { gte: new Date(Date.now() - days * 86_400_000) } } : {};
  const rows = await prisma.gameScore
    .findMany({ where, orderBy: [{ score: "desc" }, { createdAt: "asc" }], take: 200, select: { handle: true, score: true, correct: true, total: true, createdAt: true } })
    .catch(() => []);
  // Best run per handle.
  const best = new Map<string, (typeof rows)[number]>();
  for (const r of rows) { const cur = best.get(r.handle); if (!cur || r.score > cur.score) best.set(r.handle, r); }
  const board = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 25);
  return NextResponse.json({ range, board });
}

export async function POST(req: NextRequest) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`gameshow-score:${callerKey}`, { limit: 10, windowMs: 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }

  let body: { handle?: string; score?: number; correct?: number; total?: number; round?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const correct = Math.max(0, Math.min(1000, Math.floor(Number(body.correct) || 0)));
  const total = Math.max(0, Math.min(2000, Math.floor(Number(body.total) || 0)));
  const score = Math.max(0, Math.min(1000, Math.floor(Number(body.score) || correct)));
  if (total < 1 || correct > total) return NextResponse.json({ error: "invalid run" }, { status: 400 });
  const handle = sanitizeHandle(body.handle);
  const round = typeof body.round === "string" ? body.round.slice(0, 32) : null;
  try {
    await prisma.gameScore.create({ data: { handle, score, correct, total, round } });
  } catch {
    return NextResponse.json({ error: "leaderboard unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
