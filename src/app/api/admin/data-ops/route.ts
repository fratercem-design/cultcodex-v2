/**
 * POST /api/admin/data-ops
 * Auth: X-Enrich-Secret header
 *
 * op: "find-name"       — find all people matching a name fragment
 * op: "rename-person"   — rename a person by slug (displayName, shortBio references)
 * op: "find-ambiguous"  — find people with only a single first-name (no surname) + low appearances
 * op: "list-dupes"      — find people whose displayName is very close to another's
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function auth(req: NextRequest) {
  const s = req.headers.get("x-enrich-secret");
  if (!s || s !== process.env.ENRICH_SECRET) return false;
  return true;
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const op = String(body.op ?? "");

  // ── find-name ──────────────────────────────────────────────────────────────
  if (op === "find-name") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

    const people = await prisma.person.findMany({
      where: {
        OR: [
          { displayName: { contains: name, mode: "insensitive" } },
          { slug: { contains: name.toLowerCase().replace(/\s+/g, "-") } },
          { shortBio: { contains: name, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, displayName: true, slug: true, shortBio: true,
        _count: { select: { guestAppearances: true, quotes: true } },
      },
      take: 50,
    });
    return NextResponse.json({ op, count: people.length, people });
  }

  // ── rename-person ──────────────────────────────────────────────────────────
  if (op === "rename-person") {
    const slug = String(body.slug ?? "").trim();
    const newName = String(body.newName ?? "").trim();
    if (!slug || !newName) return NextResponse.json({ error: "slug and newName required" }, { status: 400 });

    const person = await prisma.person.findUnique({ where: { slug } });
    if (!person) return NextResponse.json({ error: `No person with slug "${slug}"` }, { status: 404 });

    const oldName = person.displayName;
    await prisma.person.update({
      where: { slug },
      data: { displayName: newName },
    });

    return NextResponse.json({ op, slug, oldName, newName, ok: true });
  }

  // ── find-ambiguous ─────────────────────────────────────────────────────────
  if (op === "find-ambiguous") {
    // People whose displayName has no space (single token = first name only)
    // or is very short (≤ 6 chars) — likely incomplete/placeholder names
    const all = await prisma.person.findMany({
      select: {
        id: true, displayName: true, slug: true, shortBio: true, personType: true,
        _count: { select: { guestAppearances: true, quotes: true } },
      },
      orderBy: { displayName: "asc" },
    });

    const ambiguous = all.filter((p) => {
      const name = p.displayName.trim();
      const tokens = name.split(/\s+/);
      return tokens.length === 1 && name.length <= 12;
    });

    return NextResponse.json({ op, count: ambiguous.length, people: ambiguous });
  }

  // ── list-dupes ─────────────────────────────────────────────────────────────
  if (op === "list-dupes") {
    const all = await prisma.person.findMany({
      select: {
        id: true, displayName: true, slug: true,
        _count: { select: { guestAppearances: true, quotes: true } },
      },
      orderBy: { displayName: "asc" },
    });

    // Group by normalized name (lowercase, no punctuation/spaces)
    const groups = new Map<string, typeof all>();
    for (const p of all) {
      const key = p.displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(p);
    }

    const dupes = [...groups.values()].filter((g) => g.length > 1);
    return NextResponse.json({ op, dupeGroups: dupes.length, dupes });
  }

  return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
}
