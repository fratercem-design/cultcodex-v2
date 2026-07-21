import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

// TEMPORARY read-only miner for the game-show question bank. Token-guarded.
// Delete this route + SEED_FUN_TOKEN after use.
const BLOCK = /anal|probe|glory|penis|dick| sex|porn|butt|nazi|racist|gay ring|semen|cum|orgasm|masturbat|rape/i;
const ok = (s?: string | null) => !!s && !BLOCK.test(s);

export async function GET(req: NextRequest) {
  const token = process.env.SEED_FUN_TOKEN;
  if (!token || req.headers.get("authorization") !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const [humorRaw, prophecies, quotesRaw, castRaw, locations, artifacts] = await Promise.all([
    prisma.loreEntry.findMany({ where: { canonStatus: "humorous" }, select: { title: true, slug: true, summary: true, category: true }, orderBy: { title: "asc" } }),
    prisma.loreEntry.findMany({ where: { category: "prophecy" }, select: { title: true, slug: true, summary: true } }),
    prisma.quote.findMany({ where: { speakerPersonId: { not: null }, text: { not: "" } }, select: { text: true, context: true, speaker: { select: { displayName: true } }, episode: { select: { slug: true, title: true } } }, take: 1500, orderBy: { id: "asc" } }),
    prisma.person.findMany({ where: { personType: { in: ["host", "recurring", "guest"] } }, select: { displayName: true }, take: 250, orderBy: { displayName: "asc" } }),
    prisma.loreEntry.findMany({ where: { category: "location" }, select: { title: true, slug: true } }),
    prisma.loreEntry.findMany({ where: { category: "artifact" }, select: { title: true, slug: true } }),
  ]);
  const seen = new Set<string>(); const humor = [];
  for (const h of humorRaw) { if (!ok(h.title) || !ok(h.summary)) continue; const stem = h.title.toLowerCase().replace(/[^a-z ]/g, "").split(" ").slice(0, 2).join(" "); if (seen.has(stem)) continue; seen.add(stem); humor.push(h); }
  const quotes = quotesRaw.filter(q => q.speaker && q.speaker.displayName !== "Unknown" && !/\[ __ \]|\[__\]/.test(q.text) && ok(q.text) && q.text.length >= 25 && q.text.length <= 150);
  const cast = castRaw.map(c => c.displayName).filter(ok);
  return NextResponse.json({ humor, prophecies, quotes, cast, locations: locations.filter(l => ok(l.title)), artifacts: artifacts.filter(a => ok(a.title)) });
}
