import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const episodes = await prisma.episode.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { airDate: "desc" },
    take: 50,
    select: {
      slug: true,
      title: true,
      summaryShort: true,
      airDate: true,
      episodeNumber: true,
      thumbnailUrl: true,
    },
  });

  const items = episodes
    .map((ep) => {
      const url = `${baseUrl}/episodes/${ep.slug}`;
      const title = ep.title ?? `Episode ${ep.episodeNumber ?? ep.slug}`;
      const description = ep.summaryShort ?? "";
      const pubDate = ep.airDate ? new Date(ep.airDate).toUTCString() : "";
      return [
        "    <item>",
        `      <title><![CDATA[${title}]]></title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        description ? `      <description><![CDATA[${description}]]></description>` : "",
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CultCodex — The Living Archive</title>
    <link>${baseUrl}</link>
    <description>2,600+ Cult of Psyche episodes — transcripts, lore, guest profiles, and AI analysis</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
