/**
 * PATCH  /api/me/saved-searches/[id] → rename, pin/unpin, or mark as run
 * DELETE /api/me/saved-searches/[id] → remove a saved search
 *
 * Auth: signed-in user. Owner-scoped — non-owners see 404.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteSavedSearch, updateSavedSearch } from "@/lib/queries/saved-searches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const patch: { label?: string; pinned?: boolean; markRun?: boolean } = {};
  if (typeof b.label === "string") patch.label = b.label.trim();
  if (typeof b.pinned === "boolean") patch.pinned = b.pinned;
  if (b.markRun === true) patch.markRun = true;

  const updated = await updateSavedSearch(user.id, id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ search: updated });
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const ok = await deleteSavedSearch(user.id, id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
