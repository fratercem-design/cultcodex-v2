import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

const BLOCK = /anal|probe|glory|penis|dick| sex|porn|butt|nazi|racist|gay ring|semen|cum|orgasm|masturbat|rape/i;
const ok = (s?: string | null) => !!s && !BLOCK.test(s);
const dedupe = <T extends { title: string }>(arr: T[]) => {
  const seen = new Set<string>(); const out: T[] = [];
  for (const h of arr) { const stem = h.title.toLowerCase().replace(/[^a-z ]/g, "").split(" ").slice(0, 2).join(" "); if (seen.has(stem)) continue; seen.add(stem); out.push(h); }
  return out;
};

export async function GET(req: NextRequest) {
  const token = process.env.SEED_FUN_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [humorRaw, prophecies, quotesRaw, castRaw, locations, artifacts, trollRaw, peopleRaw, epsRaw] = await Promise.all([
    prisma.loreEntry.findMany({ where: { canonStatus: "humorous" }, select: { title: true, slug: true, summary: true, category: true }, orderBy: { title: "asc" } }),
    prisma.loreEntry.findMany({ where: { category: "prophecy" }, select: { title: true, slug: true, summary: true } }),
    prisma.quote.findMany({ where: { speakerPersonId: { not: null }, text: { not: "" } }, select: { text: true, speaker: { select: { displayName: true } }, episode: { select: { slug: true, title: true } } }, take: 2000, orderBy: { id: "asc" } }),
    prisma.person.findMany({ where: { personType: { in: ["host", "recurring", "guest"] } }, select: { displayName: true }, take: 300, orderBy: { displayName: "asc" } }),
    prisma.loreEntry.findMany({ where: { category: "location" }, select: { title: true, slug: true } }),
    prisma.loreEntry.findMany({ where: { category: "artifact" }, select: { title: true, slug: true } }),
    prisma.loreEntry.findMany({ where: { OR: [{ title: { contains: "troll", mode: "insensitive" } }, { summary: { contains: "troll", mode: "insensitive" } }] }, select: { title: true, slug: true, summary: true, canonStatus: true }, take: 300 }),
    prisma.person.findMany({ where: { personType: { in: ["recurring", "host"] }, OR: [{ shortBio: { not: null } }, { loreSummary: { not: null } }] }, select: { displayName: true, slug: true, shortBio: true, loreSummary: true, personType: true }, take: 150 }),
    prisma.episode.findMany({ where: { thumbnailUrl: { not: null }, title: { not: "" } }, select: { title: true, slug: true, thumbnailUrl: true }, orderBy: { airDate: "desc" }, take: 500 }),
  ]);

  const humor = dedupe(humorRaw.filter((h) => ok(h.title) && ok(h.summary)));
  const quotes = quotesRaw.filter((q) => q.speaker && q.speaker.displayName !== "Unknown" && !/\[ __ \]|\[__\]/.test(q.text) && ok(q.text) && q.text.length >= 20 && q.text.length <= 160);
  const cast = castRaw.map((c) => c.displayName).filter(ok);
  const troll = dedupe(trollRaw.filter((t) => ok(t.title) && ok(t.summary)));
  const people = peopleRaw.filter((p) => ok(p.displayName) && (ok(p.shortBio) || ok(p.loreSummary)));
  const episodes = epsRaw.filter((e) => ok(e.title) && e.thumbnailUrl);
  return NextResponse.json({ humor, prophecies, quotes, cast, locations: locations.filter((l) => ok(l.title)), artifacts: artifacts.filter((a) => ok(a.title)), troll, people, episodes });
}
