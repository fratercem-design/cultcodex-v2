import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness only: proves the Node process is up and answering, without touching
// the database. Fly's check points here so a slow or hibernating Xata branch
// can't mark a healthy Machine critical. /api/health stays the DB readiness check.
export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
