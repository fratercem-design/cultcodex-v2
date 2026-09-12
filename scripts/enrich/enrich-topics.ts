// AI description generator for Topic records.
// Finds topics with no description (or very short ones), fetches context
// from linked episodes/lore/people, and calls Claude to write a concise
// Psycheverse-aware description. Updates topic.description in the DB.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/enrich/enrich-topics.ts [--batch N] [--force] [--min-episodes N]
//
// Tips:
//   --batch 50    process 50 topics per run (default: 30)
//   --force       re-generate descriptions even if one already exists
//   --min-episodes 2   only enrich topics with ≥ 2 linked episodes (avoids orphan topics)
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "../ingest/lib";
import {
  TOPIC_ENRICHMENT_SYSTEM_PROMPT,
  buildTopicEnrichmentMessage,
} from "../../src/lib/prompts/topic-enrichment";

const LOG_PATH = path.join(__dirname, "enrich-topics.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parseArgs(): { batch: number; force: boolean; minEpisodes: number } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "30", 10);
  let force = false;
  let minEpisodes = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--min-episodes" && args[i + 1]) { minEpisodes = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--force") force = true;
  }
  return { batch, force, minEpisodes };
}

async function main() {
  const { batch, force, minEpisodes } = parseArgs();
  const prisma = getPrisma();

  // Find topics needing descriptions
  const topics = await prisma.topic.findMany({
    where: {
      ...(force ? {} : {
        OR: [{ description: null }, { description: "" }],
      }),
    },
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

  // Filter by minimum episode count
  const candidates = topics
    .filter((t) => t.episodes.length >= minEpisodes)
    .slice(0, batch);

  log(`Topics needing description: ${topics.filter(t => t.episodes.length >= minEpisodes).length}`);
  log(`Processing batch of ${candidates.length} (min-episodes: ${minEpisodes})`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001"; // Haiku for cost-efficiency on bulk

  let success = 0;
  let failures = 0;

  for (const topic of candidates) {
    try {
      const sampleSummaries = topic.episodes
        .flatMap((e) => [e.episode.summaryShort, e.episode.summaryLong?.slice(0, 200)])
        .filter((s): s is string => !!s && s.length > 20);

      const description = await generateDescription(client, model, {
        title: topic.title,
        episodeTitles: topic.episodes.map((e) => e.episode.title),
        loreTitles: topic.lore.map((l) => l.loreEntry.title),
        peopleNames: topic.people.map((p) => p.person.displayName),
        sampleSummaries,
      });

      await prisma.topic.update({
        where: { id: topic.id },
        data: { description },
      });

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

  log(`\nDone — success: ${success}, failures: ${failures}`);
  log(`Run again to continue. Total remaining: ${topics.filter(t => t.episodes.length >= minEpisodes).length - success}`);

  await disconnect();
}

async function generateDescription(
  client: Anthropic,
  model: string,
  input: TopicEnrichmentContext
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: 300,
    system: TOPIC_ENRICHMENT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildTopicEnrichmentMessage(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

  return textBlock.text.trim();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
