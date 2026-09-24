import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DELAY_MS = 300; // YouTube search quota is generous — 300ms is safe

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Normalise a name for comparison: lowercase, strip punctuation, collapse spaces
function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

// Check if the YouTube channel title is a close enough match for the person name.
// We accept: exact match, one being a substring of the other, or ≥ 60% token overlap.
function isConfidentMatch(personName: string, channelTitle: string): boolean {
  const a = normalize(personName);
  const b = normalize(channelTitle);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const tokensA = new Set(a.split(" ").filter(Boolean));
  const tokensB = new Set(b.split(" ").filter(Boolean));
  const shared = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 && shared / union >= 0.6;
}

interface AvatarResult {
  personId: string;
  name: string;
  status: "ok" | "no_match" | "skip" | "error";
  channelTitle?: string;
  avatarUrl?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({})) as { limit?: number };
  const limit = Math.min(Math.max(1, body.limit ?? 20), 100);

  const people = await prisma.person.findMany({
    where: { avatarUrl: null },
    select: { id: true, displayName: true, slug: true },
    orderBy: { guestAppearances: { _count: "desc" } }, // most-featured guests first
    take: limit,
  });

  if (people.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, ok_count: 0, no_match: 0, results: [] });
  }

  const yt = google.youtube({ version: "v3", auth: apiKey });
  const results: AvatarResult[] = [];

  for (let i = 0; i < people.length; i++) {
    const person = people[i];

    try {
      // Search YouTube for a channel matching this person's name
      const search = await yt.search.list({
        part: ["snippet"],
        q: person.displayName,
        type: ["channel"],
        maxResults: 3,
      });

      const items = search.data.items ?? [];
      let matched = false;

      for (const item of items) {
        const channelTitle = item.snippet?.channelTitle ?? item.snippet?.title ?? "";
        const thumbnail =
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          item.snippet?.thumbnails?.default?.url ?? "";

        if (!thumbnail) continue;

        if (isConfidentMatch(person.displayName, channelTitle)) {
          await prisma.person.update({
            where: { id: person.id },
            data: { avatarUrl: thumbnail },
          });
          results.push({ personId: person.id, name: person.displayName, status: "ok", channelTitle, avatarUrl: thumbnail });
          matched = true;
          break;
        }
      }

      if (!matched) {
        results.push({ personId: person.id, name: person.displayName, status: "no_match" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ personId: person.id, name: person.displayName, status: "error", error: msg.slice(0, 120) });
    }

    if (i < people.length - 1) await sleep(DELAY_MS);
  }

  const ok_count = results.filter((r) => r.status === "ok").length;
  const no_match = results.filter((r) => r.status === "no_match").length;
  const remaining = await prisma.person.count({ where: { avatarUrl: null } });

  return NextResponse.json({ ok: true, processed: results.length, ok_count, no_match, remaining, results });
}
