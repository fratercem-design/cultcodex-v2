import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { openPack } from "@/lib/queries/cards";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const packSlug = typeof body.packSlug === "string" ? body.packSlug : null;
  if (!packSlug) return NextResponse.json({ error: "packSlug required" }, { status: 400 });

  try {
    const cards = await openPack(user.id, packSlug);
    return NextResponse.json({ cards });
  } catch (err) {
    // Map known user-facing errors through; swallow internal DB details.
    const message = err instanceof Error ? err.message : "";
    const isUserFacing = ["not found", "insufficient", "already", "cooldown", "invalid"].some(
      (k) => message.toLowerCase().includes(k)
    );
    console.error("[open-pack] error:", err);
    return NextResponse.json(
      { error: isUserFacing ? message : "Failed to open pack. Please try again." },
      { status: 400 }
    );
  }
}
