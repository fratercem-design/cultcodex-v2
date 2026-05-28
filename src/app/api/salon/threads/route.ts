export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSalonThread } from "@/lib/queries/salon";

/** Admin-only: create a new Salon discussion prompt. */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const pinned = body.pinned === true;

  if (!title || !prompt) {
    return NextResponse.json({ error: "title and prompt are required" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title too long (max 200)" }, { status: 400 });
  }

  const thread = await createSalonThread({ title, prompt, pinned });
  return NextResponse.json(thread, { status: 201 });
}
