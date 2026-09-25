import { NextResponse } from "next/server";
import { getRecommendation } from "@/lib/recommendations";

// Short links for Psyche Recommends: /go/<slug> → the affiliate URL.
// 307 rather than 308 so browsers don't cache the destination permanently —
// an affiliate URL changes when a program does.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rec = getRecommendation(slug);
  if (!rec) {
    return NextResponse.redirect(new URL("/recommends", req.url), 307);
  }
  return NextResponse.redirect(rec.url, {
    status: 307,
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
