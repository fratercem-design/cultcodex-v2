import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated", user: null }, { status: 403 });
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Admin only", role: user.role }, { status: 403 });
    }
    await prisma.codexUser.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "active",
        subscriptionTier: "system",
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, message: "Oracle granted.", userId: user.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
