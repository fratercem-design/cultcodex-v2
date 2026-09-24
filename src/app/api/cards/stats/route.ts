export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserCollectionStats } from "@/lib/queries/cards";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signalCredits: 0, lastDailyClaimAt: null, dailyStreak: 0, longestStreak: 0, ownedCount: 0, totalCards: 0, completionPct: 0 });
  const stats = await getUserCollectionStats(user.id);
  return NextResponse.json(stats);
}
