import { NextResponse } from "next/server";
import { SITEMAP_SEGMENTS, renderUrlSet } from "@/lib/sitemap";

export const revalidate = 3600;

/**
 * One child sitemap per collection, linked from the index at /sitemap.xml.
 *
 * The segment name arrives as `<name>.xml` so the URL looks like a file to
 * crawlers and to anyone reading robots.txt.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ segment: string }> }
): Promise<NextResponse> {
  const { segment } = await params;
  const name = segment.replace(/\.xml$/, "");

  const loader = SITEMAP_SEGMENTS[name];
  if (!loader) {
    return new NextResponse("Not found", { status: 404 });
  }

  const entries = await loader();
  return new NextResponse(renderUrlSet(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export async function generateStaticParams() {
  return Object.keys(SITEMAP_SEGMENTS).map((segment) => ({ segment: `${segment}.xml` }));
}
