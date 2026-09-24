import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Per-request (reads the session cookie). Kept tiny so /psychenomicon/book can
// render statically (ISR) and be CDN-cached; per-user ownership resolves here,
// client-side. Mirrors /api/auth/session-lite.
export const dynamic = "force-dynamic";

const DEFAULT_SKU = "psychenomicon-vol-1";

export async function GET(req: Request) {
  const sku = new URL(req.url).searchParams.get("sku") || DEFAULT_SKU;
  const user = await getCurrentUser().catch(() => null);

  let owned = false;
  if (user) {
    const purchase = await prisma.bookPurchase
      .findUnique({ where: { userId_sku: { userId: user.id, sku } }, select: { id: true } })
      .catch(() => null);
    owned = !!purchase;
  }

  return NextResponse.json(
    { signedIn: !!user, owned, isAdmin: user?.role === "admin" },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
