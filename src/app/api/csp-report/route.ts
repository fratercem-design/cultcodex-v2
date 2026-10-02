/**
 * Receives CSP violation reports from the report-only policy set in
 * src/proxy.ts and writes one compact log line each. Unauthenticated by nature
 * (browsers POST it), so it is size-capped, rate-limited per client, and
 * logs only the directive and URLs with query strings and fragments removed.
 */
import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8 * 1024;

function stripUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.split(/[?#]/)[0].slice(0, 200);
}

export async function POST(req: Request) {
  if (!rateLimit(`csp-report:${clientKey(req)}`, { limit: 30, windowMs: 60_000 }).ok) {
    return new NextResponse(null, { status: 429 });
  }

  const text = await req.text().catch(() => "");
  if (!text || text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // `report-uri` sends { "csp-report": {...} }; the Reporting API sends an array
  // of { type, body: {...} }. Accept both.
  const raw = Array.isArray(body) ? (body[0] as { body?: unknown })?.body : (body as { "csp-report"?: unknown })?.["csp-report"];
  const r = (raw ?? {}) as Record<string, unknown>;

  console.warn(
    "[csp-report]",
    JSON.stringify({
      directive: String(r["effective-directive"] ?? r["violated-directive"] ?? r.effectiveDirective ?? "").slice(0, 60),
      blocked: stripUrl(r["blocked-uri"] ?? r.blockedURL),
      page: stripUrl(r["document-uri"] ?? r.documentURL),
      source: stripUrl(r["source-file"] ?? r.sourceFile),
      line: typeof r["line-number"] === "number" ? r["line-number"] : undefined,
    }),
  );

  return new NextResponse(null, { status: 204 });
}
