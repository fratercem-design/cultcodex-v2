/**
 * Enrich unenriched LoreEntry records with AI-generated summary + fullEntry.
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/enrich/enrich-lore.ts [--batch N] [--force]
 *
 * Flags:
 *   --batch N   process up to N entries per run (default: 40)
 *   --force     re-generate even if summary already exists
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect } from "../ingest/lib";
import { complete, init } from "../bedrock";

const LOG_PATH = path.join(__dirname, "enrich-lore.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

const SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show. The show is hosted by Psyche (also called Trix): a spiritual teacher, tarot reader, occultist, and livestreamer. The show covers consciousness, mythology, tarot, astrology, esoteric philosophy, panelverse drama, and community lore.

You are writing lore entries for the archive's knowledge graph. Each lore entry is a concept, event, person-archetype, recurring phrase, or cultural artifact from the Psycheverse.

Return a JSON object with exactly two fields:
{
  "summary": "1–2 sentences. A tight, vivid definition of what this lore entry IS in the Psycheverse context.",
  "fullEntry": "3–5 sentences. Expand on the summary: origin if known, how it manifests in the show, why it matters to the community, and any recurring significance. Write in the voice of an engaged archivist — specific, not generic."
}

Rules:
- Stay grounded in what the show and community actually are
- Do not invent specific episode numbers or dates
- Use present tense where possible
- Do not use filler phrases like "delves into" or "exploring the intersection"
- Return ONLY the JSON object — no markdown fences, no extra text`;

function buildUserMessage(input: {
  title: string;
  category: string | null;
  episodeTitles: string[];
  peopleTitles: string[];
  topicTitles: string[];
  sampleSummaries: string[];
}): string {
  const parts = [`Lore entry title: "${input.title}"`];

  if (input.category) {
    parts.push(`Category: ${input.category}`);
  }

  if (input.sampleSummaries.length > 0) {
    parts.push(
      `\nContext from linked episodes:\n${input.sampleSummaries
        .slice(0, 5)
        .map((s) => `- ${s}`)
        .join("\n")}`
    );
  } else if (input.episodeTitles.length > 0) {
    parts.push(
      `\nEpisodes where this appears:\n${input.episodeTitles
        .slice(0, 8)
        .map((t) => `- ${t}`)
        .join("\n")}`
    );
  }

  if (input.peopleTitles.length > 0) {
    parts.push(`\nPeople connected: ${input.peopleTitles.slice(0, 5).join(", ")}`);
  }

  if (input.topicTitles.length > 0) {
    parts.push(`\nRelated topics: ${input.topicTitles.slice(0, 5).join(", ")}`);
  }

  return parts.join("\n");
}

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = 40;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--force") force = true;
  }
  return { batch, force };
}

function stripJsonFence(text: string): string {
  // Some models wrap JSON in ```json fences despite instructions; strip them.
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

async function generateEntry(
  input: Parameters<typeof buildUserMessage>[0]
): Promise<{ summary: string; fullEntry: string }> {
  const text = await complete(
    { system: SYSTEM_PROMPT, user: buildUserMessage(input), maxTokens: 600 },
    log
  );

  const parsed = JSON.parse(stripJsonFence(text));
  if (!parsed.summary || !parsed.fullEntry) throw new Error("Missing summary or fullEntry in response");
  return { summary: String(parsed.summary), fullEntry: String(parsed.fullEntry) };
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  const entries = await prisma.loreEntry.findMany({
    where: force
      ? {}
      : { OR: [{ summary: null }, { summary: "" }] },
    include: {
      episodes: {
        include: {
          episode: { select: { title: true, summaryShort: true } },
        },
        take: 10,
      },
      people: {
        include: { person: { select: { displayName: true } } },
        take: 5,
      },
      topics: {
        include: { topic: { select: { title: true } } },
        take: 5,
      },
    },
    orderBy: { title: "asc" },
    take: batch,
  });

  const total = await prisma.loreEntry.count({
    where: force ? {} : { OR: [{ summary: null }, { summary: "" }] },
  });

  log(`Unenriched lore entries: ${total} — processing batch of ${entries.length}`);

  await init(log);

  let success = 0;
  let failures = 0;

  for (const entry of entries) {
    try {
      const sampleSummaries = entry.episodes
        .map((e) => e.episode.summaryShort)
        .filter((s): s is string => !!s && s.length > 20);

      const result = await generateEntry({
        title: entry.title,
        category: entry.category,
        episodeTitles: entry.episodes.map((e) => e.episode.title),
        peopleTitles: entry.people.map((p) => p.person.displayName),
        topicTitles: entry.topics.map((t) => t.topic.title),
        sampleSummaries,
      });

      await prisma.loreEntry.update({
        where: { id: entry.id },
        data: {
          summary: result.summary,
          fullEntry: result.fullEntry,
        },
      });

      log(`  ✓ ${entry.title}`);
      success++;

      await new Promise((r) => setTimeout(r, 250));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${entry.title}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}`);
  if (total - success > 0) {
    log(`${total - success} entries remaining — run again to continue`);
  }

  await disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
