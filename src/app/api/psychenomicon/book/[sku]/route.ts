import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Streams a purchased book PDF from Postgres. Gated by a BookPurchase
// entitlement (admins always allowed).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params;

  const user = await getCurrentUser().catch(() => null);
  if (!user) return new Response("Sign in required", { status: 401 });

  const isAdmin = user.role === "admin";
  const owned =
    isAdmin ||
    !!(await prisma.bookPurchase
      .findUnique({ where: { userId_sku: { userId: user.id, sku } }, select: { id: true } })
      .catch(() => null));
  if (!owned) return new Response("Not purchased", { status: 403 });

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
