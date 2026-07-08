/**
 * POST /api/admin/people/[id]/sync-youtube
 *
 * Fetches the YouTube channel avatar for a person and updates both
 * their avatarUrl and youtubeChannelUrl in the DB.
 *
 * Body: { channelUrl: string }   — YouTube channel URL or @handle
 * Auth: admin session or ENRICH_SECRET header
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { enrichSecretMatches } from "@/lib/admin-guard";

function isAdmin(req: NextRequest, user: { role: string } | null): boolean {
  if (enrichSecretMatches(req)) return true;
  return user?.role === "admin";
}

/** Extract @handle or channel ID from a YouTube URL or bare handle. */
function parseChannelInput(input: string): { type: "handle"; value: string } | { type: "id"; value: string } | null {
  const s = input.trim();

  // Bare handle: @something
  if (/^@[\w.-]+$/.test(s)) return { type: "handle", value: s };

  // youtube.com/@handle
  const handleMatch = s.match(/youtube\.com\/@([\w.-]+)/);
  if (handleMatch) return { type: "handle", value: `@${handleMatch[1]}` };

  // youtube.com/channel/UCxxxxxxxx
  const idMatch = s.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (idMatch) return { type: "id", value: idMatch[1] };

  // youtube.com/c/name (legacy custom URL — use as handle best-effort)
  const customMatch = s.match(/youtube\.com\/c\/([\w.-]+)/);
  if (customMatch) return { type: "handle", value: `@${customMatch[1]}` };

  return null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isAdmin(req, user)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Guard the external YouTube API call — 30 syncs/minute is generous for admin use.
  const rl = rateLimit(`yt-sync:${clientKey(req, user?.id)}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests — slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { id } = await params;

  const person = await prisma.person.findUnique({
    where: { id },
    select: { id: true, displayName: true },
  });
  if (!person) {
    return NextResponse.json({ error: "Person not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const channelUrl = typeof body.channelUrl === "string" ? body.channelUrl.trim() : "";
  if (!channelUrl) {
    return NextResponse.json({ error: "channelUrl is required" }, { status: 400 });
  }

  const parsed = parseChannelInput(channelUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Couldn't parse a YouTube channel handle or ID from that URL. Try pasting the full channel URL or an @handle." },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YOUTUBE_API_KEY not configured" }, { status: 500 });
  }

  // Fetch channel from YouTube Data API v3
  const params2 = new URLSearchParams({
    part: "snippet",
    key: apiKey,
    maxResults: "1",
    ...(parsed.type === "handle" ? { forHandle: parsed.value } : { id: parsed.value }),
  });

  const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params2}`, {
    next: { revalidate: 0 },
  });

  if (!ytRes.ok) {
    const errText = await ytRes.text().catch(() => "");
    console.error("[sync-youtube] YouTube API error:", ytRes.status, errText);
    return NextResponse.json(
      { error: `YouTube API returned ${ytRes.status}. Check the YOUTUBE_API_KEY.` },
      { status: 502 }
    );
  }

  const ytData = await ytRes.json() as {
    items?: Array<{
      id: string;
      snippet: {
        title: string;
        customUrl?: string;
        thumbnails: {
          high?: { url: string };
          medium?: { url: string };
          default?: { url: string };
        };
      };
    }>;
  };

  const channel = ytData.items?.[0];
  if (!channel) {
    return NextResponse.json(
      { error: "No YouTube channel found for that handle. Double-check the URL." },
      { status: 404 }
    );
  }

  const thumbnailUrl =
    channel.snippet.thumbnails.high?.url ??
    channel.snippet.thumbnails.medium?.url ??
    channel.snippet.thumbnails.default?.url;

  if (!thumbnailUrl) {
    return NextResponse.json({ error: "YouTube channel has no thumbnail." }, { status: 404 });
  }

  // Normalise the channel URL to a canonical form for storage
  const canonicalUrl = channel.snippet.customUrl
    ? `https://www.youtube.com/${channel.snippet.customUrl}`
    : channelUrl;

  await prisma.person.update({
    where: { id },
    data: {
      avatarUrl: thumbnailUrl,
      youtubeChannelUrl: canonicalUrl,
    },
  });

  return NextResponse.json({
    ok: true,
    channelTitle: channel.snippet.title,
    avatarUrl: thumbnailUrl,
    youtubeChannelUrl: canonicalUrl,
  });
}
