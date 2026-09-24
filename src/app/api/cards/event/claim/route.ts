import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimEventReward } from "@/lib/cards/events";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { eventId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!body.eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  try {
    const result = await claimEventReward(user.id, body.eventId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Claim failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
