// scripts/psychenomicon-art/upload.ts
//
// Uploads a local PNG file to Supabase Storage and returns its public URL.
// Uses the Supabase Storage REST API directly (no SDK dependency).
//
// Required env vars:
//   SUPABASE_URL          e.g. https://zkzjjinihnhmrzodoopi.supabase.co
//   SUPABASE_SERVICE_KEY  service_role JWT from Supabase → Settings → API

import * as fs from "fs";

const BUCKET = "psychenomicon-art";

function getConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars.\n" +
      "Add them to your .env file:\n" +
      "  SUPABASE_URL=https://zkzjjinihnhmrzodoopi.supabase.co\n" +
      "  SUPABASE_SERVICE_KEY=<service_role key from Supabase → Settings → API>"
    );
  }

  return { url: url.replace(/[^\x00-\xFF]/g, "").trim().replace(/\/$/, ""), key: key.replace(/[^\x00-\xFF]/g, "").trim() };
}

/**
 * Upload a local file to Supabase Storage.
 * @param localPath  Absolute path to the PNG file on disk
 * @param storagePath  Path within the bucket, e.g. "ch-001-the-gate/cover.png"
 * @returns Public URL of the uploaded file
 */
export async function uploadToSupabase(
  localPath: string,
  storagePath: string,
): Promise<string> {
  const { url, key } = getConfig();

  const fileBuffer = fs.readFileSync(localPath);

  const endpoint = `${url}/storage/v1/object/${BUCKET}/${storagePath}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "image/png",
      "x-upsert": "true", // overwrite if already exists
    },
    body: fileBuffer,
    // @ts-expect-error — Node 22 fetch accepts Buffer as body
    duplex: "half",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Supabase upload failed (${response.status}): ${body.slice(0, 200)}`
    );
  }

  // Public URL — works because bucket.public = true
  return `${url}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/**
 * Upload all four chapter art images and return a URL map.
 * storagePaths are keyed by image slot.
 */
export async function uploadChapterArt(
  chapterSlug: string,
  localPaths: {
    cover: string;
    scene_01: string;
    scene_02: string;
    scene_03: string;
  },
  opts: { dryRun?: boolean } = {}
): Promise<{
  cover: string;
  scene_01: string;
  scene_02: string;
  scene_03: string;
}> {
  const slots = ["cover", "scene_01", "scene_02", "scene_03"] as const;
  const urls: Record<string, string> = {};

  for (const slot of slots) {
    const localPath = localPaths[slot];
    const storagePath = `${chapterSlug}/${slot}.png`;

    if (opts.dryRun) {
      // Return what the URL would be without actually uploading
      const { url } = getConfig();
      urls[slot] = `${url}/storage/v1/object/public/${BUCKET}/${storagePath}`;
      console.log(`  [dry-run] Would upload ${slot} → ${storagePath}`);
      continue;
    }

    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found for upload: ${localPath}`);
    }

    console.log(`  ↑  Uploading ${slot} → ${storagePath}…`);
    const publicUrl = await uploadToSupabase(localPath, storagePath);
    urls[slot] = publicUrl;
    console.log(`  ✓  ${slot} → ${publicUrl}`);
  }

  return urls as { cover: string; scene_01: string; scene_02: string; scene_03: string };
}
