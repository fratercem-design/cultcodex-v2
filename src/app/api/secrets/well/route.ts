import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimWellReward } from "@/lib/well-reward";

export const dynamic = "force-dynamic";

/** Drop a coin in the Well: a one-time credit grant for finishing the Stairwell. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json(await claimWellReward(user.id));
  } catch (err) {
    console.error("[secrets/well] error:", err);
    return NextResponse.json({ error: "The well is quiet. Try again." }, { status: 500 });
  }
}
