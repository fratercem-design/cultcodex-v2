/**
 * POST /api/admin/psychenomicon/deslop
 * Auth: X-Enrich-Secret header, or an admin session.
 *
 * Line-edits AI writing tics out of existing Psychenomicon chapters. Three
 * modes, so nothing reaches the live site that nobody has read:
 *
 * mode: "audit"   — READ-ONLY, no LLM. Scores every chapter with findSlop():
 *                   { minHits? } → [{ chapterNumber, title, hits, density, top }]
 * mode: "propose" — READ-ONLY. Asks the model for a rewrite of the named
 *                   chapters and returns before/after plus guard results:
 *                   { chapterNumbers: number[] (max 5) }
 * mode: "apply"   — writes proposals returned by "propose", unchanged:
 *                   { rewrites: [{ chapterNumber, updatedAt, canonText,
 *                     interpretationText, mythicText, emergingSignals }] }
 *                   A row edited since the proposal (updatedAt mismatch) or a
 *                   proposal that fails checkRewrite() is skipped.
 *
 * Titles and slugs are never touched.
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { enrichSecretMatches } from "@/lib/admin-guard";
import { enrichComplete, hasEnrichmentProvider, NO_ENRICHMENT_PROVIDER_ERROR } from "@/lib/enrichment-llm";
import {
  checkRewrite,
  DESLOP_SYSTEM_PROMPT,
  findSlop,
  parseRewrite,
  slopDensity,
  type ChapterProse,
} from "@/lib/psychenomicon-slop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_PROPOSE = 5;

const proseSelect = {
  id: true, chapterNumber: true, slug: true, title: true, updatedAt: true,
  canonText: true, interpretationText: true, mythicText: true, emergingSignals: true,
} as const;

function allText(c: ChapterProse): string {
  return [c.canonText, c.interpretationText, c.mythicText, ...c.emergingSignals].join("\n\n");
}

export async function POST(req: NextRequest) {
  if (!enrichSecretMatches(req)) {
    try {
      await requireAdmin();
    } catch {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const mode = body.mode;

  if (mode === "audit") {
    const minHits = Math.max(0, Number(body.minHits ?? 1));
    const chapters = await prisma.psychenomiconChapter.findMany({
      select: proseSelect,
      orderBy: { chapterNumber: "asc" },
    });
    const rows = chapters.map((c) => {
      const text = allText(c);
      const hits = findSlop(text);
      const counts = new Map<string, number>();
      for (const h of hits) {
        const key = h.kind === "word" || h.kind === "phrase" ? h.match : h.kind;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k}×${n}`);
      return {
        chapterNumber: c.chapterNumber,
        title: c.title,
        hits: hits.length,
        density: Math.round(slopDensity(text) * 100) / 100,
        top,
      };
    });
    const flagged = rows.filter((r) => r.hits >= minHits);
    return NextResponse.json({
      mode,
      total: rows.length,
      flagged: flagged.length,
      totalHits: rows.reduce((n, r) => n + r.hits, 0),
      chapters: flagged,
    });
  }

  if (mode === "propose") {
    if (!hasEnrichmentProvider()) {
      return NextResponse.json({ error: NO_ENRICHMENT_PROVIDER_ERROR }, { status: 503 });
    }
    const nums = Array.isArray(body.chapterNumbers)
      ? body.chapterNumbers.map(Number).filter(Number.isInteger)
      : [];
    if (nums.length === 0 || nums.length > MAX_PROPOSE) {
      return NextResponse.json({ error: `chapterNumbers: 1–${MAX_PROPOSE} integers required` }, { status: 400 });
    }
    const chapters = await prisma.psychenomiconChapter.findMany({
      where: { chapterNumber: { in: nums } },
      select: proseSelect,
      orderBy: { chapterNumber: "asc" },
    });

    const results = await Promise.all(
      chapters.map(async (c) => {
        const before: ChapterProse = {
          canonText: c.canonText,
          interpretationText: c.interpretationText,
          mythicText: c.mythicText,
          emergingSignals: c.emergingSignals,
        };
        const hitsBefore = findSlop(allText(before)).length;
        try {
          const raw = await enrichComplete({
            system: DESLOP_SYSTEM_PROMPT,
            user: `Chapter ${c.chapterNumber}: "${c.title}"\n\n${JSON.stringify(before)}`,
            maxTokens: 8000,
          });
          const after = parseRewrite(raw);
          if (!after) return { chapterNumber: c.chapterNumber, ok: false, problems: ["model returned invalid JSON"] };
          const problems = checkRewrite(before, after);
          const hitsAfter = problems.length === 0 ? findSlop(allText(after as ChapterProse)).length : null;
          return {
            chapterNumber: c.chapterNumber,
            title: c.title,
            ok: problems.length === 0,
            problems,
            hitsBefore,
            hitsAfter,
            before,
            rewrite: {
              chapterNumber: c.chapterNumber,
              updatedAt: c.updatedAt.toISOString(),
              canonText: after.canonText,
              interpretationText: after.interpretationText,
              mythicText: after.mythicText,
              emergingSignals: after.emergingSignals,
            },
          };
        } catch (err) {
          return {
            chapterNumber: c.chapterNumber,
            ok: false,
            problems: [`model call failed: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}`],
          };
        }
      }),
    );
    const missing = nums.filter((n) => !chapters.some((c) => c.chapterNumber === n));
    return NextResponse.json({ mode, missing, results });
  }

  if (mode === "apply") {
    const rewrites = Array.isArray(body.rewrites) ? (body.rewrites as Array<Record<string, unknown>>) : [];
    if (rewrites.length === 0) return NextResponse.json({ error: "rewrites[] required" }, { status: 400 });

    const results: Array<{ chapterNumber: number; status: string; problems?: string[] }> = [];
    for (const r of rewrites) {
      const chapterNumber = Number(r.chapterNumber);
      const current = await prisma.psychenomiconChapter.findUnique({
        where: { chapterNumber },
        select: proseSelect,
      });
      if (!current) {
        results.push({ chapterNumber, status: "not_found" });
        continue;
      }
      if (current.updatedAt.toISOString() !== r.updatedAt) {
        results.push({ chapterNumber, status: "stale", problems: ["chapter changed since proposal; re-run propose"] });
        continue;
      }
      const after = {
        canonText: r.canonText,
        interpretationText: r.interpretationText,
        mythicText: r.mythicText,
        emergingSignals: r.emergingSignals,
      } as ChapterProse;
      const problems = checkRewrite(current, after);
      if (problems.length > 0) {
        results.push({ chapterNumber, status: "rejected", problems });
        continue;
      }
      await prisma.psychenomiconChapter.update({ where: { id: current.id }, data: after });
      revalidatePath(`/psychenomicon/chapters/${current.slug}`);
      results.push({ chapterNumber, status: "written" });
    }
    revalidatePath("/psychenomicon/chapters");
    return NextResponse.json({ mode, results });
  }

  return NextResponse.json({ error: 'mode must be "audit", "propose" or "apply"' }, { status: 400 });
}
