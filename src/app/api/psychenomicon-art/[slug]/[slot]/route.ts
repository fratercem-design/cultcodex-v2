import { GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { getR2, R2_BUCKET, artKey, r2Configured } from "@/lib/r2";

// Serves Psychenomicon chapter art. Primary source is Cloudflare R2 (object
// storage, independent of Postgres → survives DB pauses, cuts DB egress);
// falls back to the Postgres blob if R2 is unconfigured or misses.
// URL shape: /api/psychenomicon-art/{chapter-slug}/{cover|scene_01|scene_02|scene_03}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SLOTS = new Set(["cover", "scene_01", "scene_02", "scene_03"]);
const CACHE = "public, max-age=31536000, immutable";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; slot: string }> }
) {
  const { slug, slot } = await params;
  if (!SLOTS.has(slot)) {
    return new Response("Invalid slot", { status: 400 });
  }

  // Prefer R2.
  if (r2Configured()) {
    try {
      const obj = await getR2().send(
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: artKey(slug, slot) })
      );
      const bytes = Buffer.from(await obj.Body!.transformToByteArray());
      return new Response(bytes, {
        headers: { "Content-Type": obj.ContentType ?? "image/jpeg", "Cache-Control": CACHE },
      });
    } catch {
      // R2 miss → fall through to Postgres.
    }
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
    headers: { "Content-Type": asset.mimeType, "Cache-Control": CACHE },
  });
}
