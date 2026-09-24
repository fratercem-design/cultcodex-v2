import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimSecret } from "@/lib/cards/codex/codex";

export const dynamic = "force-dynamic";

/** A hidden sigil was found. Unknown codes and repeat finds return card: null. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const code = typeof body.code === "string" ? body.code.slice(0, 64) : "";
  try {
    return NextResponse.json({ card: await claimSecret(user.id, code) });
  } catch (err) {
    console.error("[cards/secret] error:", err);
    return NextResponse.json({ card: null });
  }
}
