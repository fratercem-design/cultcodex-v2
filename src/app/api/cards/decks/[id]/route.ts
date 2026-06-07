import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDeckById, updateDeck, deleteDeck } from "@/lib/queries/cards";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await params;
  const deck = await getDeckById(id, user.id);
  if (!deck) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deck);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const deck = await updateDeck(id, user.id, {
      name: body.name,
      description: body.description,
      cardIds: body.cardIds,
      isPublic: body.isPublic,
    });
    return NextResponse.json(deck);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteDeck(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
