import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-enrich-secret");
  if (!secret || secret !== process.env.ENRICH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    data: {
      role: "admin",
      isLifetimeMember: true,
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2099-01-01"),
    },
    select: { id: true, email: true, displayName: true, role: true, isLifetimeMember: true, subscriptionStatus: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
