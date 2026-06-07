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
    const message = err instanceof Error ? err.message : "";
    const isUserFacing = ["already claimed", "cooldown", "not found"].some(
      (k) => message.toLowerCase().includes(k)
    );
    console.error("[daily-reward] error:", err);
    return NextResponse.json(
      { error: isUserFacing ? message : "Failed to claim reward. Please try again." },
      { status: 400 }
    );
  }
}
