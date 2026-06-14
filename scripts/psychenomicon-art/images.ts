// scripts/psychenomicon-art/images.ts
//
// Step 3: Generate images via Bluesminds (OpenAI-compatible /images/generations,
// grok-imagine-image-lite) and save the resulting files. Pollinations was
// dropped once its free endpoint started returning HTTP 402. Retries up to 3×
// with exponential backoff to ride out Bluesminds' provider flakiness.

import * as fs from "fs";
import * as path from "path";
import type { ChapterPrompts } from "./types";

const BLUESMINDS_BASE = process.env.OPENROUTER_BASE_URL ?? "https://api.bluesminds.com/v1";
const IMAGE_MODEL = process.env.ART_IMAGE_MODEL ?? "grok-imagine-image-lite";
const IMAGE_SIZE = process.env.ART_IMAGE_SIZE ?? "1024x1024";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a single image via Bluesminds and return the raw image buffer.
 * The `seed` arg is kept for signature stability but unused by grok-imagine.
 */
async function fetchImage(
  prompt: string,
  _seed: number,
  attempt = 1
): Promise<Buffer> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  try {
    const res = await fetch(`${BLUESMINDS_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // b64_json avoids grok's auth-gated asset URLs (which 403 on direct download).
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1, size: IMAGE_SIZE, response_format: "b64_json" }),
      signal: AbortSignal.timeout(120_000), // 2-minute timeout per image
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} from Bluesminds images`);
    }

    const json = (await res.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
    const item = json.data?.[0];
    if (item?.b64_json) {
      return Buffer.from(item.b64_json, "base64");
    }
    if (item?.url) {
      const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(120_000) });
      if (!imgRes.ok) throw new Error(`image download HTTP ${imgRes.status} from ${item.url}`);
      return Buffer.from(await imgRes.arrayBuffer());
    }
    throw new Error("Bluesminds returned no image url/b64");
  } catch (err) {
    if (attempt >= 4) throw err;
    // Bluesminds rate-limits image generation hard (429/502) — back off generously.
    const backoff = attempt * 12_000;
    console.warn(
      `  ↩  Bluesminds image attempt ${attempt} failed, retrying in ${backoff / 1000}s… (${String(err).slice(0, 80)})`
    );
    await sleep(backoff);
    return fetchImage(prompt, _seed, attempt + 1);
  }
}

/**
 * Generate all four images for a chapter and write them to disk.
 * Returns the paths to the written files relative to outputDir.
 */
export async function generateImages(
  prompts: ChapterPrompts,
  outputDir: string,
  opts: { dryRun?: boolean } = {}
): Promise<{
  cover: string;
  scene_01: string;
  scene_02: string;
  scene_03: string;
}> {
  fs.mkdirSync(outputDir, { recursive: true });

  const entries: Array<{ key: keyof ChapterPrompts; filename: string; seedOffset: number }> = [
    { key: "cover",    filename: "cover.png",    seedOffset: 0 },
    { key: "scene_01", filename: "scene_01.png", seedOffset: 1 },
    { key: "scene_02", filename: "scene_02.png", seedOffset: 2 },
    { key: "scene_03", filename: "scene_03.png", seedOffset: 3 },
  ];

  const paths: Record<string, string> = {};

  for (const { key, filename, seedOffset } of entries) {
    const filePath = path.join(outputDir, filename);
    const prompt = prompts[key];

    if (opts.dryRun) {
      console.log(`  [dry-run] Would generate ${filename}`);
      console.log(`    Prompt (first 120 chars): ${prompt.slice(0, 120)}…`);
      paths[key] = filePath;
      continue;
    }

    // Skip if already exists (allows resuming interrupted runs)
    if (fs.existsSync(filePath)) {
      console.log(`  ✓ ${filename} already exists — skipping`);
      paths[key] = filePath;
      continue;
    }

    console.log(`  ⬇  Generating ${filename}…`);
    const buffer = await fetchImage(prompt, seedOffset);
    fs.writeFileSync(filePath, buffer);
    paths[key] = filePath;
    console.log(`  ✓ Saved ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);

    // Bluesminds image endpoint rate-limits aggressively — space requests out.
    await sleep(Number(process.env.ART_IMAGE_DELAY_MS ?? 12_000));
  }

  return {
    cover:    paths["cover"],
    scene_01: paths["scene_01"],
    scene_02: paths["scene_02"],
    scene_03: paths["scene_03"],
  };
}
