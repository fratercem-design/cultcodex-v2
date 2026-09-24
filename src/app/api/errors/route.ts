/**
 * POST /api/errors
 *
 * Receives client-side error reports from the GlobalError and error.tsx
 * boundaries and records them server-side.
 *
 * NOTE: this used to claim the logs flowed through "Railway's log drain to
 * Better Stack". That pipeline no longer exists — Railway was retired in the
 * 2026-08-17 move to Vercel and no log drain replaced it, so for a while these
 * reports were written to an ephemeral function log and silently discarded.
 * Sentry is now the alerting path (see instrumentation.ts); the console.error
 * below is kept as a second record for when the client-side SDK cannot report.
 *
 * Intentionally minimal — no auth, no DB. The endpoint must be reachable
 * even when the app is partially broken.
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
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

  // Forward to Sentry so a client error that could not self-report (SDK blocked,
  // init failed, DSN missing on the client) still reaches the alerting path.
  Sentry.captureMessage(`[client-error] ${message}`, {
    level: "error",
    tags: { source: "client-error-endpoint" },
    extra: { digest, pathname, stack },
  });

  // Structured log — second record, greppable as "[client-error]".
  console.error(
    `[client-error] ${message}`,
    JSON.stringify({ digest, pathname, stack: stack?.split("\n").slice(0, 5).join(" | ") })
  );

  return NextResponse.json({ ok: true });
}
