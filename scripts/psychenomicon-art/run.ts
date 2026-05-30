#!/usr/bin/env npx tsx
// scripts/psychenomicon-art/run.ts
//
// Main pipeline orchestrator.
// Reads Psychenomicon chapters from the DB, runs Claude symbolic analysis,
// builds cinematic prompts, fetches images from Pollinations AI, and saves
// structured output per chapter.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/psychenomicon-art/run.ts [options]
//
// Options:
//   --chapter <slug>   Process a single chapter by slug
//   --batch <n>        Process at most N chapters (default: all)
//   --force            Re-process chapters that already have output
//   --dry-run          Analyze + build prompts, skip Pollinations image generation
//   --skip-images      Same as --dry-run but saves prompts to disk

import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

import { getPrisma, disconnect } from "../ingest/lib";
import { analyzeChapter } from "./analyze";
import { buildPrompts } from "./prompts";
import { generateImages } from "./images";
import { uploadChapterArt } from "./upload";
import type { ChapterArtOutput } from "./types";

// ─── Output directories ────────────────────────────────────────────────────

const SCRIPT_DIR = __dirname;
const OUTPUT_DIR  = path.join(SCRIPT_DIR, "output");
const PROMPTS_DIR = path.join(OUTPUT_DIR, "prompts");
const IMAGES_DIR  = path.join(OUTPUT_DIR, "images");
const LOG_PATH    = path.join(SCRIPT_DIR, "art-pipeline.log");

// ─── Logging ──────────────────────────────────────────────────────────────

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

// ─── CLI arg parsing ──────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let chapterSlug: string | undefined;
  let batch: number | undefined;
  let force = false;
  let dryRun = false;
  let skipImages = false;
  let skipUpload = false;

  let uploadOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--chapter" && args[i + 1]) { chapterSlug = args[++i]; }
    if (args[i] === "--batch"   && args[i + 1]) { batch = parseInt(args[++i], 10); }
    if (args[i] === "--force")        { force = true; }
    if (args[i] === "--dry-run")      { dryRun = true; skipImages = true; }
    if (args[i] === "--skip-images")  { skipImages = true; }
    if (args[i] === "--skip-upload")  { skipUpload = true; }
    if (args[i] === "--upload-only")  { uploadOnly = true; }
  }

  return { chapterSlug, batch, force, dryRun, skipImages, skipUpload, uploadOnly };
}

// ─── Helper: check if chapter already has output ─────────────────────────

function hasExistingOutput(slug: string): boolean {
  const promptFile = path.join(PROMPTS_DIR, `${slug}.json`);
  const coverFile  = path.join(IMAGES_DIR, slug, "cover.png");
  return fs.existsSync(promptFile) && fs.existsSync(coverFile);
}

// ─── Sleep ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const { chapterSlug, batch, force, dryRun, skipImages, skipUpload, uploadOnly } = parseArgs();

  // Ensure output directories exist
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR,  { recursive: true });

  log("━━━ Psychenomicon Art Pipeline ━━━");
  if (dryRun)       log("  Mode: dry-run (no images generated)");
  if (skipImages)   log("  Mode: skip-images (prompts only)");
  if (skipUpload)   log("  Mode: skip-upload (no Supabase upload)");
  if (force)        log("  Mode: force (re-process existing outputs)");
  if (uploadOnly)   log("  Mode: upload-only (skip Claude + image gen, upload existing local files)");
  if (chapterSlug) log(`  Filter: chapter slug = ${chapterSlug}`);
  if (batch)       log(`  Batch limit: ${batch}`);

  const prisma = getPrisma();
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

  // ─── Fetch chapters from DB ────────────────────────────────────────────

  log("Fetching chapters from DB…");

  const whereClause = chapterSlug ? { slug: chapterSlug } : undefined;
  const takeClause  = batch ? { take: batch } : undefined;

  const chapters = await prisma.psychenomiconChapter.findMany({
    where: whereClause,
    orderBy: { chapterNumber: "asc" },
    ...(takeClause ?? {}),
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
    },
  });

  if (chapters.length === 0) {
    log("No chapters found. Is the DB populated? Exiting.");
    await disconnect();
    process.exit(0);
  }

  log(`Found ${chapters.length} chapter(s) to process.`);

  // ─── Process each chapter ─────────────────────────────────────────────

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const chapter of chapters) {
    const label = `CH.${String(chapter.chapterNumber).padStart(3, "0")} "${chapter.title}" (${chapter.slug})`;

    // Skip if already done and not forced (upload-only always re-uploads)
    if (!force && !uploadOnly && hasExistingOutput(chapter.slug)) {
      log(`  ↷  ${label} — already processed, skipping (use --force to re-run)`);
      skipped++;
      continue;
    }

    log(`\n▶  Processing ${label}…`);

    // ── Upload-only mode: skip Claude + Pollinations, just upload existing files ──
    if (uploadOnly) {
      try {
        const chapterImagesDir = path.join(IMAGES_DIR, chapter.slug);
        const slots = ["cover", "scene_01", "scene_02", "scene_03"] as const;
        const missing = slots.filter(s => !fs.existsSync(path.join(chapterImagesDir, `${s}.png`)));
        if (missing.length > 0) {
          log(`  ⚠  Skipping — missing local images: ${missing.join(", ")}`);
          skipped++;
          continue;
        }
        log("  [1/1] Uploading to Supabase Storage…");
        const localPaths = {
          cover:    path.join(chapterImagesDir, "cover.png"),
          scene_01: path.join(chapterImagesDir, "scene_01.png"),
          scene_02: path.join(chapterImagesDir, "scene_02.png"),
          scene_03: path.join(chapterImagesDir, "scene_03.png"),
        };
        const artUrls = await uploadChapterArt(chapter.slug, localPaths, { dryRun });
        await prisma.psychenomiconChapter.update({
          where: { slug: chapter.slug },
          data: { artImageUrls: artUrls, artGeneratedAt: new Date() },
        });
        log(`  ✓  Art URLs saved to DB for ${chapter.slug}`);
        processed++;
      } catch (err) {
        logError(`Failed uploading ${label}`, err);
        failed++;
      }
      continue;
    }

    try {
      // ── Step 1: Claude symbolic analysis ──────────────────────────────
      log("  [1/3] Symbolic analysis via Claude…");
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
      log(`     Themes: ${analysis.themes.slice(0, 3).join(", ")}…`);
      log(`     Symbols: ${analysis.symbols.slice(0, 4).join(", ")}…`);
      log(`     Mood: ${analysis.mood}`);

      // Brief pause between Claude calls to avoid rate-limit bursts
      await sleep(1_000);

      // ── Step 2: Build cinematic prompts ───────────────────────────────
      log("  [2/3] Building cinematic prompts via Claude…");
      const prompts = await buildPrompts(client, analysis);
      log(`     Cover (${prompts.cover.length} chars): ${prompts.cover.slice(0, 80)}…`);

      // Save prompts JSON immediately (survives partial failures)
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

      // ── Step 3: Generate images ───────────────────────────────────────
      if (!skipImages) {
        log("  [3/3] Generating images via Pollinations AI…");
        const chapterImagesDir = path.join(IMAGES_DIR, chapter.slug);

        const imagePaths = await generateImages(prompts, chapterImagesDir, {
          dryRun,
        });

        // Update the saved JSON with local image paths
        const fullOutput: ChapterArtOutput = {
          ...(output as ChapterArtOutput),
          imagePaths: {
            cover:    path.relative(OUTPUT_DIR, imagePaths.cover),
            scene_01: path.relative(OUTPUT_DIR, imagePaths.scene_01),
            scene_02: path.relative(OUTPUT_DIR, imagePaths.scene_02),
            scene_03: path.relative(OUTPUT_DIR, imagePaths.scene_03),
          },
        };
        fs.writeFileSync(promptsPath, JSON.stringify(fullOutput, null, 2));
        log(`     Images saved to ${path.relative(process.cwd(), chapterImagesDir)}/`);

        // ── Step 4: Upload to Supabase Storage + write URLs to DB ─────────
        if (!skipUpload) {
          log("  [4/4] Uploading to Supabase Storage…");
          const artUrls = await uploadChapterArt(
            chapter.slug,
            {
              cover:    imagePaths.cover,
              scene_01: imagePaths.scene_01,
              scene_02: imagePaths.scene_02,
              scene_03: imagePaths.scene_03,
            },
            { dryRun }
          );

          // Persist URLs into the DB so the Next.js app can read them
          await prisma.psychenomiconChapter.update({
            where: { slug: chapter.slug },
            data: {
              artImageUrls:   artUrls,
              artGeneratedAt: new Date(),
            },
          });
          log(`  ✓  Art URLs saved to DB for ${chapter.slug}`);
        } else {
          log("  [4/4] Skipping upload (--skip-upload)");
        }
      } else {
        log("  [3/3] Skipping image generation (--skip-images or --dry-run)");
      }

      processed++;
      log(`  ✓  ${label} complete.`);

    } catch (err) {
      logError(`Failed processing ${label}`, err);
      failed++;
      // Continue with next chapter rather than aborting the whole batch
    }

    // Polite gap between chapters to avoid hammering APIs
    await sleep(3_000);
  }

  // ─── Summary ─────────────────────────────────────────────────────────

  log(`\n━━━ Pipeline complete ━━━`);
  log(`  Processed: ${processed}`);
  log(`  Skipped:   ${skipped}`);
  log(`  Failed:    ${failed}`);
  log(`  Output:    ${path.relative(process.cwd(), OUTPUT_DIR)}/`);

  await disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal pipeline error:", err);
  process.exit(1);
});
