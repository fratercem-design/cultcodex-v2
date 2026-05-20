import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const user = await prisma.codexUser.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: `No user found for ${email}` }, { status: 404 });

  const updated = await prisma.codexUser.update({
    where: { email },
    data: {
      role: "admin",
      isLifetimeMember: true,
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2099-01-01"),
    },
    select: { id: true, email: true, displayName: true, role: true, isLifetimeMember: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
