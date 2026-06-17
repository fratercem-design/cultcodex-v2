/**
 * Clean grammar in quote text using Claude.
 *
 * Fixes: sentence-fragment capitalization, missing terminal punctuation,
 * run-ons, filler words (uh/um), transcript artifacts (stutters, false starts),
 * and broken Unicode. Does NOT change meaning or trim quotes.
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/clean-quotes-grammar.ts [--batch N] [--dry-run]
 *
 * Flags:
 *   --batch N    process up to N quotes per run (default: 200)
 *   --dry-run    print changes without writing to DB
 *   --force      re-clean quotes that already have a cleaned version
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { getPrisma, disconnect } from "./ingest/lib";
import { makeClient, resolveModel } from "./bedrock";

const LOG_PATH = path.join(__dirname, "clean-quotes-grammar.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

const SYSTEM_PROMPT = `You are a transcript editor for CultCodex.me, the archive of the "Cult of Psyche" show. You receive raw quotes pulled from transcripts and return a lightly cleaned version.

Rules:
1. Fix obvious grammar errors: missing capitals at sentence start, missing terminal punctuation (. ! ?), broken mid-word splits from OCR/ASR.
2. Remove filler words that add nothing: "uh", "um", "umm", "uhh", "like" (when used as filler only), false starts ("I-I mean", "it's- it's").
3. Fix stutters: "I-I was" → "I was", "it's-it's" → "it's".
4. Fix broken Unicode or encoding artifacts (â€™ → ', â€œ → ", etc.).
5. Preserve the speaker's voice and vocabulary — do NOT paraphrase or rewrite.
6. Preserve intentional fragments or incomplete thoughts that carry meaning.
7. If the text is already clean, return it exactly as-is.

Return ONLY the cleaned text — no explanation, no JSON, no quotes around it.`;

function parseArgs(): { batch: number; dryRun: boolean; force: boolean } {
  const args = process.argv.slice(2);
  let batch = 200;
  let dryRun = false;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--dry-run") dryRun = true;
    if (args[i] === "--force") force = true;
  }
  return { batch, dryRun, force };
}

function needsCleaning(text: string): boolean {
  if (/\b(uh|um|umm|uhh)\b/i.test(text)) return true;
  if (/\b(\w+)-\1\b/i.test(text)) return true;
  if (/^[a-z]/.test(text.trim())) return true;
  if (/â€|Ã |Ã©|â€™|â€œ|â€/.test(text)) return true;
  if (/  /.test(text)) return true;
  return false;
}

async function cleanQuote(client: Anthropic | AnthropicBedrock, model: string, text: string): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: text }],
  });
  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response");
  return block.text.trim();
}

async function main() {
  const { batch, dryRun, force } = parseArgs();
  const prisma = getPrisma();

  log(`Starting quote grammar cleanup — batch: ${batch}, dry-run: ${dryRun}`);

  const quotes = await prisma.quote.findMany({
    select: { id: true, text: true },
    orderBy: { createdAt: "asc" },
    take: force ? batch : batch * 5,
  });

  const candidates = force
    ? quotes.slice(0, batch)
    : quotes.filter((q) => needsCleaning(q.text)).slice(0, batch);

  log(`Quotes fetched: ${quotes.length} — candidates needing cleanup: ${candidates.length}`);

  if (candidates.length === 0) {
    log("Nothing to clean.");
    await disconnect();
    return;
  }

  const client = makeClient();
  const model = await resolveModel(client, log);

  let changed = 0;
  let unchanged = 0;
  let failures = 0;

  for (const q of candidates) {
    try {
      const cleaned = await cleanQuote(client, model, q.text);

      if (cleaned === q.text) {
        unchanged++;
        continue;
      }

      if (dryRun) {
        log(`  [DRY] "${q.text.slice(0, 80)}" → "${cleaned.slice(0, 80)}"`);
      } else {
        await prisma.quote.update({ where: { id: q.id }, data: { text: cleaned } });
        log(`  ✓ "${q.text.slice(0, 60)}" → "${cleaned.slice(0, 60)}"`);
      }
      changed++;

      await new Promise((r) => setTimeout(r, 150));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED id=${q.id}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — changed: ${changed}, unchanged: ${unchanged}, failures: ${failures}`);
  await disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
