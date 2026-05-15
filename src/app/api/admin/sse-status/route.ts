/**
 * GET /api/admin/sse-status
 *
 * Returns a JSON snapshot of the calling Node instance's PgEventBus state:
 * connection status, active channels with listener counts, and the most
 * recent log events from the in-memory ring buffer.
 *
 * Per-instance caveat: Vercel Fluid Compute runs multiple Node instances
 * per region. This endpoint reflects only the bus state of whichever
 * instance handled this request — there is no global view. That matches
 * the bus's actual scope (one bus per Node instance).
 *
 * Gated by requireAdmin() — non-admin callers receive 403.
 */
import { NextResponse } from "next/server";
import { eventBus } from "@/lib/sse/event-bus";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(eventBus.getStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
