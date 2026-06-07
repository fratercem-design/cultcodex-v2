import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { generateChapterForEpisode } from "../generate-chapter-core";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/admin/psychenomicon/generate-batch
 * Body: { episodeIds: string[] }
 *
 * Generates chapters sequentially — calls generateChapterForEpisode directly
 * (no internal HTTP fetch, which fails on Railway due to self-referencing).
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json() as { episodeIds?: string[] };
  const { episodeIds } = body;

  if (!Array.isArray(episodeIds) || episodeIds.length === 0) {
    return NextResponse.json({ error: "episodeIds array required" }, { status: 400 });
  }
  if (episodeIds.length > 20) {
    return NextResponse.json({ error: "Maximum 20 episodes per batch" }, { status: 400 });
  }

  const results: Array<{
    episodeId: string;
    status: "ok" | "skipped" | "error";
    chapter?: { chapterNumber: number; slug: string; title: string };
    error?: string;
  }> = [];

  for (const episodeId of episodeIds) {
    try {
      const result = await generateChapterForEpisode(episodeId);
      if (!result.ok) {
        const isSkip = result.status === 409;
        results.push({ episodeId, status: isSkip ? "skipped" : "error", error: result.error });
      } else {
        results.push({ episodeId, status: "ok", chapter: result.chapter });
      }
    } catch (err) {
      results.push({ episodeId, status: "error", error: String(err).slice(0, 200) });
    }
  }

  const summary = {
    total: episodeIds.length,
    generated: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  return NextResponse.json({ ok: true, summary, results });
}
