import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getQuoteReactionCounts, toggleQuoteReaction } from "@/lib/queries/quote-reactions";
import { ReactionType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const VALID_REACTIONS: Set<string> = new Set([
  "fire",
  "eye",
  "moon",
  "skull",
  "wildcard",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const counts = await getQuoteReactionCounts(quote.id, user?.id);
  return NextResponse.json(counts, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
  }

  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as { type?: string };
  if (!body.type || !VALID_REACTIONS.has(body.type)) {
    return NextResponse.json(
      { error: "Invalid reaction type" },
      { status: 400 }
    );
  }

  await toggleQuoteReaction(user.id, quote.id, body.type as ReactionType);
  const counts = await getQuoteReactionCounts(quote.id, user.id);
  return NextResponse.json(counts);
}
