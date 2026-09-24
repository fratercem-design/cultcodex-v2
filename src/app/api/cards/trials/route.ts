import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { checkTrials } from "@/lib/cards/codex/codex";

export const dynamic = "force-dynamic";

/** Grants any Trial cards the viewer has earned since the last check. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const { granted } = await checkTrials(user.id);
    return NextResponse.json({ granted });
  } catch (err) {
    console.error("[cards/trials] error:", err);
    return NextResponse.json({ granted: [] });
  }
}
