/**
 * Keep-alive route — pings the database with a trivial query so the Xata
 * Postgres branch never hibernates from inactivity.
 *
 * Why this exists: on low traffic the branch goes to sleep, and the next
 * production build (which prerenders thousands of static pages against the DB)
 * dies with "branch is hibernated, reactivate it to continue" — blocking every
 * deploy. A GitHub Actions cron hits this endpoint every few minutes to keep
 * the branch warm 24/7. (Vercel Hobby crons only run once per day, which is too
 * infrequent to prevent hibernation, so the keep-alive lives on GitHub Actions
 * instead — see .github/workflows/keep-alive.yml.)
 *
 * Public + harmless by design: it runs only `SELECT 1` and returns no data, so
 * it needs no auth token for the external pinger to call it.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, awake: true, ts: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    // A hibernated branch throws on the first query then reactivates in the
    // background — report it so a retry (or the next cron tick) can land.
    return NextResponse.json(
      { ok: false, awake: false, error: err instanceof Error ? err.message : String(err) },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
