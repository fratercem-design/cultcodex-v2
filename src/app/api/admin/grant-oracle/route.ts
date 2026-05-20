import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "active",
      subscriptionTier: "system",
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  return NextResponse.json({ ok: true, message: "Oracle granted." });
}
