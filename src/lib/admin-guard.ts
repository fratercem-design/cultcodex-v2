import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * Constant-time comparison of two strings. Returns false on any length
 * mismatch without leaking timing, and never throws on malformed input.
 */
function safeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Boolean form of the `X-Enrich-Secret` check, for routes that accept EITHER a
 * valid secret OR an admin session. Constant-time; returns false when the header
 * is missing/wrong or when `ENRICH_SECRET` is unset (fail closed).
 */
export function enrichSecretMatches(req: NextRequest): boolean {
  const expected = process.env.ENRICH_SECRET;
  if (!expected) return false;
  return safeEqual(req.headers.get("x-enrich-secret"), expected);
}

/**
 * Shared guard for machine-to-machine admin endpoints authenticated by the
 * `X-Enrich-Secret` header (scripts / CI, which have no admin session).
 *
 * Returns a 401 `NextResponse` when the secret is missing/wrong or when
 * `ENRICH_SECRET` is unset in the environment; returns `null` when the caller
 * is authorized. Usage:
 *
 *   const denied = requireEnrichSecret(req);
 *   if (denied) return denied;
 *
 * Uses a constant-time comparison to avoid leaking the secret via response
 * timing, and fails closed when the server has no secret configured.
 */
export function requireEnrichSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.ENRICH_SECRET;
  if (!expected) {
    // Fail closed: an unset secret must never mean "allow everyone".
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-enrich-secret");
  if (!safeEqual(provided, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Guard for endpoints called BOTH from an admin browser session (the admin
 * UI) and from scripts / CI that have no session but hold `ENRICH_SECRET`.
 *
 * Authorized when the `X-Enrich-Secret` header matches `ENRICH_SECRET` OR the
 * request carries a valid admin session cookie. This lets the browser admin
 * pages stop shipping `ENRICH_SECRET` to the client while keeping the M2M
 * scripts working.
 *
 * Returns a `NextResponse` (401/403) when unauthorized, `null` when allowed.
 */
export async function requireAdminOrEnrichSecret(req: NextRequest): Promise<NextResponse | null> {
  const enrichDenied = requireEnrichSecret(req);
  if (!enrichDenied) return null;

  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }
  if (user?.role === "admin") return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Timing-safe check that the request carries `Authorization: Bearer <secret>`
 * where `<secret>` matches the given env var name. Used by scheduled job routes
 * (which set the header when `CRON_SECRET` exists) and by the live-toggle
 * route. Fails closed when the env var is unset.
 */
export function requireBearerSecret(
  req: NextRequest,
  envVar: string,
  responseText = "Unauthorized",
): NextResponse | null {
  const expected = process.env[envVar];
  if (!expected) {
    return NextResponse.json({ error: `${envVar} not configured` }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ") || !safeEqual(header.slice("Bearer ".length), expected)) {
    return NextResponse.json({ error: responseText }, { status: 401 });
  }
  return null;
}

/**
 * Session-admin gate that returns a 403 `NextResponse` instead of throwing.
 * `requireAdmin()` in src/lib/auth.ts throws on a missing/invalid session,
 * which uncaught route handlers turn into a 500. This wrapper converts that
 * to the correct 403 while keeping the fail-closed behavior.
 */
export async function adminOnly(): Promise<NextResponse | null> {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

/**
 * Boolean form of an `X-Sweep-Secret` check against `SWEEP_SECRET`.
 *
 * Exists so long-running maintenance sweeps (transcript backfill) can be driven
 * headlessly by a script without holding `ENRICH_SECRET` and without an admin
 * browser session. Kept as a separate credential so it can be rotated or
 * revoked on its own. Constant-time; fails closed when `SWEEP_SECRET` is unset.
 */
export function sweepSecretMatches(req: NextRequest): boolean {
  const expected = process.env.SWEEP_SECRET;
  if (!expected) return false;
  return safeEqual(req.headers.get("x-sweep-secret"), expected);
}
