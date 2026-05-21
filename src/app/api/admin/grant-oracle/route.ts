import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const target = await prisma.codexUser.update({
      where: { email: "ip2wikiinfo@gmail.com" },
      data: {
        subscriptionStatus: "active",
        subscriptionTier: "system",
        currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        isLifetimeMember: true,
      },
      select: { id: true, displayName: true, email: true },
    });
    return NextResponse.json({ ok: true, upgraded: target });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
