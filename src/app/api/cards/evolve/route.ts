import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { evolveCard } from "@/lib/cards/evolution";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { cardId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!body.cardId) return NextResponse.json({ error: "cardId required" }, { status: 400 });

  try {
    const result = await evolveCard(user.id, body.cardId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Evolution failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
