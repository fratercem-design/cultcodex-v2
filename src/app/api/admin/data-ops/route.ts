/**
 * POST /api/admin/data-ops
 * Auth: X-Enrich-Secret header, or X-Maint-Key header (PEOPLE_MAINT_KEY env)
 *
 * op: "find-name"        — find all people matching a name fragment
 * op: "rename-person"    — rename a person by slug (displayName, shortBio references)
 * op: "find-ambiguous"   — find people with only a single first-name (no surname) + low appearances
 * op: "list-dupes"       — find people whose displayName is very close to another's
 * op: "people-audit"     — full people-system audit (dupes, type anomalies, gaps, orphans)
 * op: "merge-people"     — merge duplicate person records: { pairs: [[sourceSlug, targetSlug]], dryRun? }
 * op: "set-person-type"  — recategorize: { changes: [{ slug, type }] }
 * op: "promote-recurring"— promote guests with ≥ threshold guest appearances: { threshold?, dryRun? }
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { PersonType } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// SHA-256 of the maintenance key (plaintext lives only on the operator's
// machine — this hash is safe to commit, like a password hash).
const MAINT_KEY_SHA256 = "1752d66f4bafec190381a695eb90fa59c98423ccba56773faaa3e611fbf7598c";

function auth(req: NextRequest) {
  const enrich = req.headers.get("x-enrich-secret");
  if (enrich && process.env.ENRICH_SECRET && safeEq(enrich, process.env.ENRICH_SECRET)) return true;
  const maint = req.headers.get("x-maint-key");
  if (maint && process.env.PEOPLE_MAINT_KEY && safeEq(maint, process.env.PEOPLE_MAINT_KEY.trim())) return true;
  if (maint && safeEq(createHash("sha256").update(maint).digest("hex"), MAINT_KEY_SHA256)) return true;
  return false;
}

// ── people maintenance helpers ───────────────────────────────────────────────

function normName(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

const PERSON_SUMMARY_SELECT = {
  id: true,
  displayName: true,
  slug: true,
  altNames: true,
  shortBio: true,
  loreSummary: true,
  avatarUrl: true,
  personType: true,
  _count: { select: { guestAppearances: true, mentions: true, quotes: true, loreConnections: true, topics: true } },
} as const;

/** Move every reference from source person → target person, enrich target, delete source. */
async function mergePerson(sourceSlug: string, targetSlug: string, dryRun: boolean) {
  const source = await prisma.person.findUnique({ where: { slug: sourceSlug }, select: PERSON_SUMMARY_SELECT });
  const target = await prisma.person.findUnique({ where: { slug: targetSlug }, select: PERSON_SUMMARY_SELECT });
  if (!source) return { sourceSlug, targetSlug, ok: false, error: "source not found" };
  if (!target) return { sourceSlug, targetSlug, ok: false, error: "target not found" };
  if (source.id === target.id) return { sourceSlug, targetSlug, ok: false, error: "source = target" };

  const moved: Record<string, number> = {};

  if (!dryRun) {
    // Guest appearances (compound key → delete + create, skip existing)
    const sourceGuests = await prisma.episodeGuest.findMany({ where: { personId: source.id } });
    const targetGuestEps = new Set(
      (await prisma.episodeGuest.findMany({ where: { personId: target.id }, select: { episodeId: true } })).map((g) => g.episodeId)
    );
    moved.guestAppearances = 0;
    for (const sg of sourceGuests) {
      await prisma.episodeGuest.delete({ where: { episodeId_personId: { episodeId: sg.episodeId, personId: source.id } } });
      if (!targetGuestEps.has(sg.episodeId)) {
        await prisma.episodeGuest.create({ data: { episodeId: sg.episodeId, personId: target.id } });
        moved.guestAppearances++;
      }
    }

    // Mentions
    const sourceMentions = await prisma.episodeMentionedPerson.findMany({ where: { personId: source.id } });
    const targetMentionEps = new Set(
      (await prisma.episodeMentionedPerson.findMany({ where: { personId: target.id }, select: { episodeId: true } })).map((m) => m.episodeId)
    );
    moved.mentions = 0;
    for (const sm of sourceMentions) {
      await prisma.episodeMentionedPerson.delete({ where: { episodeId_personId: { episodeId: sm.episodeId, personId: source.id } } });
      if (!targetMentionEps.has(sm.episodeId)) {
        await prisma.episodeMentionedPerson.create({ data: { episodeId: sm.episodeId, personId: target.id } });
        moved.mentions++;
      }
    }

    // Quotes
    moved.quotes = (await prisma.quote.updateMany({ where: { speakerPersonId: source.id }, data: { speakerPersonId: target.id } })).count;

    // Topics
    const sourceTopics = await prisma.personTopic.findMany({ where: { personId: source.id } });
    const targetTopicIds = new Set(
      (await prisma.personTopic.findMany({ where: { personId: target.id }, select: { topicId: true } })).map((t) => t.topicId)
    );
    moved.topics = 0;
    for (const st of sourceTopics) {
      await prisma.personTopic.delete({ where: { personId_topicId: { personId: source.id, topicId: st.topicId } } });
      if (!targetTopicIds.has(st.topicId)) {
        await prisma.personTopic.create({ data: { personId: target.id, topicId: st.topicId } });
        moved.topics++;
      }
    }

    // Lore
    const sourceLore = await prisma.personLore.findMany({ where: { personId: source.id } });
    const targetLoreIds = new Set(
      (await prisma.personLore.findMany({ where: { personId: target.id }, select: { loreEntryId: true } })).map((l) => l.loreEntryId)
    );
    moved.lore = 0;
    for (const sl of sourceLore) {
      await prisma.personLore.delete({ where: { personId_loreEntryId: { personId: source.id, loreEntryId: sl.loreEntryId } } });
      if (!targetLoreIds.has(sl.loreEntryId)) {
        await prisma.personLore.create({ data: { personId: target.id, loreEntryId: sl.loreEntryId } });
        moved.lore++;
      }
    }

    // Related-person edges: re-point source edges at target, skipping self-loops/dupes
    const relEdges = await prisma.relatedPerson.findMany({
      where: { OR: [{ personAId: source.id }, { personBId: source.id }] },
    });
    moved.relatedEdges = 0;
    for (const e of relEdges) {
      await prisma.relatedPerson.delete({ where: { personAId_personBId: { personAId: e.personAId, personBId: e.personBId } } });
      const newA = e.personAId === source.id ? target.id : e.personAId;
      const newB = e.personBId === source.id ? target.id : e.personBId;
      if (newA === newB) continue;
      const exists = await prisma.relatedPerson.findUnique({
        where: { personAId_personBId: { personAId: newA, personBId: newB } },
      });
      const existsRev = await prisma.relatedPerson.findUnique({
        where: { personAId_personBId: { personAId: newB, personBId: newA } },
      });
      if (!exists && !existsRev) {
        await prisma.relatedPerson.create({ data: { personAId: newA, personBId: newB } });
        moved.relatedEdges++;
      }
    }

    // PersonMedia keyed by slug (no FK) — re-point, tolerating (source,sourceId) collisions
    const mediaRows = await prisma.personMedia.findMany({ where: { personSlug: source.slug }, select: { id: true } });
    moved.media = 0;
    for (const m of mediaRows) {
      try {
        await prisma.personMedia.update({ where: { id: m.id }, data: { personSlug: target.slug } });
        moved.media++;
      } catch {
        await prisma.personMedia.delete({ where: { id: m.id } });
      }
    }

    // Annotations target person by SLUG — re-point to the surviving slug
    moved.annotations = (
      await prisma.annotation.updateMany({
        where: { targetType: "person", targetId: source.slug },
        data: { targetId: target.slug },
      })
    ).count;

    // WeeklyDigest.personIds is a soft id array — swap source id for target id
    const digests = await prisma.weeklyDigest.findMany({
      where: { personIds: { has: source.id } },
      select: { id: true, personIds: true },
    });
    moved.digests = 0;
    for (const d of digests) {
      const ids = [...new Set(d.personIds.map((id) => (id === source.id ? target.id : id)))];
      await prisma.weeklyDigest.update({ where: { id: d.id }, data: { personIds: ids } });
      moved.digests++;
    }

    // Enrich target: keep richer fields, fold source names into altNames
    const altNames = [...new Set([...target.altNames, ...source.altNames, source.displayName])].filter(
      (n) => normName(n) !== normName(target.displayName)
    );
    await prisma.person.update({
      where: { id: target.id },
      data: {
        altNames,
        shortBio: target.shortBio ?? source.shortBio,
        loreSummary: target.loreSummary ?? source.loreSummary,
        avatarUrl: target.avatarUrl ?? source.avatarUrl,
      },
    });

    // All references moved — delete source
    await prisma.person.delete({ where: { id: source.id } });
  }

  return { sourceSlug, targetSlug, ok: true, dryRun, source: source.displayName, target: target.displayName, moved };
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

  // ── people-audit ───────────────────────────────────────────────────────────
  if (op === "people-audit") {
    const people = await prisma.person.findMany({
      select: PERSON_SUMMARY_SELECT,
      orderBy: { displayName: "asc" },
    });

    const byType: Record<string, number> = {};
    for (const x of people) byType[x.personType] = (byType[x.personType] ?? 0) + 1;

    // Exact duplicate displayNames (normalized)
    const nameMap = new Map<string, typeof people>();
    for (const x of people) {
      const k = normName(x.displayName);
      if (!nameMap.has(k)) nameMap.set(k, []);
      nameMap.get(k)!.push(x);
    }
    const exactDupes = [...nameMap.entries()]
      .filter(([, g]) => g.length > 1)
      .map(([k, g]) => ({
        name: k,
        people: g.map((p) => ({
          slug: p.slug,
          type: p.personType,
          guests: p._count.guestAppearances,
          mentions: p._count.mentions,
          quotes: p._count.quotes,
          hasBio: !!p.shortBio,
          hasLore: !!p.loreSummary,
          hasAvatar: !!p.avatarUrl,
        })),
      }));

    // Slug-prefix near duplicates (report only)
    const flat = people.map((x) => ({ x, s: x.slug.replace(/-/g, "") }));
    const nearDupes: Array<{ a: string; b: string }> = [];
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) {
        const a = flat[i], b = flat[j];
        if (a.s.length >= 5 && b.s.length >= 5 && a.s !== b.s && (a.s.startsWith(b.s) || b.s.startsWith(a.s))) {
          nearDupes.push({ a: a.x.slug, b: b.x.slug });
        }
      }
    }

    // altName collisions
    const byNormName = new Map<string, (typeof people)[number]>();
    for (const x of people) byNormName.set(normName(x.displayName), x);
    const altCollisions: Array<{ altName: string; on: string; matches: string }> = [];
    for (const x of people) {
      for (const alt of x.altNames) {
        const hit = byNormName.get(normName(alt));
        if (hit && hit.id !== x.id) altCollisions.push({ altName: alt, on: x.slug, matches: hit.slug });
      }
    }

    const promoteCandidates = people
      .filter((x) => x.personType === "guest" && x._count.guestAppearances >= 3)
      .map((x) => ({ slug: x.slug, guests: x._count.guestAppearances, profiled: !!(x.shortBio || x.loreSummary) }));
    const demoteCandidates = people
      .filter((x) => x.personType === "recurring" && x._count.guestAppearances <= 1)
      .map((x) => ({ slug: x.slug, guests: x._count.guestAppearances, mentions: x._count.mentions }));
    const typeContradictions = people
      .filter((x) => x.personType === "mentioned" && x._count.guestAppearances > 0)
      .map((x) => ({ slug: x.slug, guests: x._count.guestAppearances, mentions: x._count.mentions }));
    const profiledNoAvatar = people
      .filter((x) => (x.shortBio || x.loreSummary) && !x.avatarUrl && x.personType !== "mentioned")
      .map((x) => ({ slug: x.slug, type: x.personType }));
    const prominentNoBio = people
      .filter((x) => (x.personType === "host" || x.personType === "recurring") && !x.shortBio)
      .map((x) => ({ slug: x.slug, type: x.personType }));
    const orphans = people
      .filter((x) => x._count.guestAppearances === 0 && x._count.mentions === 0 && x._count.quotes === 0)
      .map((x) => ({ slug: x.slug, type: x.personType, hasBio: !!x.shortBio, hasLore: !!x.loreSummary }));

    return NextResponse.json({
      op,
      total: people.length,
      byType,
      exactDupes,
      nearDupes,
      altCollisions,
      promoteCandidates,
      demoteCandidates,
      typeContradictions,
      profiledNoAvatar,
      prominentNoBio,
      orphans,
    });
  }

  // ── merge-people ───────────────────────────────────────────────────────────
  if (op === "merge-people") {
    const pairs = Array.isArray(body.pairs) ? (body.pairs as [string, string][]) : [];
    const dryRun = body.dryRun !== false; // default TRUE — destructive op must be opted into
    if (pairs.length === 0) return NextResponse.json({ error: "pairs required" }, { status: 400 });

    const results = [];
    for (const [sourceSlug, targetSlug] of pairs) {
      results.push(await mergePerson(String(sourceSlug), String(targetSlug), dryRun));
    }
    return NextResponse.json({ op, dryRun, results });
  }

  // ── set-person-type ────────────────────────────────────────────────────────
  if (op === "set-person-type") {
    const changes = Array.isArray(body.changes)
      ? (body.changes as Array<{ slug: string; type: string }>)
      : [];
    if (changes.length === 0) return NextResponse.json({ error: "changes required" }, { status: 400 });

    const valid = new Set(["guest", "host", "mentioned", "recurring"]);
    const results = [];
    for (const c of changes) {
      if (!valid.has(c.type)) {
        results.push({ slug: c.slug, ok: false, error: `invalid type ${c.type}` });
        continue;
      }
      const person = await prisma.person.findUnique({ where: { slug: c.slug }, select: { id: true, personType: true } });
      if (!person) {
        results.push({ slug: c.slug, ok: false, error: "not found" });
        continue;
      }
      await prisma.person.update({ where: { id: person.id }, data: { personType: c.type as PersonType } });
      results.push({ slug: c.slug, ok: true, from: person.personType, to: c.type });
    }
    return NextResponse.json({ op, results });
  }

  // ── delete-person ──────────────────────────────────────────────────────────
  // For placeholder/artifact records only. Refuses people with quotes or lore
  // links; refuses >2 episode references unless force.
  if (op === "delete-person") {
    const slugs = Array.isArray(body.slugs) ? (body.slugs as string[]) : [];
    const dryRun = body.dryRun !== false;
    const force = body.force === true;
    if (slugs.length === 0) return NextResponse.json({ error: "slugs required" }, { status: 400 });

    const results = [];
    for (const slug of slugs) {
      const person = await prisma.person.findUnique({ where: { slug: String(slug) }, select: PERSON_SUMMARY_SELECT });
      if (!person) {
        results.push({ slug, ok: false, error: "not found" });
        continue;
      }
      const refs = person._count;
      const episodeRefs = refs.guestAppearances + refs.mentions;
      if (refs.quotes > 0 || refs.loreConnections > 0) {
        results.push({ slug, ok: false, error: `has quotes(${refs.quotes})/lore(${refs.loreConnections}) — merge instead`, refs });
        continue;
      }
      if (episodeRefs > 2 && !force) {
        results.push({ slug, ok: false, error: `has ${episodeRefs} episode refs — needs force`, refs });
        continue;
      }
      if (!dryRun) {
        await prisma.person.delete({ where: { id: person.id } }); // joins cascade
      }
      results.push({ slug, ok: true, dryRun, displayName: person.displayName, refs });
    }
    return NextResponse.json({ op, dryRun, results });
  }

  // ── fix-mentioned-with-guests ──────────────────────────────────────────────
  // People typed "mentioned" that have EpisodeGuest rows — the join table is
  // the ground truth of guesting, so correct the type to "guest".
  if (op === "fix-mentioned-with-guests") {
    const dryRun = body.dryRun !== false;
    const affected = await prisma.person.findMany({
      where: { personType: "mentioned", guestAppearances: { some: {} } },
      select: { id: true, slug: true, _count: { select: { guestAppearances: true } } },
    });
    if (!dryRun && affected.length > 0) {
      await prisma.person.updateMany({
        where: { id: { in: affected.map((a) => a.id) } },
        data: { personType: "guest" },
      });
    }
    return NextResponse.json({
      op,
      dryRun,
      count: affected.length,
      sample: affected.slice(0, 20).map((a) => ({ slug: a.slug, guests: a._count.guestAppearances })),
    });
  }

  // ── promote-recurring ──────────────────────────────────────────────────────
  if (op === "promote-recurring") {
    const threshold = Number(body.threshold ?? 3);
    const dryRun = body.dryRun !== false;
    const candidates = await prisma.person.findMany({
      where: { personType: "guest" },
      select: { id: true, slug: true, displayName: true, _count: { select: { guestAppearances: true } } },
    });
    const toPromote = candidates.filter((c) => c._count.guestAppearances >= threshold);
    if (!dryRun) {
      for (const c of toPromote) {
        await prisma.person.update({ where: { id: c.id }, data: { personType: "recurring" } });
      }
    }
    return NextResponse.json({
      op,
      threshold,
      dryRun,
      promoted: toPromote.map((c) => ({ slug: c.slug, guests: c._count.guestAppearances })),
    });
  }

  return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
}
