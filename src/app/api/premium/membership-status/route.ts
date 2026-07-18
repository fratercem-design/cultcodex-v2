import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { TierSlug } from "@/lib/subscription-tiers";

// Per-request (reads the session cookie). Kept tiny so /premium can render
// statically (ISR) and be CDN-cached; per-user membership state resolves
// here, client-side. Mirrors /api/psychenomicon/book/ownership.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);

  let activeTier: TierSlug | null = null;
  let status: string | null = null;
  let periodEnd: string | null = null;
  let isAdmin = false;

  if (user) {
    const dbUser = await prisma.codexUser
      .findUnique({
        where: { id: user.id },
        select: {
          role: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          currentPeriodEnd: true,
          isLifetimeMember: true,
        },
      })
      .catch(() => null);

    if (dbUser) {
      isAdmin = dbUser.role === "admin";
      status = dbUser.subscriptionStatus;
      periodEnd = dbUser.currentPeriodEnd ? dbUser.currentPeriodEnd.toISOString() : null;
      const active =
        dbUser.isLifetimeMember ||
        (dbUser.subscriptionStatus === "active" &&
          !!dbUser.currentPeriodEnd &&
          dbUser.currentPeriodEnd > new Date());
      if (active && (dbUser.subscriptionTier === "access" || dbUser.subscriptionTier === "system")) {
        activeTier = dbUser.subscriptionTier;
      }
    }
  }

  return NextResponse.json(
    { signedIn: !!user, activeTier, status, periodEnd, isAdmin },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
