#!/usr/bin/env npx tsx
// scripts/psychenomicon-art/upload-railway.ts
//
// Store generated chapter art in Postgres (Railway) instead of Supabase, and
// point each chapter's artImageUrls at /api/psychenomicon-art/[slug]/[slot].
//
// Usage:
//   npx tsx scripts/psychenomicon-art/upload-railway.ts            # all complete chapter dirs
//   npx tsx scripts/psychenomicon-art/upload-railway.ts chapter-005 # one chapter

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";

const IMAGES_DIR = path.join(__dirname, "output", "images");
const SLOTS = ["cover", "scene_01", "scene_02", "scene_03"] as const;

type PrismaLike = ReturnType<typeof getPrisma>;

/**
 * Upsert a chapter's four images into Postgres and point its artImageUrls at
 * the /api/psychenomicon-art route. Reusable by run.ts for inline publishing.
 */
export async function uploadChapterToRailway(
  prisma: PrismaLike,
  slug: string,
  imagePaths: { cover: string; scene_01: string; scene_02: string; scene_03: string }
): Promise<Record<string, string>> {
  for (const slot of SLOTS) {
    const data = fs.readFileSync(imagePaths[slot]);
    await prisma.psychenomiconArtAsset.upsert({
      where: { chapterSlug_slot: { chapterSlug: slug, slot } },
      create: { chapterSlug: slug, slot, mimeType: "image/jpeg", data },
      update: { data, mimeType: "image/jpeg" },
    });
  }
  const artImageUrls = Object.fromEntries(
    SLOTS.map((slot) => [slot, `/api/psychenomicon-art/${slug}/${slot}`])
  );
  await prisma.psychenomiconChapter.update({
    where: { slug },
    data: { artImageUrls, artGeneratedAt: new Date() },
  });
  return artImageUrls;
}

async function main() {
  const prisma = getPrisma();
  const onlySlug = process.argv.slice(2).find((a) => !a.startsWith("--"));

  const dirs = onlySlug
    ? [onlySlug]
    : fs
        .readdirSync(IMAGES_DIR)
        .filter((d) => fs.statSync(path.join(IMAGES_DIR, d)).isDirectory())
        .sort();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of dirs) {
    const dir = path.join(IMAGES_DIR, slug);
    const files = SLOTS.map((slot) => ({ slot, file: path.join(dir, `${slot}.png`) }));
    const missing = files.filter((f) => !fs.existsSync(f.file));
    if (missing.length > 0) {
      console.log(`↷ ${slug} — missing ${missing.map((m) => m.slot).join(", ")}, skipping`);
      skipped++;
      continue;
    }

    try {
      await uploadChapterToRailway(prisma, slug, {
        cover: path.join(dir, "cover.png"),
        scene_01: path.join(dir, "scene_01.png"),
        scene_02: path.join(dir, "scene_02.png"),
        scene_03: path.join(dir, "scene_03.png"),
      });
      console.log(`✓ ${slug} — 4 images → Postgres, artImageUrls set`);
      uploaded++;
    } catch (e) {
      console.error(`✗ ${slug} — ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded} | Skipped: ${skipped} | Failed: ${failed}`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
