// AI description generator for Topic records ("Signals" in the nav).
// Finds topics with no description, fetches context from linked
// episodes/lore/people, and asks the enrichment ladder to write a concise
// Psycheverse-aware description. Updates topic.description in the DB.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/enrich/enrich-topics.ts [--batch N] [--min-episodes N] [--force | --regen-misgendered]
//
// Modes (pick one; default is "fill in missing descriptions"):
//   --force               re-generate every candidate, even ones with a description
//   --regen-misgendered   ONLY topics whose "In the Psycheverse:" paragraph refers to
//                         Psyche with she/her — the output of runs that used the old
//                         prompt copy without the pronoun rule. Overwrites those.
//
// Tips:
//   --batch 50          process 50 topics per run (default: 30)
//   --min-episodes 2    only topics with ≥ 2 linked episodes (skips orphans, which
//                       have nothing to write from)
//
// Provider: goes through src/lib/enrichment-llm's ladder, same as the admin
// route, so any configured tier works (direct Anthropic, OpenRouter, Groq,
// Mistral, Bedrock). Set ENRICHMENT_PROVIDER=bedrock to force one tier.
//
// Every overwrite is backed up first to enrich-topics.backup.jsonl (gitignored
// with the log) as {id, slug, before} so a bad run can be reverted by hand.
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { enrichComplete } from "../../src/lib/enrichment-llm";
import {
  TOPIC_ENRICHMENT_SYSTEM_PROMPT,
  buildTopicEnrichmentMessage,
  psycheverseParagraphMisgenders,
  type TopicEnrichmentContext,
} from "../../src/lib/prompts/topic-enrichment";

const LOG_PATH = path.join(__dirname, "enrich-topics.log");
const BACKUP_PATH = path.join(__dirname, "enrich-topics.backup.jsonl");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parseArgs(): { batch: number; force: boolean; regenMisgendered: boolean; minEpisodes: number } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "30", 10);
  let force = false;
  let regenMisgendered = false;
  let minEpisodes = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--min-episodes" && args[i + 1]) { minEpisodes = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--force") force = true;
    if (args[i] === "--regen-misgendered") regenMisgendered = true;
  }
  if (force && regenMisgendered) throw new Error("--force and --regen-misgendered are exclusive");
  return { batch, force, regenMisgendered, minEpisodes };
}

async function main() {
  const { batch, force, regenMisgendered, minEpisodes } = parseArgs();
  const prisma = getPrisma();

  const mode = regenMisgendered ? "regen-misgendered" : force ? "force" : "fill-missing";
  log(`Mode: ${mode}`);

  // Candidate pool. --regen-misgendered filters in JS below (needs the text);
  // the other two modes filter in SQL.
  const topics = await prisma.topic.findMany({
    where: regenMisgendered
      ? { description: { contains: "In the Psycheverse:" } }
      : force
      ? {}
      : { OR: [{ description: null }, { description: "" }] },
    include: {
      episodes: {
        include: {
          episode: {
            select: { title: true, summaryShort: true, summaryLong: true },
          },
        },
        take: 15,
      },
      lore: {
        include: { loreEntry: { select: { title: true } } },
        take: 5,
      },
      people: {
        include: { person: { select: { displayName: true } } },
        take: 5,
      },
    },
    orderBy: { title: "asc" },
  });

  const eligible = topics.filter(
    (t) =>
      t.episodes.length >= minEpisodes &&
      (!regenMisgendered || psycheverseParagraphMisgenders(t.description))
  );
  const candidates = eligible.slice(0, batch);

  log(`Topics eligible: ${eligible.length} (min-episodes: ${minEpisodes})`);
  log(`Processing batch of ${candidates.length}`);

  let success = 0;
  let failures = 0;
  let stillMisgendered = 0;

  for (const topic of candidates) {
    try {
      const sampleSummaries = topic.episodes
        .flatMap((e) => [e.episode.summaryShort, e.episode.summaryLong?.slice(0, 200)])
        .filter((s): s is string => !!s && s.length > 20);

      const description = await generateDescription({
        title: topic.title,
        episodeTitles: topic.episodes.map((e) => e.episode.title),
        loreTitles: topic.lore.map((l) => l.loreEntry.title),
        peopleNames: topic.people.map((p) => p.person.displayName),
        sampleSummaries,
      });

      // A regenerated description that STILL misgenders is not an improvement;
      // keep the old one and flag it rather than swap one wrong text for another.
      if (regenMisgendered && psycheverseParagraphMisgenders(description)) {
        stillMisgendered++;
        log(`  ⚠ STILL MISGENDERED (kept old) ${topic.title}`);
        continue;
      }

      if (topic.description) {
        fs.appendFileSync(
          BACKUP_PATH,
          JSON.stringify({ id: topic.id, slug: topic.slug, before: topic.description, at: new Date().toISOString() }) + "\n"
        );
      }

      // Guard on the exact prior text so a concurrent edit is skipped, not clobbered.
      const res = await prisma.topic.updateMany({
        where: { id: topic.id, description: topic.description },
        data: { description },
      });
      if (res.count === 0) {
        log(`  ↷ SKIPPED (changed underneath us) ${topic.title}`);
        continue;
      }

      log(`  ✓ ${topic.title}`);
      success++;

      // Small delay for rate limiting
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${topic.title}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}${regenMisgendered ? `, still misgendered (kept): ${stillMisgendered}` : ""}`);
  log(`Run again to continue. Remaining in pool: ${eligible.length - success}`);

  await disconnect();
}

async function generateDescription(input: TopicEnrichmentContext): Promise<string> {
  const text = await enrichComplete({
    system: TOPIC_ENRICHMENT_SYSTEM_PROMPT,
    user: buildTopicEnrichmentMessage(input),
    maxTokens: 300,
  });
  if (!text.trim()) throw new Error("No text response");
  return text.trim();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
