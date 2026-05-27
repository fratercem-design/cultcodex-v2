// scripts/psychenomicon-art/images.ts
//
// Step 3: Send prompts to Pollinations AI and save the resulting PNG files.
// No API key required. Retries up to 3× with exponential backoff.

import * as fs from "fs";
import * as path from "path";
import type { ChapterPrompts } from "./types";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";
const WIDTH = 1024;
const HEIGHT = 1536;
const MODEL = "flux"; // FLUX.1 via Pollinations
const SEED_BASE = 42;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single image from Pollinations AI.
 * Returns the raw image buffer.
 */
async function fetchImage(
  prompt: string,
  seed: number,
  attempt = 1
): Promise<Buffer> {
  const encoded = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_BASE}/${encoded}?width=${WIDTH}&height=${HEIGHT}&model=${MODEL}&seed=${seed}&nologo=true`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "image/png,image/*" },
      signal: AbortSignal.timeout(120_000), // 2-minute timeout per image
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} from Pollinations`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    if (attempt >= 3) throw err;
    const backoff = attempt * 4_000;
    console.warn(
      `  ↩  Pollinations attempt ${attempt} failed, retrying in ${backoff / 1000}s… (${String(err).slice(0, 80)})`
    );
    await sleep(backoff);
    return fetchImage(prompt, seed, attempt + 1);
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
    const buffer = await fetchImage(prompt, SEED_BASE + seedOffset);
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ Saved ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);

    // Polite delay between requests (Pollinations has implicit rate limits)
    await sleep(2_000);
  }

  return {
    cover:    paths["cover"],
    scene_01: paths["scene_01"],
    scene_02: paths["scene_02"],
    scene_03: paths["scene_03"],
  };
}
