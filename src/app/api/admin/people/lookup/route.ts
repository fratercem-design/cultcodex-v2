import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireAdmin();

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
