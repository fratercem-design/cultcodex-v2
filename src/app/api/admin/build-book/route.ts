import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildPsychenomiconVolume, DEFAULT_COUNT } from "@/lib/book/build-volume";

// Compiles the Psychenomicon Volume I PDF into BookEdition, server-side, where
// the internal DB host is reachable (the public proxy used by the CLI builder
// is flaky). Gated by an admin session OR a `?key=` token signed with
// AUTH_SECRET — key = base64url(HMAC-SHA256(AUTH_SECRET, "build-book")).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function keyValid(req: Request): boolean {
  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.AUTH_SECRET;
  if (!key || !secret) return false;
  const expected = createHmac("sha256", secret).update("build-book").digest("base64url");
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  let allowed = keyValid(req);
  if (!allowed) {
    const user = await getCurrentUser().catch(() => null);
    allowed = user?.role === "admin";
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const count = Number(new URL(req.url).searchParams.get("count")) || DEFAULT_COUNT;
  const result = await buildPsychenomiconVolume(prisma, count);
  return Response.json(result, { status: result.ok ? 200 : 500 });
}
