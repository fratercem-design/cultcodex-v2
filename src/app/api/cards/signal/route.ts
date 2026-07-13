import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSignalState } from "@/lib/cards/signal";

// Current daily Signal balance (applies the UTC daily reset as read-repair).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const state = await getSignalState(user.id);
    return NextResponse.json(state);
  } catch (err) {
    console.error("[cards/signal] error:", err);
    return NextResponse.json({ error: "Failed to read Signal" }, { status: 500 });
  }
}
