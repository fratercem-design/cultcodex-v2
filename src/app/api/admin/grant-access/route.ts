import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { enrichSecretMatches } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Accept either: ENRICH_SECRET header (CLI/curl) OR a signed-in admin session (browser)
  const secretOk = enrichSecretMatches(req);

  if (!secretOk) {
    const sessionUser = await getCurrentUser().catch(() => null);
    if (!sessionUser || sessionUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { email, name } = await req.json();
  if (!email && !name) return NextResponse.json({ error: "email or name required" }, { status: 400 });

  // Find by email first, fall back to displayName search
  const user = email
    ? await prisma.codexUser.findUnique({ where: { email } })
    : await prisma.codexUser.findFirst({
        where: { displayName: { contains: name, mode: "insensitive" } },
      });

  if (!user) return NextResponse.json({ error: `No user found for ${email ?? name}` }, { status: 404 });

  const updated = await prisma.codexUser.update({
    where: { id: user.id },
    // Grants the lifetime Oracle (system) tier only. `role` stays untouched:
    // requireAdmin() trusts it, and admin is granted via ADMIN_EMAILS.
    data: {
      isLifetimeMember: true,
      subscriptionStatus: "active",
      subscriptionTier: "system",
      currentPeriodEnd: new Date("2099-01-01"),
      isPublicMember: true,
    },
    select: { id: true, email: true, displayName: true, role: true, isLifetimeMember: true, subscriptionStatus: true, subscriptionTier: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
