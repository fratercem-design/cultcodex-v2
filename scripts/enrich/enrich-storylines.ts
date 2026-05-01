// AI narrative summaries for each Series — builds storyline descriptions
// from episodes within each series. Updates Series.description with rich AI content.
//
// Usage:
//   npx tsx scripts/enrich/enrich-storylines.ts [--batch N] [--force]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "../ingest/lib";

const LOG_PATH = path.join(__dirname, "enrich-storylines.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

const SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show hosted by Psyche (aka Trix). You write series/storyline descriptions for the archive's knowledge graph.

Given a series name and a sample of its episodes (with titles and summaries), write a rich description that captures:
1. What this series IS (the format, theme, recurring structure)
2. The arc or narrative evolution across episodes (if any)
3. What makes it distinctive within the Cult of Psyche universe
4. Key recurring characters, concepts, or motifs (if identifiable)

Format: 2-4 paragraphs. Vivid, fan-wiki style. No bullet points. Present tense.
Return ONLY the description text — no JSON, no headers, no preamble.`;

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = 20;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--force") force = true;
  }
  return { batch, force };
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  const series = await prisma.series.findMany({
    where: force ? {} : { OR: [{ description: null }, { description: "" }] },
    include: {
      episodes: {
        where: { OR: [{ summaryShort: { not: null } }, { summaryLong: { not: null } }] },
        select: { title: true, summaryShort: true, summaryLong: true, airDate: true, episodeNumber: true },
        orderBy: { airDate: "asc" },
        take: 20,
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const candidates = series.filter((s) => s.episodes.length >= 2).slice(0, batch);

  log(`Series needing descriptions: ${series.filter(s => s.episodes.length >= 2).length}`);
  log(`Processing batch of ${candidates.length}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001";

  let success = 0;
  let failures = 0;

  for (const s of candidates) {
    log(`Building storyline: "${s.title}" (${s.episodes.length} episodes)`);
    try {
      const episodeList = s.episodes.map((ep) =>
        `- ${ep.title}${ep.summaryShort ? `: ${ep.summaryShort}` : ""}`
      ).join("\n");

      const userMsg = [
        `Series: "${s.title}"`,
        `Type: ${s.type}`,
        `Episode count: ${s.episodes.length}`,
        "",
        `Sample episodes:`,
        episodeList,
      ].join("\n");

      const response = await client.messages.create({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });

      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") throw new Error("No text response");

      await prisma.series.update({
        where: { id: s.id },
        data: { description: text.text.trim() },
      });

      log(`  ✓ ${s.title}`);
      success++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${s.title}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}`);
  await disconnect();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
