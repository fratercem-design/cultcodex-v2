import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

// Per-request (reads the session cookie). Kept tiny so the rest of the
// app shell can render statically and be edge-cached.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  return NextResponse.json(
    {
      user: user
        ? { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl ?? null, role: user.role }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
