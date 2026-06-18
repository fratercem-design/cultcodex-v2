import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Streams a purchased book PDF from Postgres. Gated by a BookPurchase
// entitlement (admins always allowed), OR a valid signed `?gift=` token —
// a frictionless comp link that needs no account. Generate gift links with
// scripts/ops/gift-link.mjs (HMAC-signed with AUTH_SECRET, time-limited).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// gift token = `${expMs}.${base64url(HMAC-SHA256(AUTH_SECRET, `${sku}.${expMs}`))}`
function giftIsValid(req: Request, sku: string): boolean {
  const gift = new URL(req.url).searchParams.get("gift");
  const secret = process.env.AUTH_SECRET;
  if (!gift || !secret) return false;
  const dot = gift.indexOf(".");
  if (dot < 1) return false;
  const expStr = gift.slice(0, dot);
  const sig = gift.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false; // expired/garbage
  const expected = createHmac("sha256", secret).update(`${sku}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;

  let allowed = giftIsValid(req, sku);
  if (!allowed) {
    const user = await getCurrentUser().catch(() => null);
    if (!user) return new Response("Sign in required", { status: 401 });
    const isAdmin = user.role === "admin";
    allowed =
      isAdmin ||
      !!(await prisma.bookPurchase
        .findUnique({ where: { userId_sku: { userId: user.id, sku } }, select: { id: true } })
        .catch(() => null));
    if (!allowed) return new Response("Not purchased", { status: 403 });
  }

  const edition = await prisma.bookEdition
    .findUnique({ where: { sku }, select: { data: true, mimeType: true } })
    .catch(() => null);
  if (!edition) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(edition.data), {
    headers: {
      "Content-Type": edition.mimeType,
      "Content-Disposition": `inline; filename="${sku}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
