/**
 * POST /api/admin/data-ops
 * Auth: X-Enrich-Secret header, or X-Maint-Key header (PEOPLE_MAINT_KEY env)
 *
 * op: "find-name"        — find all people matching a name fragment
 * op: "rename-person"    — rename a person by slug (displayName, shortBio references)
 * op: "set-avatar"       — set/clear a person's avatar: { slug, avatarUrl } (empty→null, falls back to sigil)
 * op: "find-ambiguous"   — find people with only a single first-name (no surname) + low appearances
 * op: "list-dupes"       — find people whose displayName is very close to another's
 * op: "people-audit"     — full people-system audit (dupes, type anomalies, gaps, orphans)
 * op: "merge-people"     — merge duplicate person records: { pairs: [[sourceSlug, targetSlug]], dryRun? }
 * op: "set-person-type"  — recategorize: { changes: [{ slug, type }] }
 * op: "promote-recurring"— promote guests with ≥ threshold guest appearances: { threshold?, dryRun? }
 * op: "unlink-episodes"  — detach mis-attributed episode links from a person:
 *                          { slug, videoIds?: string[], episodeNumbers?: number[], types?: ("guest"|"mentioned")[], dryRun? }
 * op: "reassign-quotes"  — move quotes off a wrong speaker (to another person or null):
 *                          { fromSlug, toSlug?: string|null, quoteIds?: string[], matches?: [{ videoId, needle }], dryRun? }
 * op: "set-alt-names"    — edit a person's altNames: { slug, altNames?: string[] (full replace), remove?: string[], add?: string[], dryRun? }
 * op: "corpus-extract"   — READ-ONLY: scan episode transcripts/summaries for a person's aliases and return
 *                          keyword-context excerpts, paginated: { slug, terms?: string[], sinceDate?, page?, pageSize? }
 * op: "grant-admin"      — set a CodexUser's role to admin + lifetime system tier (mirrors /admin/grant-access):
 *                          { email, memberTitle?, dryRun? }
 * op: "clean-episode-summaries" — scrub sponsor/boilerplate prose (StreamYard promos, vidIQ, AI
 *                          preambles) from episode summaries; junk-only summaries → null so the UI
 *                          falls back: { dryRun?, fields?: ("summaryShort"|"summaryLong")[], limit? }
 * op: "fix-content-typos" — whitelisted typo fixes (Codeex→Codex, Psychonomicon→Psychenomicon)
 *                          across Episode/LoreEntry/Person text fields; slugs untouched: { dryRun? }
 * op: "apply-card-gift-migration" — idempotent DDL for the CardGift table (hand-distributed
 *                          card editions; Vercel builds don't run prisma migrate deploy)
 * op: "mint-card-gifts"   — mint single-use claim tokens for a card edition:
 *                          { cardSlug, count, edition?, note?, dryRun? }. count:0 lists existing.
 * op: "delete-no-transcript-chapters" — remove Psychenomicon chapters whose source episode
 *                          has no transcript (or no episode at all), plus their art assets
 *                          and archetype events: { dryRun? }
 * op: "delete-no-transcript-episodes" — remove blank archive episodes with no transcript
 *                          (no segments, no transcriptRaw). Engagement/chaptered episodes
 *                          are skipped unless force:true: { dryRun?, force? }
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanSummary, isJunkSummary, isTemplateJunk } from "@/lib/content-hygiene";
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

// ── YouTube avatar helpers ───────────────────────────────────────────────────

type YtThumbs = { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
interface YtChannelResponse { items?: Array<{ id: string; snippet: { title: string; thumbnails: YtThumbs } }> }
interface YtSearchResponse { items?: Array<{ snippet?: { title?: string; channelTitle?: string; thumbnails?: YtThumbs } }> }

function pickThumb(t: YtThumbs): string {
  return t.high?.url ?? t.medium?.url ?? t.default?.url ?? "";
}

/** Extract @handle or channel ID from a YouTube URL or bare handle. */
function parseChannelInput(input: string): { type: "handle" | "id"; value: string } | null {
  const s = input.trim();
  if (/^@[\w.-]+$/.test(s)) return { type: "handle", value: s };
  const handleMatch = s.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) return { type: "handle", value: `@${handleMatch[1]}` };
  const idMatch = s.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (idMatch) return { type: "id", value: idMatch[1] };
  const customMatch = s.match(/youtube\.com\/c\/([\w.-]+)/);
  if (customMatch) return { type: "handle", value: `@${customMatch[1]}` };
  return null;
}

/**
 * Confidence that a YouTube channel title refers to this person.
 *
 * Deliberately does NOT use substring containment: "Doug" is a substring of
 * "Doug's Gaming Corner" and "LD" of "LD Shadow Lady", which would staple a
 * stranger's face onto a real person's profile. Single-token names can only
 * ever reach "low" — they are inherently ambiguous and need human review.
 */
function nameConfidence(personName: string, channelTitle: string): "high" | "medium" | "low" | "none" {
  const a = normName(personName);
  const b = normName(channelTitle);
  if (!a || !b) return "none";

  const tokensA = a.split(" ").filter(Boolean);
  const tokensB = b.split(" ").filter(Boolean);

  if (a === b) return tokensA.length >= 2 ? "high" : "low";
  if (tokensA.length < 2) return "none"; // single-token, inexact → never guess

  const setB = new Set(tokensB);
  const shared = tokensA.filter((t) => setB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  if (shared >= 2 && union > 0 && shared / union >= 0.6) return "medium";
  return "none";
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

  // ── apply-subscriber-gift-migration ─────────────────────────────────────────
  // One-shot idempotent DDL for the Gospel lead-magnet (migrations
  // 20260707000000/1). Vercel builds don't run prisma migrate deploy and the
  // prod DATABASE_URL is sensitive-flagged, so this is the operator path.
  if (op === "apply-subscriber-gift-migration") {
    const stmts = [
      `ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "name" TEXT`,
      `ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "source" TEXT`,
      `ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "giftStage" INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lastEmailAt" TIMESTAMP(3)`,
      `CREATE INDEX IF NOT EXISTS "Subscriber_giftStage_idx" ON "Subscriber"("giftStage")`,
    ];
    const steps: Array<{ sql: string; ok: boolean; error?: string }> = [];
    for (const sql of stmts) {
      try {
        await prisma.$executeRawUnsafe(sql);
        steps.push({ sql, ok: true });
      } catch (err) {
        steps.push({ sql, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return NextResponse.json({ op, ok: steps.every((s) => s.ok), steps });
  }

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

  // ── set-avatar ───────────────────────────────────────────────────────────────
  // { slug, avatarUrl } — set or clear a person's avatar. Empty/null avatarUrl
  // clears it (null), so the UI falls back to the gender-neutral PersonSigil.
  if (op === "set-avatar") {
    const slug = String(body.slug ?? "").trim();
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const raw = body.avatarUrl;
    const avatarUrl =
      raw === null || raw === undefined || String(raw).trim() === "" ? null : String(raw).trim();

    const person = await prisma.person.findUnique({
      where: { slug },
      select: { slug: true, displayName: true, avatarUrl: true },
    });
    if (!person) return NextResponse.json({ error: `No person with slug "${slug}"` }, { status: 404 });

    const before = person.avatarUrl;
    await prisma.person.update({ where: { slug }, data: { avatarUrl } });
    return NextResponse.json({ op, slug, displayName: person.displayName, before, after: avatarUrl, ok: true });
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
    // People whose avatar is a YouTube channel image — mislink-prone (a channel pic
    // attached to the wrong person, e.g. the Shan Camp case). Eyeball these for wrong-gender/wrong-person.
    const ytChannelAvatars = people
      .filter((x) => x.avatarUrl && /ggpht\.com|(^|\/)yt3\./.test(x.avatarUrl))
      .map((x) => ({ slug: x.slug, type: x.personType, name: x.displayName, avatarUrl: x.avatarUrl }));

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
      ytChannelAvatars,
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

  // ── avatar-audit ───────────────────────────────────────────────────────────
  // Scopes the avatar backfill and its YouTube quota cost before spending any.
  // channels.list (by handle/id) = 1 quota unit; search.list = 100 units.
  if (op === "avatar-audit") {
    const profiledNoAvatar = await prisma.person.findMany({
      where: {
        avatarUrl: null,
        personType: { not: "mentioned" },
        OR: [{ shortBio: { not: null } }, { loreSummary: { not: null } }],
      },
      select: { slug: true, displayName: true, youtubeChannelUrl: true, personType: true },
      orderBy: { guestAppearances: { _count: "desc" } },
    });

    const withChannel = profiledNoAvatar.filter((p) => !!p.youtubeChannelUrl);
    const needSearch = profiledNoAvatar.filter((p) => !p.youtubeChannelUrl);
    const singleToken = needSearch.filter((p) => normName(p.displayName).split(" ").length < 2);

    return NextResponse.json({
      op,
      profiledNoAvatar: profiledNoAvatar.length,
      tierA_hasChannelUrl: withChannel.length,
      tierA_quotaUnits: withChannel.length * 1,
      tierB_needsSearch: needSearch.length,
      tierB_quotaUnits: needSearch.length * 100,
      tierB_singleTokenNames: singleToken.length,
      dailyQuotaDefault: 10000,
      sampleTierA: withChannel.slice(0, 10).map((p) => ({ slug: p.slug, url: p.youtubeChannelUrl })),
      sampleSingleToken: singleToken.slice(0, 15).map((p) => p.displayName),
    });
  }

  // ── sync-avatars ───────────────────────────────────────────────────────────
  // Two-tier avatar backfill. dryRun default TRUE. Only "high" confidence is
  // ever written by default — misattributing a face on a public archive about
  // real people is the failure mode this op exists to prevent.
  if (op === "sync-avatars") {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });

    const dryRun = body.dryRun !== false;
    const tier = body.tier === "search" ? "search" : "channel";
    const limit = Math.min(Math.max(1, Number(body.limit ?? 25)), 60);
    const minConfidence = String(body.minConfidence ?? "high");

    const baseWhere = {
      avatarUrl: null,
      personType: { not: "mentioned" as PersonType },
      OR: [{ shortBio: { not: null } }, { loreSummary: { not: null } }],
    };

    const people = await prisma.person.findMany({
      where: tier === "channel"
        ? { ...baseWhere, youtubeChannelUrl: { not: null } }
        // search tier: only multi-token names — single-token names can never
        // clear nameConfidence, so searching them is pure wasted quota.
        : { ...baseWhere, youtubeChannelUrl: null, displayName: { contains: " " } },
      select: { id: true, slug: true, displayName: true, youtubeChannelUrl: true },
      orderBy: { guestAppearances: { _count: "desc" } },
      take: limit,
    });

    const results: Array<Record<string, unknown>> = [];
    let quotaSpent = 0;

    for (const person of people) {
      try {
        let thumbnail = "";
        let channelTitle = "";
        let confidence = "none";

        if (tier === "channel") {
          const parsed = parseChannelInput(person.youtubeChannelUrl ?? "");
          if (!parsed) {
            results.push({ slug: person.slug, status: "unparseable_url", url: person.youtubeChannelUrl });
            continue;
          }
          const qs = new URLSearchParams({
            part: "snippet",
            key: apiKey,
            maxResults: "1",
            ...(parsed.type === "handle" ? { forHandle: parsed.value } : { id: parsed.value }),
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${qs}`);
          quotaSpent += 1;
          if (!res.ok) {
            results.push({ slug: person.slug, status: "yt_error", code: res.status });
            continue;
          }
          const data = (await res.json()) as YtChannelResponse;
          const ch = data.items?.[0];
          if (!ch) {
            results.push({ slug: person.slug, status: "no_channel" });
            continue;
          }
          thumbnail = pickThumb(ch.snippet.thumbnails);
          channelTitle = ch.snippet.title;
          // The operator already vouched for this channel URL — deterministic.
          confidence = "high";
        } else {
          const qs = new URLSearchParams({
            part: "snippet",
            key: apiKey,
            q: person.displayName,
            type: "channel",
            maxResults: "3",
          });
          const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${qs}`);
          quotaSpent += 100;
          if (!res.ok) {
            results.push({ slug: person.slug, status: "yt_error", code: res.status });
            if (res.status === 403) break; // quota exhausted — stop burning calls
            continue;
          }
          const data = (await res.json()) as YtSearchResponse;
          for (const item of data.items ?? []) {
            const title = item.snippet?.channelTitle ?? item.snippet?.title ?? "";
            const thumb = pickThumb(item.snippet?.thumbnails ?? {});
            if (!thumb) continue;
            const c = nameConfidence(person.displayName, title);
            if (c !== "none") {
              thumbnail = thumb;
              channelTitle = title;
              confidence = c;
              break;
            }
          }
          if (!thumbnail) {
            results.push({ slug: person.slug, name: person.displayName, status: "no_match" });
            continue;
          }
        }

        const rank = { high: 3, medium: 2, low: 1, none: 0 } as Record<string, number>;
        const willWrite = rank[confidence] >= (rank[minConfidence] ?? 3);

        if (willWrite && !dryRun) {
          await prisma.person.update({ where: { id: person.id }, data: { avatarUrl: thumbnail } });
        }

        results.push({
          slug: person.slug,
          name: person.displayName,
          status: willWrite ? (dryRun ? "would_write" : "written") : "needs_review",
          confidence,
          channelTitle,
          avatarUrl: thumbnail,
        });
      } catch (err) {
        results.push({ slug: person.slug, status: "error", error: err instanceof Error ? err.message.slice(0, 120) : String(err) });
      }
    }

    const remaining = await prisma.person.count({ where: baseWhere });
    return NextResponse.json({
      op,
      tier,
      dryRun,
      minConfidence,
      processed: results.length,
      quotaSpent,
      written: results.filter((r) => r.status === "written").length,
      wouldWrite: results.filter((r) => r.status === "would_write").length,
      needsReview: results.filter((r) => r.status === "needs_review").length,
      noMatch: results.filter((r) => r.status === "no_match").length,
      remaining,
      results,
    });
  }

  // ── noise-audit ──────────────────────────────────────────────────────────────
  // Surfaces placeholder / label records masquerading as people — generic role
  // words ("Special Guest", "Panelist"), parenthetical labels ("(unnamed)"),
  // and number/gibberish handles. Read-only. Buckets by deletion safety:
  // a record is "safe delete" only if it's a label AND has 0 quotes AND 0 lore.
  if (op === "noise-audit") {
    // Generic role/label terms that are descriptors, not names.
    const LABEL_TERMS = new Set([
      "guest", "guests", "special guest", "special guests", "mystery guest", "guest speaker",
      "panelist", "panelists", "panel", "panel member", "panel guest", "recurring panelist",
      "recurring guest", "recurring guests", "recurring panel", "recurring panel guest",
      "cohost", "co host", "co hosts", "host", "hosts", "guest host", "moderator", "mod",
      "narrator", "viewer", "viewers", "audience", "chat", "chatter", "caller", "callers",
      "someone", "somebody", "anonymous", "anon", "unknown", "unnamed", "various", "multiple",
      "member", "members", "guest 1", "guest 2", "guest 3", "person", "people", "speaker",
      "unidentified", "tbd", "na", "n a", "none", "test",
    ]);
    // Words that, if present as a token, strongly suggest a label rather than a name.
    const LABEL_TOKENS = ["unnamed", "unknown", "unidentified", "anonymous", "recurring", "panelist"];

    const people = await prisma.person.findMany({
      select: PERSON_SUMMARY_SELECT,
      orderBy: { displayName: "asc" },
    });

    const rows = people.map((p) => {
      const n = normName(p.displayName);
      const tokens = n.split(" ").filter(Boolean);
      const isLabel = LABEL_TERMS.has(n);
      const hasLabelToken = tokens.some((t) => LABEL_TOKENS.includes(t)) || /\(.*(unnamed|unknown|tbd).*\)/i.test(p.displayName);
      const isNumberish = /^[0-9]+$/.test(n.replace(/\s/g, "")) || (tokens.length === 1 && /\d{3,}/.test(n));
      const hasContent = p._count.quotes > 0 || p._count.loreConnections > 0;
      const totalRefs = p._count.guestAppearances + p._count.mentions;
      let bucket: string | null = null;
      if (isLabel) bucket = "label";
      else if (hasLabelToken) bucket = "label_token";
      else if (isNumberish) bucket = "numberish";
      if (!bucket) return null;
      return {
        slug: p.slug,
        name: p.displayName,
        type: p.personType,
        bucket,
        appearances: totalRefs,
        quotes: p._count.quotes,
        lore: p._count.loreConnections,
        hasBio: !!p.shortBio,
        safeDelete: bucket !== "numberish" && !hasContent && totalRefs <= 3,
      };
    }).filter(Boolean) as Array<Record<string, unknown>>;

    return NextResponse.json({
      op,
      total: people.length,
      flagged: rows.length,
      safeDeleteCount: rows.filter((r) => r.safeDelete).length,
      byBucket: {
        label: rows.filter((r) => r.bucket === "label").length,
        label_token: rows.filter((r) => r.bucket === "label_token").length,
        numberish: rows.filter((r) => r.bucket === "numberish").length,
      },
      records: rows,
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

  // ── unlink-episodes ────────────────────────────────────────────────────────
  // Detach mis-attributed episode links (guest and/or mention) from a person,
  // WITHOUT touching the episode or other people. For de-merges where a wrong
  // episode got tagged to the wrong person.
  if (op === "unlink-episodes") {
    const slug = String(body.slug ?? "").trim();
    const videoIds = Array.isArray(body.videoIds) ? body.videoIds.map(String) : [];
    const episodeNumbers = Array.isArray(body.episodeNumbers) ? body.episodeNumbers.map(Number) : [];
    const types = Array.isArray(body.types) && body.types.length
      ? (body.types as string[]).filter((t) => t === "guest" || t === "mentioned")
      : ["guest", "mentioned"];
    const dryRun = body.dryRun !== false; // default TRUE
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    if (!videoIds.length && !episodeNumbers.length)
      return NextResponse.json({ error: "videoIds or episodeNumbers required" }, { status: 400 });

    const person = await prisma.person.findUnique({ where: { slug }, select: { id: true, displayName: true } });
    if (!person) return NextResponse.json({ error: `No person with slug "${slug}"` }, { status: 404 });

    const eps = await prisma.episode.findMany({
      where: {
        OR: [
          videoIds.length ? { youtubeVideoId: { in: videoIds } } : undefined,
          episodeNumbers.length ? { episodeNumber: { in: episodeNumbers } } : undefined,
        ].filter(Boolean) as object[],
      },
      select: { id: true, episodeNumber: true, title: true, youtubeVideoId: true },
    });

    const results = [];
    for (const ep of eps) {
      const g = types.includes("guest")
        ? await prisma.episodeGuest.findUnique({ where: { episodeId_personId: { episodeId: ep.id, personId: person.id } } })
        : null;
      const m = types.includes("mentioned")
        ? await prisma.episodeMentionedPerson.findUnique({ where: { episodeId_personId: { episodeId: ep.id, personId: person.id } } })
        : null;
      if (!dryRun) {
        if (g) await prisma.episodeGuest.delete({ where: { episodeId_personId: { episodeId: ep.id, personId: person.id } } });
        if (m) await prisma.episodeMentionedPerson.delete({ where: { episodeId_personId: { episodeId: ep.id, personId: person.id } } });
      }
      results.push({ videoId: ep.youtubeVideoId, episodeNumber: ep.episodeNumber, title: ep.title, removedGuest: !!g, removedMention: !!m });
    }
    return NextResponse.json({ op, slug, person: person.displayName, dryRun, results });
  }

  // ── reassign-quotes ────────────────────────────────────────────────────────
  // Move quotes off a wrong speaker. toSlug omitted/null → speaker set to null
  // (unattributed, safer than mis-attributed). Select by explicit quoteIds
  // and/or by { videoId, needle } text matches scoped to the current speaker.
  if (op === "reassign-quotes") {
    const fromSlug = String(body.fromSlug ?? "").trim();
    const toSlugRaw = body.toSlug;
    const quoteIds = Array.isArray(body.quoteIds) ? body.quoteIds.map(String) : [];
    const matches = Array.isArray(body.matches) ? (body.matches as Array<{ videoId: string; needle: string }>) : [];
    const dryRun = body.dryRun !== false; // default TRUE
    if (!fromSlug) return NextResponse.json({ error: "fromSlug required" }, { status: 400 });
    if (!quoteIds.length && !matches.length)
      return NextResponse.json({ error: "quoteIds or matches required" }, { status: 400 });

    const from = await prisma.person.findUnique({ where: { slug: fromSlug }, select: { id: true, displayName: true } });
    if (!from) return NextResponse.json({ error: `No person with slug "${fromSlug}"` }, { status: 404 });

    let toId: string | null = null;
    let toName: string | null = null;
    if (toSlugRaw !== null && toSlugRaw !== undefined && String(toSlugRaw).trim() !== "") {
      const to = await prisma.person.findUnique({ where: { slug: String(toSlugRaw).trim() }, select: { id: true, displayName: true } });
      if (!to) return NextResponse.json({ error: `No target person with slug "${toSlugRaw}"` }, { status: 404 });
      toId = to.id; toName = to.displayName;
    }

    const ids = new Set<string>(quoteIds);
    for (const mm of matches) {
      const ep = await prisma.episode.findFirst({ where: { youtubeVideoId: String(mm.videoId) }, select: { id: true } });
      const qs = await prisma.quote.findMany({
        where: { speakerPersonId: from.id, episodeId: ep?.id, text: { contains: String(mm.needle), mode: "insensitive" } },
        select: { id: true },
      });
      for (const q of qs) ids.add(q.id);
    }

    // Only reassign quotes that currently belong to `from` (safety)
    const targets = await prisma.quote.findMany({
      where: { id: { in: [...ids] }, speakerPersonId: from.id },
      select: { id: true, text: true, episodeId: true },
    });
    if (!dryRun && targets.length) {
      await prisma.quote.updateMany({ where: { id: { in: targets.map((t) => t.id) } }, data: { speakerPersonId: toId } });
    }
    return NextResponse.json({
      op, fromSlug, from: from.displayName, toSlug: toId ? String(toSlugRaw) : null, to: toName, dryRun,
      count: targets.length,
      quotes: targets.map((t) => ({ id: t.id, text: t.text.slice(0, 80) })),
    });
  }

  // ── set-alt-names ──────────────────────────────────────────────────────────
  // Edit a person's altNames. Provide `altNames` for a full replace, or
  // `remove`/`add` arrays for a surgical edit. Case-sensitive exact match on remove.
  if (op === "set-alt-names") {
    const slug = String(body.slug ?? "").trim();
    const dryRun = body.dryRun !== false; // default TRUE
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const person = await prisma.person.findUnique({ where: { slug }, select: { id: true, displayName: true, altNames: true } });
    if (!person) return NextResponse.json({ error: `No person with slug "${slug}"` }, { status: 404 });

    let after: string[];
    if (Array.isArray(body.altNames)) {
      after = [...new Set((body.altNames as unknown[]).map(String).map((s) => s.trim()).filter(Boolean))];
    } else {
      const remove = new Set((Array.isArray(body.remove) ? body.remove : []).map(String));
      const add = (Array.isArray(body.add) ? body.add : []).map(String).map((s) => s.trim()).filter(Boolean);
      after = [...new Set([...person.altNames.filter((n) => !remove.has(n)), ...add])];
    }
    if (!dryRun) await prisma.person.update({ where: { id: person.id }, data: { altNames: after } });
    return NextResponse.json({ op, slug, person: person.displayName, dryRun, before: person.altNames, after });
  }

  // ── corpus-extract ─────────────────────────────────────────────────────────
  // READ-ONLY. Scan episodes whose transcript/summary/title mentions a person's
  // aliases, return keyword-context excerpts. Paginated by airDate so each call
  // stays under the serverless time budget. No writes.
  if (op === "corpus-extract") {
    const slug = String(body.slug ?? "").trim();
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const person = await prisma.person.findUnique({ where: { slug }, select: { displayName: true, altNames: true } });
    if (!person) return NextResponse.json({ error: `No person with slug "${slug}"` }, { status: 404 });

    const defaultTerms = [...new Set([person.displayName, ...person.altNames])]
      .flatMap((n) => n.split("/"))
      .map((s) => s.trim())
      .filter((s) => s.length >= 4);
    const terms = Array.isArray(body.terms) && body.terms.length ? (body.terms as string[]).map(String) : defaultTerms;
    const sinceDate = body.sinceDate ? new Date(String(body.sinceDate)) : null;
    const page = Math.max(0, Number(body.page ?? 0));
    const pageSize = Math.min(40, Math.max(1, Number(body.pageSize ?? 20)));

    const or = [];
    for (const t of terms) {
      or.push({ transcriptRaw: { contains: t, mode: "insensitive" as const } });
      or.push({ summaryFacts: { contains: t, mode: "insensitive" as const } });
      or.push({ title: { contains: t, mode: "insensitive" as const } });
    }
    const where: Record<string, unknown> = { OR: or };
    if (sinceDate && !isNaN(sinceDate.getTime())) where.airDate = { gt: sinceDate };

    const total = await prisma.episode.count({ where });
    const eps = await prisma.episode.findMany({
      where,
      select: { episodeNumber: true, title: true, airDate: true, youtubeVideoId: true, summaryFacts: true, transcriptRaw: true },
      orderBy: { airDate: "asc" },
      skip: page * pageSize,
      take: pageSize,
    });

    const alias = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const strip = (s: string | null) => (s || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    const windows = (text: string) => {
      const hits: string[] = []; const seen = new Set<string>(); let m: RegExpExecArray | null;
      alias.lastIndex = 0;
      while ((m = alias.exec(text)) && hits.length < 12) {
        const s = Math.max(0, m.index - 180), e = Math.min(text.length, m.index + 200);
        const snip = text.slice(s, e).trim(); const k = snip.slice(20, 70);
        if (seen.has(k)) continue; seen.add(k); hits.push(`…${snip}…`);
      }
      return hits;
    };

    const results = eps.map((e) => {
      const t = strip(e.transcriptRaw);
      return {
        episodeNumber: e.episodeNumber,
        title: e.title,
        airDate: e.airDate,
        youtubeVideoId: e.youtubeVideoId,
        transcriptChars: t.length,
        summaryFacts: strip(e.summaryFacts).slice(0, 600),
        excerpts: windows(t),
      };
    });

    return NextResponse.json({
      op, slug, person: person.displayName, terms,
      sinceDate: sinceDate ? sinceDate.toISOString() : null,
      total, page, pageSize, pages: Math.ceil(total / pageSize),
      results,
    });
  }

  // ── grant-admin ────────────────────────────────────────────────────────────
  // Set a CodexUser's role to admin + lifetime system tier. Mirrors the existing
  // /api/admin/grant-access route, but authed via x-maint-key so it can run
  // without the (Vercel-sensitive) ENRICH_SECRET. Optional memberTitle flair.
  if (op === "grant-admin") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const memberTitle = body.memberTitle != null ? String(body.memberTitle).trim() : undefined;
    const dryRun = body.dryRun === true; // default APPLY (explicit grant); pass dryRun:true to preview
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const user = await prisma.codexUser.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, role: true, isLifetimeMember: true, subscriptionTier: true, memberTitle: true },
    });
    if (!user) return NextResponse.json({ error: `No CodexUser with email "${email}" — they must sign in to cultcodex once first` }, { status: 404 });

    if (dryRun) {
      return NextResponse.json({ op, email, dryRun: true, before: user, wouldSet: { role: "admin", isLifetimeMember: true, subscriptionTier: "system", ...(memberTitle ? { memberTitle } : {}) } });
    }

    const updated = await prisma.codexUser.update({
      where: { id: user.id },
      data: {
        role: "admin",
        isLifetimeMember: true,
        subscriptionStatus: "active",
        subscriptionTier: "system",
        currentPeriodEnd: new Date("2099-01-01"),
        isPublicMember: true,
        ...(memberTitle ? { memberTitle } : {}),
      },
      select: { id: true, email: true, displayName: true, role: true, isLifetimeMember: true, subscriptionStatus: true, subscriptionTier: true, memberTitle: true },
    });
    return NextResponse.json({ op, dryRun: false, before: { role: user.role, tier: user.subscriptionTier, memberTitle: user.memberTitle }, user: updated });
  }

  // ── clean-episode-summaries ─────────────────────────────────────────────────
  // Scrub sponsor/boilerplate prose from episode summaries via the shared
  // content-hygiene patterns. Summaries that are junk-only after cleaning are
  // nulled so the UI falls back instead of rendering boilerplate.
  if (op === "clean-episode-summaries") {
    const dryRun = body.dryRun !== false;
    const requested = Array.isArray(body.fields) ? (body.fields as string[]) : [];
    const fields = (requested.length ? requested : ["summaryShort", "summaryLong"]).filter(
      (f): f is "summaryShort" | "summaryLong" => f === "summaryShort" || f === "summaryLong"
    );
    if (!fields.length) return NextResponse.json({ error: "no valid fields" }, { status: 400 });
    const limit = body.limit != null ? Math.max(1, Number(body.limit)) : null;

    const eps = await prisma.episode.findMany({
      where: { OR: fields.map((f) => ({ [f]: { not: null } })) },
      select: { id: true, episodeNumber: true, title: true, summaryShort: true, summaryLong: true },
      orderBy: { airDate: "asc" },
    });

    type SummaryChange = {
      id: string;
      episodeNumber: number | null;
      title: string | null;
      field: "summaryShort" | "summaryLong";
      before: string;
      after: string | null;
    };
    const changes: SummaryChange[] = [];
    outer: for (const ep of eps) {
      for (const field of fields) {
        const raw = ep[field];
        if (!raw) continue;
        const templateJunk = isTemplateJunk(raw);
        const cleaned = cleanSummary(raw);
        if (!templateJunk && cleaned === raw) continue;
        changes.push({
          id: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          field,
          before: raw,
          after: templateJunk || isJunkSummary(cleaned) ? null : cleaned,
        });
        if (limit && changes.length >= limit) break outer;
      }
    }

    const nulled = changes.filter((c) => c.after === null).length;
    if (!dryRun) {
      for (const c of changes) {
        await prisma.episode.update({ where: { id: c.id }, data: { [c.field]: c.after } });
      }
    }

    return NextResponse.json({
      op,
      dryRun,
      scanned: eps.length,
      changed: changes.length,
      nulled,
      samples: changes.slice(0, 15).map((c) => ({
        episodeNumber: c.episodeNumber,
        title: c.title?.slice(0, 60),
        field: c.field,
        before: c.before.slice(0, 120),
        after: c.after === null ? "(null)" : c.after.slice(0, 120),
      })),
    });
  }

  // ── fix-content-typos ───────────────────────────────────────────────────────
  // Whitelisted, word-boundary typo replacements across content text fields.
  // Slugs are deliberately untouched — URL stability over spelling.
  if (op === "fix-content-typos") {
    const dryRun = body.dryRun !== false;
    const FIXES = [
      { find: "Codeex", needle: /\bCodeex\b/g, replacement: "Codex" },
      { find: "Psychonomicon", needle: /\bPsychonomicon\b/g, replacement: "Psychenomicon" },
    ];
    const applyFixes = (s: string) => FIXES.reduce((out, f) => out.replace(f.needle, f.replacement), s);
    const excerpt = (s: string) => {
      const i = FIXES.map((f) => s.search(f.needle)).filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? 0;
      return s.slice(Math.max(0, i - 40), i + 60);
    };
    const needleOr = FIXES.map((f) => f.find);

    type TypoSample = { table: string; ref: string; field: string; before: string; after: string };
    const samples: TypoSample[] = [];
    const counts: Record<string, number> = { episode: 0, loreEntry: 0, person: 0 };

    // Episodes
    const epFields = ["summaryShort", "summaryLong"] as const;
    const eps = await prisma.episode.findMany({
      where: { OR: needleOr.flatMap((n) => epFields.map((f) => ({ [f]: { contains: n } }))) },
      select: { id: true, episodeNumber: true, summaryShort: true, summaryLong: true },
    });
    for (const ep of eps) {
      const data: Record<string, string> = {};
      for (const f of epFields) {
        const raw = ep[f];
        if (!raw) continue;
        const fixed = applyFixes(raw);
        if (fixed === raw) continue;
        data[f] = fixed;
        if (samples.length < 10)
          samples.push({ table: "episode", ref: `ep.${ep.episodeNumber ?? "?"}`, field: f, before: excerpt(raw), after: excerpt(fixed) });
      }
      if (Object.keys(data).length) {
        counts.episode++;
        if (!dryRun) await prisma.episode.update({ where: { id: ep.id }, data });
      }
    }

    // Lore entries (title + body text; slug untouched)
    const loreFields = ["title", "summary", "fullEntry", "searchText"] as const;
    const lore = await prisma.loreEntry.findMany({
      where: { OR: needleOr.flatMap((n) => loreFields.map((f) => ({ [f]: { contains: n } }))) },
      select: { id: true, slug: true, title: true, summary: true, fullEntry: true, searchText: true },
    });
    for (const le of lore) {
      const data: Record<string, string> = {};
      for (const f of loreFields) {
        const raw = le[f];
        if (!raw) continue;
        const fixed = applyFixes(raw);
        if (fixed === raw) continue;
        data[f] = fixed;
        if (samples.length < 10)
          samples.push({ table: "loreEntry", ref: le.slug, field: f, before: excerpt(raw), after: excerpt(fixed) });
      }
      if (Object.keys(data).length) {
        counts.loreEntry++;
        if (!dryRun) await prisma.loreEntry.update({ where: { id: le.id }, data });
      }
    }

    // People
    const personFields = ["shortBio", "loreSummary"] as const;
    const people = await prisma.person.findMany({
      where: { OR: needleOr.flatMap((n) => personFields.map((f) => ({ [f]: { contains: n } }))) },
      select: { id: true, slug: true, shortBio: true, loreSummary: true },
    });
    for (const p of people) {
      const data: Record<string, string> = {};
      for (const f of personFields) {
        const raw = p[f];
        if (!raw) continue;
        const fixed = applyFixes(raw);
        if (fixed === raw) continue;
        data[f] = fixed;
        if (samples.length < 10)
          samples.push({ table: "person", ref: p.slug, field: f, before: excerpt(raw), after: excerpt(fixed) });
      }
      if (Object.keys(data).length) {
        counts.person++;
        if (!dryRun) await prisma.person.update({ where: { id: p.id }, data });
      }
    }

    return NextResponse.json({ op, dryRun, fixes: FIXES.map((f) => `${f.find}→${f.replacement}`), counts, samples });
  }

  // ── apply-card-gift-migration ───────────────────────────────────────────────
  // Idempotent DDL for CardGift (single-use claim tokens for hand-distributed
  // card editions). Same operator path as apply-subscriber-gift-migration.
  if (op === "apply-card-gift-migration") {
    const stmts = [
      `CREATE TABLE IF NOT EXISTS "CardGift" (
        "id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "cardId" TEXT NOT NULL,
        "serial" INTEGER NOT NULL,
        "edition" TEXT NOT NULL DEFAULT 'founders',
        "note" TEXT,
        "claimed" BOOLEAN NOT NULL DEFAULT false,
        "claimedAt" TIMESTAMP(3),
        "claimedBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CardGift_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "CardGift_token_key" ON "CardGift"("token")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "CardGift_cardId_edition_serial_key" ON "CardGift"("cardId", "edition", "serial")`,
      `CREATE INDEX IF NOT EXISTS "CardGift_cardId_idx" ON "CardGift"("cardId")`,
      `DO $$ BEGIN
        ALTER TABLE "CardGift" ADD CONSTRAINT "CardGift_cardId_fkey"
          FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];
    const steps: Array<{ sql: string; ok: boolean; error?: string }> = [];
    for (const sql of stmts) {
      try {
        await prisma.$executeRawUnsafe(sql);
        steps.push({ sql: sql.slice(0, 60), ok: true });
      } catch (err) {
        steps.push({ sql: sql.slice(0, 60), ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return NextResponse.json({ op, ok: steps.every((s) => s.ok), steps });
  }

  // ── mint-card-gifts ─────────────────────────────────────────────────────────
  // Mint single-use claim tokens for a card edition. Serials continue from the
  // edition's current max. count:0 lists existing gifts without minting.
  if (op === "mint-card-gifts") {
    const cardSlug = String(body.cardSlug ?? "").trim();
    if (!cardSlug) return NextResponse.json({ error: "cardSlug required" }, { status: 400 });
    const count = Math.max(0, Math.min(100, Number(body.count ?? 0)));
    const edition = String(body.edition ?? "founders").trim();
    const note = body.note != null ? String(body.note) : null;
    const dryRun = body.dryRun === true; // default APPLY (explicit mint); dryRun:true previews

    const card = await prisma.card.findUnique({
      where: { slug: cardSlug },
      select: { id: true, title: true, slug: true, artUrl: true },
    });
    if (!card) return NextResponse.json({ error: `No card with slug "${cardSlug}"` }, { status: 404 });

    const existing = await prisma.cardGift.findMany({
      where: { cardId: card.id, edition },
      orderBy: { serial: "asc" },
      select: { serial: true, token: true, claimed: true, claimedAt: true, claimedBy: true, note: true },
    });

    if (count === 0 || dryRun) {
      return NextResponse.json({
        op, card: card.title, cardSlug, edition, dryRun,
        wouldMint: count,
        nextSerial: (existing[existing.length - 1]?.serial ?? 0) + 1,
        existing: existing.map((g) => ({
          serial: g.serial, claimed: g.claimed, claimedAt: g.claimedAt, note: g.note,
          url: `https://cultcodex.me/claim/card/${g.token}`,
        })),
      });
    }

    const startSerial = (existing[existing.length - 1]?.serial ?? 0) + 1;
    const minted: Array<{ serial: number; url: string }> = [];
    for (let i = 0; i < count; i++) {
      const gift = await prisma.cardGift.create({
        data: { cardId: card.id, serial: startSerial + i, edition, note },
        select: { serial: true, token: true },
      });
      minted.push({ serial: gift.serial, url: `https://cultcodex.me/claim/card/${gift.token}` });
    }
    return NextResponse.json({ op, card: card.title, cardSlug, edition, minted });
  }

  // ── delete-no-transcript-chapters ───────────────────────────────────────────
  // Remove Psychenomicon chapters generated from episodes that have no
  // transcript (no segments, no transcriptRaw) — ungrounded/blank entries.
  // Also removes chapters with no episode link at all, their art assets
  // (keyed by chapterSlug, no FK), and their archetype events (chapterId is
  // SetNull on delete, which would strand junk events).
  if (op === "delete-no-transcript-chapters") {
    const dryRun = body.dryRun !== false;

    const chapters = await prisma.psychenomiconChapter.findMany({
      select: {
        id: true, chapterNumber: true, title: true, slug: true,
        episode: {
          select: {
            id: true, episodeNumber: true, title: true, airDate: true,
            transcriptRaw: true, _count: { select: { segments: true } },
          },
        },
        _count: { select: { entityAppearances: true, threadChapters: true, archetypeEvents: true } },
      },
      orderBy: { chapterNumber: "asc" },
    });

    // An episode counts as transcript-less when it has no segments and its raw
    // transcript is empty or a short sync sentinel (e.g. "no_captions").
    const targets = chapters.filter(
      (c) => !c.episode || (c.episode._count.segments === 0 && (c.episode.transcriptRaw?.trim().length ?? 0) < 100)
    );

    const listed = targets.map((c) => ({
      chapterNumber: c.chapterNumber,
      title: c.title,
      slug: c.slug,
      episodeNumber: c.episode?.episodeNumber ?? null,
      episodeTitle: c.episode?.title ?? null,
      airDate: c.episode?.airDate ?? null,
      reason: !c.episode ? "no episode" : "episode has no transcript",
      refs: c._count,
    }));

    let deleted = 0;
    let artAssetsDeleted = 0;
    let archetypeEventsDeleted = 0;
    if (!dryRun && targets.length > 0) {
      const ids = targets.map((c) => c.id);
      const slugs = targets.map((c) => c.slug);
      archetypeEventsDeleted = (
        await prisma.archetypeEvent.deleteMany({ where: { chapterId: { in: ids } } })
      ).count;
      artAssetsDeleted = (
        await prisma.psychenomiconArtAsset.deleteMany({ where: { chapterSlug: { in: slugs } } })
      ).count;
      deleted = (
        await prisma.psychenomiconChapter.deleteMany({ where: { id: { in: ids } } })
      ).count; // entityAppearances + threadChapters cascade
    }

    return NextResponse.json({
      op, dryRun,
      scanned: chapters.length,
      matched: targets.length,
      deleted, artAssetsDeleted, archetypeEventsDeleted,
      chapters: listed,
    });
  }

  // ── delete-no-transcript-episodes ───────────────────────────────────────────
  // Remove Episode rows with no transcript at all (no segments, no
  // transcriptRaw) — blank archive entries with no source material.
  // Episodes with engagement (comments/favorites/quotes) or a Psychenomicon
  // chapter are skipped unless force:true. Join rows cascade; a linked
  // chapter's episodeId goes null (chapter itself is preserved).
  if (op === "delete-no-transcript-episodes") {
    const dryRun = body.dryRun !== false;
    const force = body.force === true;

    const eps = await prisma.episode.findMany({
      where: { segments: { none: {} } },
      select: {
        id: true, episodeNumber: true, title: true, slug: true, airDate: true,
        status: true, youtubeVideoId: true, transcriptRaw: true, summaryShort: true,
        psychenomiconChapter: { select: { chapterNumber: true } },
        _count: { select: { quotes: true, comments: true, favorites: true, guests: true } },
      },
      orderBy: { airDate: "asc" },
    });

    const targets = eps.filter((e) => !e.transcriptRaw?.trim());
    const guarded = targets.filter(
      (e) => e.psychenomiconChapter || e._count.quotes > 0 || e._count.comments > 0 || e._count.favorites > 0
    );
    const deletable = force ? targets : targets.filter((e) => !guarded.includes(e));

    const describe = (e: (typeof targets)[number]) => ({
      episodeNumber: e.episodeNumber,
      title: e.title,
      slug: e.slug,
      airDate: e.airDate,
      status: e.status,
      youtubeVideoId: e.youtubeVideoId,
      hasSummary: !!e.summaryShort,
      chapter: e.psychenomiconChapter?.chapterNumber ?? null,
      refs: e._count,
    });

    let deleted = 0;
    if (!dryRun && deletable.length > 0) {
      deleted = (
        await prisma.episode.deleteMany({ where: { id: { in: deletable.map((e) => e.id) } } })
      ).count;
    }

    return NextResponse.json({
      op, dryRun, force,
      matched: targets.length,
      guardedSkipped: force ? 0 : guarded.length,
      deleted,
      wouldDelete: deletable.map(describe),
      guarded: (force ? [] : guarded).map(describe),
    });
  }

  // ── schema-probe ────────────────────────────────────────────────────────────
  // READ-ONLY: identity facts about the connected database, for comparing
  // environments (e.g. the stale CI DATABASE_URL vs real prod).
  if (op === "schema-probe") {
    const [db] = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `SELECT current_database() AS name`
    ).catch(() => [{ name: "?" }]);
    const episodes = await prisma.episode.count();
    const chapters = await prisma.psychenomiconChapter.count();
    const tables: Record<string, boolean> = {};
    for (const t of ["CardGift", "Spread", "Reading", "CardSet", "SavedSearch"]) {
      const [r] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${t}') AS exists`
      );
      tables[t] = r.exists;
    }
    const [col] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Episode' AND column_name = 'enrichmentQueued') AS exists`
    );
    return NextResponse.json({
      op, database: db?.name, episodes, chapters, tables,
      episodeEnrichmentQueuedColumn: col.exists,
    });
  }

  // ── apply-saved-search-migration ────────────────────────────────────────────
  // Idempotent DDL for the SavedSearch table + SearchKind enum, which never
  // made it to prod (schema-probe 2026-07-14 showed the table missing while
  // the /api/me/saved-searches routes are deployed). Same operator path as
  // apply-card-gift-migration.
  if (op === "apply-saved-search-migration") {
    const stmts = [
      `DO $$ BEGIN
        CREATE TYPE "SearchKind" AS ENUM ('simple', 'deep', 'oracle');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
      `CREATE TABLE IF NOT EXISTS "SavedSearch" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "kind" "SearchKind" NOT NULL,
        "query" TEXT NOT NULL DEFAULT '',
        "concepts" TEXT[],
        "thresholds" DOUBLE PRECISION[],
        "eraId" TEXT,
        "personSlug" TEXT,
        "archetype" TEXT,
        "pinned" BOOLEAN NOT NULL DEFAULT false,
        "lastRunAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
      )`,
      `CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId")`,
      `DO $$ BEGIN
        ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey"
          FOREIGN KEY ("userId") REFERENCES "CodexUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ];
    const steps: Array<{ sql: string; ok: boolean; error?: string }> = [];
    for (const sql of stmts) {
      try {
        await prisma.$executeRawUnsafe(sql);
        steps.push({ sql: sql.slice(0, 60), ok: true });
      } catch (err) {
        steps.push({ sql: sql.slice(0, 60), ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return NextResponse.json({ op, ok: steps.every((s) => s.ok), steps });
  }

  return NextResponse.json({ error: `Unknown op: ${op}` }, { status: 400 });
}
