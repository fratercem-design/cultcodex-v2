// scripts/psychenomicon-art/images.ts
//
// Step 3: Generate images through an OpenAI-compatible /images/generations
// endpoint. HCNSEC + step-image-edit-2 is the preferred path; legacy
// Bluesminds settings remain supported. Images are requested as base64 so
// durable output never depends on an expiring provider URL.

import * as fs from "fs";
import * as path from "path";
import type { ChapterPrompts } from "./types";

const USING_HCNSEC = Boolean(process.env.HCNSEC_API_KEY || process.env.ART_API_KEY);
const API_BASE = (
  process.env.ART_API_BASE_URL ??
  (USING_HCNSEC ? "https://api.hcnsec.cn/v1" : process.env.OPENROUTER_BASE_URL) ??
  "https://api.bluesminds.com/v1"
).replace(/\/$/, "");
const IMAGE_MODEL =
  process.env.ART_IMAGE_MODEL ??
  (USING_HCNSEC ? "step-image-edit-2" : "grok-imagine-image-lite");
const IMAGE_SIZE = process.env.ART_IMAGE_SIZE ?? "1024x1024";
const IMAGE_PROMPT_MAX_CHARS = Number(
  process.env.ART_IMAGE_PROMPT_MAX_CHARS ??
    (IMAGE_MODEL === "step-image-edit-2" ? "512" : "4000")
);

export function prepareImagePrompt(
  prompt: string,
  maxChars = IMAGE_PROMPT_MAX_CHARS
): string {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (!Number.isFinite(maxChars) || maxChars < 64) {
    throw new Error(`Invalid ART_IMAGE_PROMPT_MAX_CHARS: ${maxChars}`);
  }
  if (compact.length <= maxChars) return compact;
  const clipped = compact.slice(0, maxChars - 1);
  const lastBoundary = Math.max(
    clipped.lastIndexOf(". "),
    clipped.lastIndexOf(", ")
  );
  const body =
    lastBoundary >= Math.floor(maxChars * 0.7)
      ? clipped.slice(0, lastBoundary + 1)
      : clipped;
  return `${body.trim()}…`;
}

export function stableSeed(prompt: string, offset = 0): number {
  let hash = 2166136261;
  for (const char of prompt) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) + offset) % 2147483647;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a single image through the configured provider.
 */
async function fetchImage(
  prompt: string,
  _seed: number,
  attempt = 1
): Promise<Buffer> {
  const apiKey =
    process.env.ART_API_KEY ??
    process.env.HCNSEC_API_KEY ??
    process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("No art API key set. Configure HCNSEC_API_KEY (preferred), ART_API_KEY, or OPENROUTER_API_KEY.");
  }
  const preparedPrompt = prepareImagePrompt(prompt);

  try {
    const res = await fetch(`${API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Base64 avoids expiring or auth-gated result URLs.
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: preparedPrompt,
        n: 1,
        size: IMAGE_SIZE,
        response_format: "b64_json",
        ...(IMAGE_MODEL === "step-image-edit-2"
          ? { cfg_scale: 2, steps: 12, seed: _seed, text_mode: false }
          : {}),
      }),
      signal: AbortSignal.timeout(120_000), // 2-minute timeout per image
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `HTTP ${res.status} ${res.statusText} from ${new URL(API_BASE).host} images${detail ? `: ${detail.slice(0, 300)}` : ""}`
      );
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
    throw new Error("Configured image provider returned no image url/b64");
  } catch (err) {
    if (attempt >= 4) throw err;
    // Image providers can rate-limit hard (429/502) — back off generously.
    const backoff = attempt * 12_000;
    console.warn(
      `  ↩  Image attempt ${attempt} failed, retrying in ${backoff / 1000}s… (${String(err).slice(0, 120)})`
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
    const buffer = await fetchImage(prompt, stableSeed(prompt, seedOffset));
    fs.writeFileSync(filePath, buffer);
    paths[key] = filePath;
    console.log(`  ✓ Saved ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);

    // Provider endpoints rate-limit aggressively — space requests out.
    await sleep(Number(process.env.ART_IMAGE_DELAY_MS ?? 12_000));
  }

  return {
    cover:    paths["cover"],
    scene_01: paths["scene_01"],
    scene_02: paths["scene_02"],
    scene_03: paths["scene_03"],
  };
}
