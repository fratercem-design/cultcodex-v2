import { auth, type SessionWithCodex } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = (await auth()) as SessionWithCodex | null;
    const user = session?.codexUser ?? null;
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "no-store" } });
  }
}
