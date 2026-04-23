import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";

  const episodes = await prisma.episode.findMany({
    where: { status: "published" },
    orderBy: [{ airDate: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      thumbnailUrl: true,
      duration: true,
      youtubeVideoId: true,
      updatedAt: true,
    },
  });

  const items = episodes
    .map((ep) => {
      const url = `${baseUrl}/episodes/${ep.slug}`;
      const pubDate = (ep.airDate ?? ep.updatedAt).toUTCString();
      const title = ep.episodeNumber
        ? `EP.${String(ep.episodeNumber).padStart(3, "0")} — ${ep.title}`
        : ep.title;
      const description = ep.summaryShort ?? "";

      const thumbnail = ep.thumbnailUrl
        ? `\n      <media:thumbnail url="${escapeXml(ep.thumbnailUrl)}" />`
        : "";

      const ytLink = ep.youtubeVideoId
        ? `\n      <comments>https://www.youtube.com/watch?v=${ep.youtubeVideoId}</comments>`
        : "";

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>${thumbnail}${ytLink}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CultCodex — Cult of Psyche Episode Archive</title>
    <link>${baseUrl}</link>
    <description>The complete Cult of Psyche episode archive — every transmission catalogued.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>300</ttl>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/logo.jpg</url>
      <title>CultCodex</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
