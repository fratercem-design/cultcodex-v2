import { NextRequest, NextResponse } from "next/server";
import { adminOnly } from "@/lib/admin-guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await adminOnly();
  if (denied) return denied;

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const person = await prisma.person.findUnique({
    where: { slug },
    select: { id: true, displayName: true },
  });

  if (!person) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(person);
}
