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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
