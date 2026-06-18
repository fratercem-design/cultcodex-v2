import { createHmac, timingSafeEqual } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getR2, R2_BUCKET, artKey, r2Configured } from "@/lib/r2";

// Copies PsychenomiconArtAsset image bytes from Postgres → Cloudflare R2,
// server-side (internal DB host, stable — the public proxy is flaky). Idempotent
// (overwrites). Does NOT delete the Postgres rows. Gated by admin session or a
// `?key=` token = base64url(HMAC-SHA256(AUTH_SECRET, "migrate-art-r2")).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function keyValid(req: Request): boolean {
  const key = new URL(req.url).searchParams.get("key");
  const secret = process.env.AUTH_SECRET;
  if (!key || !secret) return false;
  const expected = createHmac("sha256", secret).update("migrate-art-r2").digest("base64url");
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  let allowed = keyValid(req);
  if (!allowed) {
    const user = await getCurrentUser().catch(() => null);
    allowed = user?.role === "admin";
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });
  if (!r2Configured()) return Response.json({ ok: false, error: "R2 env not set" }, { status: 500 });

  const r2 = getR2();
  const total = await prisma.psychenomiconArtAsset.count();
  let migrated = 0;
  let failed = 0;
  const errors: string[] = [];
  const PAGE = 25;

  for (let skip = 0; skip < total; skip += PAGE) {
    const rows = await prisma.psychenomiconArtAsset.findMany({
      orderBy: { id: "asc" },
      skip,
      take: PAGE,
      select: { chapterSlug: true, slot: true, mimeType: true, data: true },
    });
    for (const row of rows) {
      try {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: artKey(row.chapterSlug, row.slot),
            Body: Buffer.from(row.data),
            ContentType: row.mimeType,
            CacheControl: "public, max-age=31536000, immutable",
          })
        );
        migrated++;
      } catch (e) {
        failed++;
        if (errors.length < 5) errors.push(`${row.chapterSlug}/${row.slot}: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  return Response.json({ ok: failed === 0, total, migrated, failed, errors });
}
