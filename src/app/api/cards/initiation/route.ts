import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimInitiationPack } from "@/lib/cards/codex/codex";

export const dynamic = "force-dynamic";

/** Opens the free, once-per-account Initiation Pack. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    return NextResponse.json(await claimInitiationPack(user.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("already claimed")) {
      return NextResponse.json({ error: "Your Initiation Pack has already been opened." }, { status: 409 });
    }
    console.error("[cards/initiation] error:", err);
    return NextResponse.json({ error: "Failed to open the pack. Please try again." }, { status: 500 });
  }
}
