import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProviderStatus } from "@/lib/providers";

// Live health dashboard for every configured AI provider.
// GET /api/admin/providers → { ok, providers: { groq: true, ... }, ms }

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const start = Date.now();
  try {
    const providers = await getProviderStatus();
    const live = Object.entries(providers).filter(([, up]) => up).map(([name]) => name);
    return NextResponse.json({
      ok: true,
      providers,
      live,
      liveCount: live.length,
      ms: Date.now() - start,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err), ms: Date.now() - start },
      { status: 500 }
    );
  }
}
