import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateChapterForEpisode } from "../generate-chapter-core";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json() as { episodeId?: string };
    const { episodeId } = body;
    if (!episodeId) return NextResponse.json({ error: "episodeId required" }, { status: 400 });

    const result = await generateChapterForEpisode(episodeId);
    if (!result.ok) {
      return NextResponse.json({ error: result.error, raw: result.raw }, { status: result.status });
    }
    return NextResponse.json({ ok: true, chapter: result.chapter });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[psychenomicon/generate] error:", msg);
    return NextResponse.json({ error: msg.slice(0, 500) }, { status: 500 });
  }
}
