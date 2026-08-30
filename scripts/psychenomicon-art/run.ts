#!/usr/bin/env npx tsx
// scripts/psychenomicon-art/run.ts
//
// Resumable, local-first Psychenomicon chapter-art pipeline.
// Database writes are disabled unless --publish is supplied explicitly.

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import OpenAI from "openai";

import { getPrisma, disconnect } from "../ingest/lib";
import { analyzeChapter } from "./analyze";
import { buildPrompts } from "./prompts";
import { generateImages } from "./images";
import { uploadChapterToRailway } from "./upload-railway";
import type { ChapterArtOutput } from "./types";

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR = path.join(SCRIPT_DIR, "output");
const PROMPTS_DIR = path.join(OUTPUT_DIR, "prompts");
const IMAGES_DIR = path.join(OUTPUT_DIR, "images");
const LOG_PATH = path.join(SCRIPT_DIR, "art-pipeline.log");
const SLOTS = ["cover", "scene_01", "scene_02", "scene_03"] as const;

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function logError(msg: string, err?: unknown) {
  const detail = err instanceof Error ? err.message : String(err ?? "");
  const line = `[${new Date().toISOString()}] ERROR ${msg}${detail ? `: ${detail}` : ""}`;
  console.error(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parsePositiveInt(flag: string, value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} requires a positive integer.`);
  }
  return parsed;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let chapterSlug: string | undefined;
  let batch: number | undefined;
  let maxNew: number | undefined;
  let stopAtTotal: number | undefined;
  let force = false;
  let dryRun = false;
  let skipImages = false;
  let skipUpload = true;
  let uploadOnly = false;
  let inventory = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chapter" && args[i + 1]) chapterSlug = args[++i];
    else if (args[i] === "--batch") batch = parsePositiveInt("--batch", args[++i]);
    else if (args[i] === "--max-new") maxNew = parsePositiveInt("--max-new", args[++i]);
    else if (args[i] === "--stop-at-total") stopAtTotal = parsePositiveInt("--stop-at-total", args[++i]);
    else if (args[i] === "--force") force = true;
    else if (args[i] === "--dry-run") { dryRun = true; skipImages = true; }
    else if (args[i] === "--skip-images") skipImages = true;
    else if (args[i] === "--skip-upload") skipUpload = true;
    else if (args[i] === "--publish") skipUpload = false;
    else if (args[i] === "--upload-only") uploadOnly = true;
    else if (args[i] === "--inventory") inventory = true;
    else throw new Error(`Unknown or incomplete argument: ${args[i]}`);
  }

  if (uploadOnly && skipUpload) {
    throw new Error("--upload-only requires explicit --publish authorization.");
  }
  if (inventory && !skipUpload) {
    throw new Error("--inventory cannot be combined with --publish.");
  }

  return {
    chapterSlug,
    batch,
    maxNew,
    stopAtTotal,
    force,
    dryRun,
    skipImages,
    skipUpload,
    uploadOnly,
    inventory,
  };
}

function isCreditExhausted(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return [
    "402",
    "payment required",
    "insufficient_quota",
    "credit balance",
    "insufficient credit",
    "quota",
  ].some((needle) => msg.includes(needle));
}

function hasExistingOutput(slug: string): boolean {
  if (!fs.existsSync(path.join(PROMPTS_DIR, `${slug}.json`))) return false;
  return SLOTS.every((slot) =>
    fs.existsSync(path.join(IMAGES_DIR, slug, `${slot}.png`))
  );
}

function getLocalCoverage() {
  const promptSlugs = fs.existsSync(PROMPTS_DIR)
    ? fs.readdirSync(PROMPTS_DIR)
        .filter((name) => name.endsWith(".json"))
        .map((name) => name.slice(0, -5))
    : [];
  const imageSlugs = fs.existsSync(IMAGES_DIR)
    ? fs.readdirSync(IMAGES_DIR).filter((name) => {
        const candidate = path.join(IMAGES_DIR, name);
        return fs.statSync(candidate).isDirectory();
      })
    : [];
  const allSlugs = new Set([...promptSlugs, ...imageSlugs]);
  const complete = [...allSlugs].filter(hasExistingOutput).length;
  return {
    prompts: promptSlugs.length,
    complete,
    partial: allSlugs.size - complete,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const options = parseArgs();
  const {
    chapterSlug,
    batch,
    maxNew,
    stopAtTotal,
    force,
    dryRun,
    skipImages,
    skipUpload,
    uploadOnly,
    inventory,
  } = options;

  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  log("━━━ Psychenomicon Art Pipeline ━━━");
  if (dryRun) log("  Mode: dry-run (no images generated)");
  if (skipImages) log("  Mode: skip-images (prompts only)");
  if (skipUpload) log("  Mode: local-only (publishing disabled; add --publish explicitly)");
  if (!skipUpload) log("  Mode: publish (database writes enabled)");
  if (force) log("  Mode: force (re-process existing outputs)");
  if (uploadOnly) log("  Mode: upload-only (publish existing local files)");
  if (inventory) log("  Mode: inventory (no AI calls or database writes)");
  if (chapterSlug) log(`  Filter: chapter slug = ${chapterSlug}`);
  if (batch) log(`  Batch limit: ${batch}`);
  if (maxNew) log(`  New chapter limit: ${maxNew}`);

  const prisma = getPrisma();

  if (inventory) {
    const [total, published, assets] = await Promise.all([
      prisma.psychenomiconChapter.count(),
      prisma.psychenomiconChapter.count({ where: { artGeneratedAt: { not: null } } }),
      prisma.psychenomiconArtAsset.count(),
    ]);
    const local = getLocalCoverage();
    log("━━━ Coverage inventory ━━━");
    log(`  Database chapters:       ${total}`);
    log(`  Published chapter art:   ${published}`);
    log(`  Remaining chapter art:   ${Math.max(0, total - published)}`);
    log(`  Stored art assets:       ${assets}`);
    log(`  Local prompt files:      ${local.prompts}`);
    log(`  Local complete chapters: ${local.complete}`);
    log(`  Local partial chapters:  ${local.partial}`);
    await disconnect();
    return;
  }

  if (!uploadOnly) {
    const apiKey =
      process.env.ART_API_KEY ??
      process.env.HCNSEC_API_KEY ??
      process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "No art API key is set. Use run-hcnsec.ps1 so the key is prompted securely."
      );
    }
  }

  const apiKey =
    process.env.ART_API_KEY ??
    process.env.HCNSEC_API_KEY ??
    process.env.OPENROUTER_API_KEY ??
    "upload-only";
  const client = new OpenAI({
    apiKey,
    baseURL:
      process.env.ART_API_BASE_URL ??
      (process.env.HCNSEC_API_KEY || process.env.ART_API_KEY
        ? "https://api.hcnsec.cn/v1"
        : process.env.OPENROUTER_BASE_URL ?? "https://api.bluesminds.com/v1"),
    defaultHeaders: { "HTTP-Referer": "https://cultcodex.me" },
  });

  log("Fetching chapters still missing published art from the configured database…");
  const whereClause = chapterSlug
    ? { slug: chapterSlug }
    : force
      ? undefined
      : { artGeneratedAt: null };
  const chapters = await prisma.psychenomiconChapter.findMany({
    where: whereClause,
    orderBy: { chapterNumber: "asc" },
    ...(batch ? { take: batch } : {}),
    select: {
      id: true,
      slug: true,
      title: true,
      chapterNumber: true,
      canonText: true,
      interpretationText: true,
      mythicText: true,
      emergingSignals: true,
      archetypesData: true,
      artGeneratedAt: true,
    },
  });

  if (chapters.length === 0) {
    log("No matching chapters need processing.");
    await disconnect();
    return;
  }
  log(`Found ${chapters.length} chapter(s) to consider.`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  const STOP_FILE = path.join(OUTPUT_DIR, "STOP");
  const writeStop = (reason: string) => {
    try {
      fs.writeFileSync(STOP_FILE, `${new Date().toISOString()} ${reason}\n`);
    } catch {
      // Best effort only.
    }
  };

  const artBaseline =
    !skipUpload && stopAtTotal != null
      ? await prisma.psychenomiconChapter.count({ where: { artGeneratedAt: { not: null } } })
      : 0;
  if (!skipUpload && stopAtTotal != null && artBaseline >= stopAtTotal) {
    writeStop(`art total ${artBaseline} >= stop-at-total ${stopAtTotal}`);
    log(`Target of ${stopAtTotal} published chapters already reached.`);
    await disconnect();
    return;
  }

  for (const chapter of chapters) {
    if (fs.existsSync(STOP_FILE)) {
      log("⏹  STOP file present — halting gracefully.");
      break;
    }
    if (maxNew && processed >= maxNew) {
      log(`⏸  Reached --max-new ${maxNew} this run — stopping.`);
      break;
    }
    if (!skipUpload && stopAtTotal != null && artBaseline + processed >= stopAtTotal) {
      writeStop(`art total reached stop-at-total ${stopAtTotal}`);
      log(`Reached ${stopAtTotal} total chapters with published art.`);
      break;
    }

    const label = `CH.${String(chapter.chapterNumber).padStart(3, "0")} "${chapter.title}" (${chapter.slug})`;
    const localComplete = hasExistingOutput(chapter.slug);

    if (localComplete && !force && !uploadOnly) {
      if (skipUpload) {
        log(`  ↷  ${label} — complete locally, skipping (use --force to regenerate)`);
        skipped++;
        continue;
      }
      try {
        const imageDir = path.join(IMAGES_DIR, chapter.slug);
        log(`  Publishing reviewed local files for ${label}…`);
        await uploadChapterToRailway(prisma, chapter.slug, {
          cover: path.join(imageDir, "cover.png"),
          scene_01: path.join(imageDir, "scene_01.png"),
          scene_02: path.join(imageDir, "scene_02.png"),
          scene_03: path.join(imageDir, "scene_03.png"),
        });
        processed++;
      } catch (err) {
        logError(`Failed publishing ${label}`, err);
        failed++;
      }
      continue;
    }

    log(`\n▶  Processing ${label}…`);

    if (uploadOnly) {
      try {
        const imageDir = path.join(IMAGES_DIR, chapter.slug);
        const missing = SLOTS.filter(
          (slot) => !fs.existsSync(path.join(imageDir, `${slot}.png`))
        );
        if (missing.length > 0) {
          log(`  ↷  Missing local images: ${missing.join(", ")}`);
          skipped++;
          continue;
        }
        await uploadChapterToRailway(prisma, chapter.slug, {
          cover: path.join(imageDir, "cover.png"),
          scene_01: path.join(imageDir, "scene_01.png"),
          scene_02: path.join(imageDir, "scene_02.png"),
          scene_03: path.join(imageDir, "scene_03.png"),
        });
        processed++;
      } catch (err) {
        logError(`Failed publishing ${label}`, err);
        failed++;
      }
      continue;
    }

    try {
      log("  [1/3] Building symbolic analysis…");
      const analysis = await analyzeChapter(client, {
        slug: chapter.slug,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        canonText: chapter.canonText,
        interpretationText: chapter.interpretationText,
        mythicText: chapter.mythicText,
        emergingSignals: chapter.emergingSignals,
        archetypesData: chapter.archetypesData,
      });
      log(`     Themes: ${analysis.themes.slice(0, 3).join(", ")}`);
      await sleep(1_000);

      log("  [2/3] Building compact cinematic prompts…");
      const prompts = await buildPrompts(client, analysis);
      const promptsPath = path.join(PROMPTS_DIR, `${chapter.slug}.json`);
      const output: Partial<ChapterArtOutput> = {
        slug: chapter.slug,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        generatedAt: new Date().toISOString(),
        analysis,
        prompts,
      };
      fs.writeFileSync(promptsPath, JSON.stringify(output, null, 2));
      log(`     Saved prompts → ${path.relative(process.cwd(), promptsPath)}`);
      await sleep(1_000);

      if (!skipImages) {
        log("  [3/3] Generating four images through the configured art provider…");
        const imageDir = path.join(IMAGES_DIR, chapter.slug);
        const imagePaths = await generateImages(prompts, imageDir, { dryRun });
        const fullOutput: ChapterArtOutput = {
          ...(output as ChapterArtOutput),
          imagePaths: {
            cover: path.relative(OUTPUT_DIR, imagePaths.cover),
            scene_01: path.relative(OUTPUT_DIR, imagePaths.scene_01),
            scene_02: path.relative(OUTPUT_DIR, imagePaths.scene_02),
            scene_03: path.relative(OUTPUT_DIR, imagePaths.scene_03),
          },
        };
        fs.writeFileSync(promptsPath, JSON.stringify(fullOutput, null, 2));
        log(`     Images saved to ${path.relative(process.cwd(), imageDir)}/`);

        if (!skipUpload && !dryRun) {
          await uploadChapterToRailway(prisma, chapter.slug, imagePaths);
          log(`  ✓  Published art for ${chapter.slug}`);
        } else {
          log("  ✓  Local files complete; database unchanged.");
        }
      } else {
        log("  [3/3] Image generation skipped; prompt file saved.");
      }

      processed++;
      log(`  ✓  ${label} complete.`);
    } catch (err) {
      logError(`Failed processing ${label}`, err);
      failed++;
      if (isCreditExhausted(err)) {
        writeStop("configured art provider credit or quota exhausted");
        log("Art-provider credit appears exhausted — wrote STOP and halted.");
        break;
      }
    }

    await sleep(3_000);
  }

  log("\n━━━ Pipeline complete ━━━");
  log(`  Processed: ${processed}`);
  log(`  Skipped:   ${skipped}`);
  log(`  Failed:    ${failed}`);
  log(`  Output:    ${path.relative(process.cwd(), OUTPUT_DIR)}/`);

  await disconnect();
  if (failed > 0) process.exitCode = 1;
}

main().catch(async (err) => {
  console.error("Fatal pipeline error:", err);
  await disconnect().catch(() => undefined);
  process.exitCode = 1;
});
