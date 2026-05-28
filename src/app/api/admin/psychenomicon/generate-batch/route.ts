import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/admin/psychenomicon/generate-batch
 * Body: { episodeIds: string[] }
 *
 * Calls the single-chapter generate endpoint sequentially for each episode.
 * Returns a stream-friendly JSON array of per-episode results so the UI
 * can show progress without waiting for all chapters to finish.
 *
 * Because chapters must be numbered sequentially and each one reads the
 * previous chapter's signals as context, they cannot run in parallel.
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

  const origin = req.nextUrl.origin;
  const generateUrl = `${origin}/api/admin/psychenomicon/generate`;

  const results: Array<{
    episodeId: string;
    status: "ok" | "skipped" | "error";
    chapter?: { chapterNumber: number; slug: string; title: string };
    error?: string;
  }> = [];

  for (const episodeId of episodeIds) {
    try {
      const res = await fetch(generateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward admin cookies so requireAdmin() passes
          Cookie: req.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({ episodeId }),
      });

      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        chapter?: { chapterNumber: number; slug: string; title: string };
      };

      if (res.status === 409) {
        results.push({ episodeId, status: "skipped", error: data.error });
      } else if (!res.ok || !data.ok) {
        results.push({ episodeId, status: "error", error: data.error ?? `HTTP ${res.status}` });
      } else {
        results.push({ episodeId, status: "ok", chapter: data.chapter });
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
