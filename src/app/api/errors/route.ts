/**
 * POST /api/errors
 *
 * Receives client-side error reports from GlobalError and error.tsx
 * boundaries, then logs them server-side so they flow through Railway's
 * log drain to Better Stack (and trigger any configured alerts there).
 *
 * Intentionally minimal — no auth, no DB. The endpoint must be reachable
 * even when the app is partially broken.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Light rate limit: 10 reports/min per IP — prevents flooding the log drain.
  const rl = rateLimit(`client-error:${clientKey(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const message  = typeof b.message  === "string" ? b.message.slice(0, 500)  : "unknown";
  const digest   = typeof b.digest   === "string" ? b.digest.slice(0, 100)   : null;
  const stack    = typeof b.stack    === "string" ? b.stack.slice(0, 2000)   : null;
  const pathname = typeof b.pathname === "string" ? b.pathname.slice(0, 200) : null;

  // Structured log — Better Stack alert rule: log contains "[client-error]"
  console.error(
    `[client-error] ${message}`,
    JSON.stringify({ digest, pathname, stack: stack?.split("\n").slice(0, 5).join(" | ") })
  );

  return NextResponse.json({ ok: true });
}
