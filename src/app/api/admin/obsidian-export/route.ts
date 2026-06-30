/**
 * TEMPORARY DATA EXPORT ROUTE
 * Created: 2026-06-29 for Obsidian sync
 * TODO: Remove after sync is complete
 * 
 * Usage: GET /api/admin/obsidian-export?token=XXX&type=episodes&offset=0&limit=100
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Simple token auth - set EXPORT_TOKEN in Vercel env for this deployment
const EXPORT_TOKEN = process.env.EXPORT_TOKEN || "temp-deploy-token-2026-06-29";

function checkAuth(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get("token") || "";
  return token.length > 0 && token === EXPORT_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const type = req.nextUrl.searchParams.get("type") || "episodes";
  const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  try {
    switch (type) {
      case "episodes": {
        const [items, total] = await Promise.all([
          prisma.episode.findMany({
            skip: offset,
            take: limit,
            orderBy: { airDate: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              episodeNumber: true,
              airDate: true,
              duration: true,
              youtubeVideoId: true,
              thumbnailUrl: true,
              summaryShort: true,
              summaryLong: true,
              summaryFacts: true,
              summaryThemes: true,
              cutOfPsyche: true,
              status: true,
              contentType: true,
              isHumanReviewed: true,
              createdAt: true,
              updatedAt: true,
              series: { select: { title: true, slug: true, type: true } },
              guests: {
                select: {
                  person: { select: { displayName: true, slug: true, personType: true } }
                }
              },
              mentionedPeople: {
                select: {
                  person: { select: { displayName: true, slug: true } }
                }
              },
              topics: {
                select: {
                  topic: { select: { title: true, slug: true } }
                }
              },
              loreEntries: {
                select: {
                  loreEntry: { select: { title: true, slug: true, canonStatus: true } }
                }
              },
              quotes: {
                select: {
                  text: true,
                  timestampSeconds: true,
                  context: true,
                  significance: true,
                  speaker: { select: { displayName: true, slug: true } }
                },
                take: 20
              }
            }
          }),
          prisma.episode.count()
        ]);
        return NextResponse.json({ ok: true, items, total, offset, limit, type });
      }

      case "people": {
        const [items, total] = await Promise.all([
          prisma.person.findMany({
            skip: offset,
            take: limit,
            orderBy: { displayName: "asc" },
            select: {
              id: true,
              displayName: true,
              slug: true,
              altNames: true,
              shortBio: true,
              loreSummary: true,
              avatarUrl: true,
              youtubeChannelUrl: true,
              personType: true,
              firstAppearanceEpisode: { select: { title: true, slug: true, episodeNumber: true } },
              _count: {
                select: {
                  guestAppearances: true,
                  mentions: true,
                  quotes: true
                }
              }
            }
          }),
          prisma.person.count()
        ]);
        return NextResponse.json({ ok: true, items, total, offset, limit, type });
      }

      case "lore": {
        const [items, total] = await Promise.all([
          prisma.loreEntry.findMany({
            skip: offset,
            take: limit,
            orderBy: { title: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              summary: true,
              fullEntry: true,
              canonStatus: true,
              firstMentionEpisode: { select: { title: true, slug: true, episodeNumber: true } },
              _count: { select: { episodes: true, people: true } }
            }
          }),
          prisma.loreEntry.count()
        ]);
        return NextResponse.json({ ok: true, items, total, offset, limit, type });
      }

      case "topics": {
        const [items, total] = await Promise.all([
          prisma.topic.findMany({
            skip: offset,
            take: limit,
            orderBy: { title: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              _count: {
                select: { episodes: true, people: true, lore: true }
              }
            }
          }),
          prisma.topic.count()
        ]);
        return NextResponse.json({ ok: true, items, total, offset, limit, type });
      }

      case "quotes": {
        const [items, total] = await Promise.all([
          prisma.quote.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              text: true,
              timestampSeconds: true,
              context: true,
              significance: true,
              speaker: { select: { displayName: true, slug: true } },
              episode: { select: { title: true, slug: true, episodeNumber: true } }
            }
          }),
          prisma.quote.count()
        ]);
        return NextResponse.json({ ok: true, items, total, offset, limit, type });
      }

      case "stats": {
        const [episodes, people, lore, topics, quotes, series] = await Promise.all([
          prisma.episode.count(),
          prisma.person.count(),
          prisma.loreEntry.count(),
          prisma.topic.count(),
          prisma.quote.count(),
          prisma.series.count()
        ]);
        return NextResponse.json({
          ok: true,
          stats: { episodes, people, lore, topics, quotes, series }
        });
      }

      default:
        return NextResponse.json({ ok: false, error: `Unknown type: ${type}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
