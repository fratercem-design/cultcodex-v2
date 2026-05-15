import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET  — returns `{ saved: boolean, count: number }` for the current user.
 *        Safe for signed-out users.
 *
 * POST — toggles the save. Requires auth. Returns `{ saved, count }`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { id: true, _count: { select: { savedBy: true } } },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const saved = user
    ? !!(await prisma.savedQuote.findUnique({
        where: { userId_quoteId: { userId: user.id, quoteId: quote.id } },
      }))
    : false;

  return NextResponse.json({
    saved,
    count: quote._count.savedBy,
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.savedQuote.findUnique({
    where: { userId_quoteId: { userId: user.id, quoteId: quote.id } },
  });

  if (existing) {
    await prisma.savedQuote.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedQuote.create({
      data: { userId: user.id, quoteId: quote.id },
    });
  }

  const count = await prisma.savedQuote.count({
    where: { quoteId: quote.id },
  });

  return NextResponse.json({
    saved: !existing,
    count,
  });
}
