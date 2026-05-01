// Character profiles for all people across ALL CultofPsyche channels.
// CI-compatible — no local file dependencies.
// Queries DB for people with multiple appearances, generates loreSummary via Claude.
//
// Usage:
//   npx tsx scripts/enrich/enrich-people.ts [--batch N] [--min-appearances N] [--force]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "../ingest/lib";

const LOG_PATH = path.join(__dirname, "enrich-people.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

const SYSTEM_PROMPT = `You are an expert archivist for CultCodex.me — the living archive of the "Cult of Psyche" show. You write character profiles for the wiki/codex — think of this as a TV wiki page for a recurring character, but for a live-streaming show.

The show is hosted by "Psyche" (also called "Trix") on @CultofPsyche and @PsychesNightmares. Content includes tarot, consciousness exploration, occult topics, panel discussions, and live community events.

Write a structured character profile based on the data provided.

IMPORTANT: Write for an audience of show fans. Be specific about storylines and controversies only if they are clearly documented in the provided data — do not speculate or hallucinate.

Use these EXACT sections (## headers):

## Overview
2-3 sentences: who this person is, their role on the show, their energy. Include their relationship to the host and community.

## Storylines
Bullet points or short paragraphs describing main narrative arcs or recurring themes across their appearances. Reference specific episode topics if available. If no clear storylines, write "No major storylines identified yet."

## Controversies
(Only include if controversies are clearly documented in the data)
Describe contentious situations, feuds, callouts, or drama as discussed on-stream. Preface with "As discussed on stream:". OMIT this section entirely if nothing controversial.

## Key Relationships
Who this person frequently appears with, their dynamic with the host, notable bonds or rivalries.

Return ONLY the profile text — no JSON, no extra commentary.`;

function parseArgs(): { batch: number; minAppearances: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = 20;
  let minAppearances = 2;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--min-appearances" && args[i + 1]) { minAppearances = parseInt(args[i + 1], 10); i++; }
    if (args[i] === "--force") force = true;
  }
  return { batch, minAppearances, force };
}

async function main() {
  const { batch, minAppearances, force } = parseArgs();
  const prisma = getPrisma();

  const allPeople = await prisma.person.findMany({
    where: { personType: { in: ["guest", "host", "recurring"] } },
    include: {
      guestAppearances: {
        include: {
          episode: {
            select: { id: true, title: true, airDate: true, summaryShort: true, summaryLong: true },
          },
        },
      },
      quotes: { select: { text: true, context: true }, take: 15 },
    },
    orderBy: { displayName: "asc" },
  });

  const eligible = allPeople
    .filter((p) => p.guestAppearances.length >= minAppearances)
    .filter((p) => force || !p.loreSummary || p.loreSummary.length < 100)
    .sort((a, b) => b.guestAppearances.length - a.guestAppearances.length)
    .slice(0, batch);

  log(`People with ≥${minAppearances} appearances: ${allPeople.filter(p => p.guestAppearances.length >= minAppearances).length}`);
  log(`Needing profiles: ${allPeople.filter(p => p.guestAppearances.length >= minAppearances && (force || !p.loreSummary || p.loreSummary.length < 100)).length}`);
  log(`Processing batch of ${eligible.length}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ENRICHMENT_MODEL ?? "claude-haiku-4-5-20251001";

  let success = 0;
  let failures = 0;

  for (const person of eligible) {
    log(`Building profile: ${person.displayName} (${person.guestAppearances.length} appearances)`);
    try {
      const coGuestCounts = new Map<string, number>();
      for (const g of person.guestAppearances) {
        const others = await prisma.episodeGuest.findMany({
          where: { episodeId: g.episode.id, personId: { not: person.id } },
          include: { person: { select: { displayName: true } } },
        });
        for (const o of others) {
          coGuestCounts.set(o.person.displayName, (coGuestCounts.get(o.person.displayName) ?? 0) + 1);
        }
      }
      const topCoGuests = Array.from(coGuestCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name]) => name);

      const userMsg = [
        `Person: "${person.displayName}" (${person.personType})`,
        person.shortBio ? `Bio: ${person.shortBio}` : "",
        `Total appearances: ${person.guestAppearances.length}`,
        topCoGuests.length ? `Frequent co-guests: ${topCoGuests.join(", ")}` : "",
        "",
        `Recent episodes (latest ${Math.min(person.guestAppearances.length, 10)}):`,
        ...person.guestAppearances.slice(-10).map((g) =>
          `- ${g.episode.title}${g.episode.summaryShort ? `: ${g.episode.summaryShort}` : ""}`
        ),
        person.quotes.length ? `\nNotable quotes:\n${person.quotes.slice(0, 5).map((q) => `- "${q.text}"${q.context ? ` [${q.context}]` : ""}`).join("\n")}` : "",
      ].filter(Boolean).join("\n");

      const response = await client.messages.create({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      });

      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") throw new Error("No text response");

      await prisma.person.update({
        where: { id: person.id },
        data: {
          loreSummary: text.text.trim(),
          personType: person.guestAppearances.length >= 5 ? "recurring" : person.personType,
        },
      });

      log(`  ✓ ${person.displayName}`);
      success++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${person.displayName}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, failures: ${failures}`);
  await disconnect();
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
