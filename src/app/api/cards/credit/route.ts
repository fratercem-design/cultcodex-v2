import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { earnCreditsForActivity } from "@/lib/queries/cards";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ granted: 0 });

  const body = await req.json().catch(() => ({}));
  const reason = body.reason as string;
  if (reason !== "episode_read" && reason !== "lore_read") {
    return NextResponse.json({ error: "Invalid reason" }, { status: 400 });
  }

  const result = await earnCreditsForActivity(user.id, reason, body.metadata ?? {});
  return NextResponse.json(result);
}
