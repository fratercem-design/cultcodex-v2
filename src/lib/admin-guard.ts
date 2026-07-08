import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

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
