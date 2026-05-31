import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { burnCard } from "@/lib/queries/cards";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { ownedCardId } = body as { ownedCardId?: string };
  if (!ownedCardId) return NextResponse.json({ error: "ownedCardId required" }, { status: 400 });

  try {
    const result = await burnCard(user.id, ownedCardId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Burn failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
