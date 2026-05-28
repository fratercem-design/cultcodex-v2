import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimDailyReward } from "@/lib/queries/cards";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  try {
    const result = await claimDailyReward(user.id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
