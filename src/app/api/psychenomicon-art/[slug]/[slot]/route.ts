import { prisma } from "@/lib/db";

// Serves Psychenomicon chapter art stored as bytes in Postgres (Railway).
// URL shape: /api/psychenomicon-art/{chapter-slug}/{cover|scene_01|scene_02|scene_03}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = new Set(["cover", "scene_01", "scene_02", "scene_03"]);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; slot: string }> }
) {
  const { slug, slot } = await params;
  if (!SLOTS.has(slot)) {
    return new Response("Invalid slot", { status: 400 });
  }

  const asset = await prisma.psychenomiconArtAsset
    .findUnique({
      where: { chapterSlug_slot: { chapterSlug: slug, slot } },
      select: { data: true, mimeType: true },
    })
    .catch(() => null);

  if (!asset) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
