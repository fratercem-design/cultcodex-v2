import { NextResponse } from "next/server";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";

export const revalidate = 3600;

/**
 * llms.txt, generated rather than stored.
 *
 * This was a static file in public/ claiming "2,600+ episodes" while the
 * homepage said 3,028 and /premium said 3,007. A hand-maintained number in a
 * file nobody opens will always be the stalest one on the site, and this
 * particular file is the one AI crawlers read to describe the archive - so
 * the stale figure was the number most likely to be repeated back at us.
 *
 * It now derives from the same getCounts() the rest of the site uses, through
 * fmtEpisodeCount, which degrades to a conservative floor if the Xata branch
 * is asleep rather than printing "0+".
 */
export async function GET(): Promise<NextResponse> {
  const counts = await getCounts().catch(() => null);
  const episodes = fmtEpisodeCount(counts?.episodes ?? 0);
  const people = (counts?.people ?? 0).toLocaleString("en-US");
  const lore = (counts?.lore ?? 0).toLocaleString("en-US");
  const topics = (counts?.topics ?? 0).toLocaleString("en-US");

  const body = `# CultCodex — The Living Archive

> A structured archive of the Cult of Psyche livestream: ${episodes} episodes with transcripts, guest profiles, lore entries, topic maps, and AI-powered search.

CultCodex indexes and cross-references every episode of the Cult of Psyche podcast/stream, hosted at youtube.com/@cultofpsyche. The archive includes:

- Full episode transcripts (sourced from YouTube captions or transcribed via Whisper)
- Guest profiles for recurring and one-time participants (${people} indexed)
- Lore entries cataloguing recurring themes, myths, and terminology (${lore} entries)
- Topic classification across ${episodes} episodes (${topics} topics)
- An AI search interface (the Oracle) for natural-language queries across the full archive
- Era classification mapping the show's history into distinct periods
- Relationship maps showing guest co-appearance networks

## Key pages

- / — Homepage with archive stats and featured content
- /episodes — Full episode index, filterable by era, topic, guest
- /people — Profiles for all participants
- /lore — Lore and mythology entries
- /topics — Subject matter taxonomy
- /oracle — AI semantic search (subscription required)
- /graph — Relationship map of guest co-appearances
- /eras — Timeline of the show's distinct eras
- /feed.xml — RSS feed of latest episodes

## Data quality

Each episode entry carries a provenance badge: "transcript-backed" (enriched from full transcript) or "inferred" (generated from title and metadata only). AI-generated content may contain errors; see /corrections to report issues.

## Contact

Corrections and feedback: https://cultcodex.me/corrections
Content policy: https://cultcodex.me/content-policy
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
