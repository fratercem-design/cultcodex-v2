import { NextResponse } from "next/server";
import { SITEMAP_SEGMENTS, baseUrl, renderSitemapIndex } from "@/lib/sitemap";

// Regenerate at most once per hour, same cadence as the old single sitemap.
export const revalidate = 3600;

/**
 * Sitemap INDEX, not a urlset.
 *
 * The previous /sitemap.xml emitted all 6,582 URLs in one 1.6 MB document,
 * built by loading every episode, person, lore entry, topic, series, chapter
 * and member page in a single render. It intermittently returned a 500, and
 * robots.txt names it as the only sitemap, so that failure took the whole
 * crawl surface with it.
 *
 * Splitting per collection means one slow or failing table degrades one child
 * sitemap instead of all of them, and each child is small enough to serve well
 * inside a function timeout.
 */
export async function GET(): Promise<NextResponse> {
  const b = baseUrl();
  const xml = renderSitemapIndex(
    Object.keys(SITEMAP_SEGMENTS).map((segment) => ({
      url: `${b}/sitemaps/${segment}.xml`,
    }))
  );

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
