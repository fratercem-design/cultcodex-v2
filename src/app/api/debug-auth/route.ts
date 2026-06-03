import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Auth config diagnostic — shows which env vars are set (not their values). Admin only. */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const vars = {
    AUTH_SECRET:          !!process.env.AUTH_SECRET,
    NEXTAUTH_SECRET:      !!process.env.NEXTAUTH_SECRET,
    AUTH_URL:             process.env.AUTH_URL ?? null,
    NEXTAUTH_URL:         process.env.NEXTAUTH_URL ?? null,
    GOOGLE_CLIENT_ID:     !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL:         !!process.env.DATABASE_URL,
    ANTHROPIC_API_KEY:    !!process.env.ANTHROPIC_API_KEY,
    ENRICH_SECRET:        !!process.env.ENRICH_SECRET,
    STRIPE_SECRET_KEY:    !!process.env.STRIPE_SECRET_KEY,
    NODE_ENV:             process.env.NODE_ENV,
  };

  const issues: string[] = [];
  if (!vars.AUTH_SECRET && !vars.NEXTAUTH_SECRET) issues.push("Missing AUTH_SECRET");
  if (!vars.GOOGLE_CLIENT_ID) issues.push("Missing GOOGLE_CLIENT_ID");
  if (!vars.GOOGLE_CLIENT_SECRET) issues.push("Missing GOOGLE_CLIENT_SECRET");
  if (!vars.DATABASE_URL) issues.push("Missing DATABASE_URL");
  if (!vars.AUTH_URL && !vars.NEXTAUTH_URL) issues.push("Missing AUTH_URL / NEXTAUTH_URL");
  if (!vars.ANTHROPIC_API_KEY) issues.push("Missing ANTHROPIC_API_KEY — enrichment + Psychenomicon broken");
  if (!vars.ENRICH_SECRET) issues.push("Missing ENRICH_SECRET — enrichment API will reject all calls");

  return NextResponse.json({ vars, issues, ok: issues.length === 0 });
}
