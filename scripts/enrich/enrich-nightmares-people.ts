// Build rich character profiles for major recurring figures in @PsychesNightmares.
// Queries the DB for people with multiple appearances in nightmares episodes,
// then uses Claude to generate a structured loreSummary covering:
//   - Overview (who they are, their role)
//   - Storylines (narrative arcs they're part of)
//   - Controversies (anything contentious discussed on-stream)
//   - Key Relationships (who they connect with)
// Updates the Person.loreSummary field in the DB.
//
// Usage:
//   npx dotenvx run -- npx tsx scripts/enrich/enrich-nightmares-people.ts [--min-appearances N] [--force]
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { getPrisma, disconnect } from "../ingest/lib";

const NIGHTMARES_RAW = path.join(
  __dirname,
  "..",
  "scrape",
  "data",
  "youtube-raw-psychesnightmares.json"
);
const LOG_PATH = path.join(__dirname, "enrich-people.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

// ── Prompt ───────────────────────────────────────────────────────────────────
const PEOPLE_SYSTEM_PROMPT = `You are an expert archivist for the "Cult of Psyche" multimedia archive (cultcodex.me). You are writing character profiles for the wiki/codex — think of this as a TV wiki page for a recurring character, but for a live-streaming show.

The show is hosted by "Psyche" (also called "Trix") on @CultofPsyche and @PsychesNightmares. Content includes tarot, consciousness exploration, occult topics, panel discussions, and live community events.

You will receive data about a person: their appearances, quotes attributed to them, and any enriched episode summaries. Based on this, write a structured character profile.

IMPORTANT: Write for an audience of show fans. Be specific about storylines and controversies only if they are clearly documented in the provided data — do not speculate or hallucinate events. If there are no controversies, omit that section.

Write the profile in these EXACT sections (use ## for section headers):

## Overview
2-3 sentences about who this person is, their role on the show, and their overall character/energy. Include their relationship to the host and the community.

## Storylines
Bullet points or short paragraphs describing the main narrative arcs or recurring themes involving this person across their appearances. Each storyline should reference specific episodes or topics if possible. If no clear storylines exist, write "No major storylines identified yet."

## Controversies
(Only include this section if controversies are clearly documented in the episode data)
Describe any contentious situations, feuds, callouts, or drama involving this person as discussed on-stream. Preface with "As discussed on stream:" for anything sensitive. If nothing controversial, OMIT this section entirely.

## Key Relationships
Who this person frequently appears with, their dynamic with the host, and any notable bonds or rivalries with other community members.

Return ONLY the profile text in the sections above — no JSON, no extra commentary, no preamble.`;

function buildPersonMessage(input: {
  name: string;
  personType: string;
  shortBio: string | null;
  appearanceCount: number;
  episodes: Array<{
    title: string;
    airDate: string | null;
    summaryShort: string | null;
    summaryLong: string | null;
  }>;
  quotes: Array<{
    text: string;
    context: string | null;
  }>;
  coGuests: string[];
}): string {
  const episodesText = input.episodes
    .slice(0, 30)
    .map(
      (ep) =>
        `- "${ep.title}" (${ep.airDate ? ep.airDate.split("T")[0] : "unknown date"}): ${ep.summaryShort || ep.summaryLong?.slice(0, 200) || "(no summary)"}`
    )
    .join("\n");

  const quotesText = input.quotes
    .slice(0, 10)
    .map((q) => `  "${q.text}"${q.context ? ` [context: ${q.context}]` : ""}`)
    .join("\n");

  const coGuestsText = input.coGuests.length > 0
    ? input.coGuests.join(", ")
    : "none recorded";

  return `Person: ${input.name}
Role: ${input.personType}
${input.shortBio ? `Bio: ${input.shortBio}` : ""}
Total appearances: ${input.appearanceCount}

Episodes they appear in:
${episodesText || "(no episode data)"}

Quotes attributed to them:
${quotesText || "(no quotes)"}

Frequently appears with: ${coGuestsText}`;
}

function parseArgs(): { minAppearances: number; force: boolean; limit: number } {
  const args = process.argv.slice(2);
  let minAppearances = 2;
  let force = false;
  let limit = 20;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--min-appearances" && args[i + 1]) {
      minAppearances = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") force = true;
  }

  return { minAppearances, force, limit };
}

async function buildProfile(
  client: Anthropic,
  model: string,
  personData: Parameters<typeof buildPersonMessage>[0]
): Promise<string> {
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: PEOPLE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPersonMessage(personData) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");
  return textBlock.text.trim();
}

async function main() {
  const { minAppearances, force, limit } = parseArgs();
  const prisma = getPrisma();

  // Load nightmares video IDs to scope the query
  let nightmaresIds: Set<string> = new Set();
  if (fs.existsSync(NIGHTMARES_RAW)) {
    const raw = JSON.parse(fs.readFileSync(NIGHTMARES_RAW, "utf-8")) as {
      videos: Array<{ videoId: string }>;
    };
    nightmaresIds = new Set(raw.videos.map((v) => v.videoId));
    log(`Loaded ${nightmaresIds.size} @PsychesNightmares video IDs`);
  } else {
    log("WARNING: youtube-raw-psychesnightmares.json not found — profiling all people");
  }

  // Find people with appearances in nightmares episodes
  const allPeople = await prisma.person.findMany({
    where: {
      personType: { in: ["guest", "host", "recurring"] },
    },
    include: {
      guestAppearances: {
        include: {
          episode: {
            select: {
              id: true,
              title: true,
              airDate: true,
              summaryShort: true,
              summaryLong: true,
              youtubeVideoId: true,
            },
          },
        },
      },
      quotes: {
        select: { text: true, context: true },
        take: 15,
      },
    },
    orderBy: { displayName: "asc" },
  });

  // Filter to those with nightmares appearances (or all if no raw file)
  const eligible = allPeople
    .map((person) => {
      const nightmaresEps = nightmaresIds.size > 0
        ? person.guestAppearances.filter(
            (g) => g.episode.youtubeVideoId && nightmaresIds.has(g.episode.youtubeVideoId)
          )
        : person.guestAppearances;
      return { person, nightmaresEps };
    })
    .filter(({ nightmaresEps }) => nightmaresEps.length >= minAppearances)
    .sort((a, b) => b.nightmaresEps.length - a.nightmaresEps.length)
    .slice(0, limit);

  log(
    `Found ${eligible.length} people with ≥${minAppearances} nightmares appearances (limit: ${limit})`
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const model = process.env.ENRICHMENT_MODEL ?? "claude-sonnet-4-6";

  let success = 0;
  let skipped = 0;
  let failures = 0;

  for (const { person, nightmaresEps } of eligible) {
    if (!force && person.loreSummary && person.loreSummary.length > 100) {
      log(`  SKIP (already has loreSummary): ${person.displayName}`);
      skipped++;
      continue;
    }

    log(`Building profile for: ${person.displayName} (${nightmaresEps.length} nightmares eps)`);

    try {
      // Co-guest analysis — find who appears most often in the same episodes
      const coGuestCounts = new Map<string, number>();
      for (const g of nightmaresEps) {
        const episodeGuests = await prisma.episodeGuest.findMany({
          where: { episodeId: g.episode.id, personId: { not: person.id } },
          include: { person: { select: { displayName: true } } },
        });
        for (const eg of episodeGuests) {
          const name = eg.person.displayName;
          coGuestCounts.set(name, (coGuestCounts.get(name) ?? 0) + 1);
        }
      }
      const topCoGuests = Array.from(coGuestCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

      const profile = await buildProfile(client, model, {
        name: person.displayName,
        personType: person.personType,
        shortBio: person.shortBio,
        appearanceCount: nightmaresEps.length,
        episodes: nightmaresEps.map((g) => ({
          title: g.episode.title,
          airDate: g.episode.airDate?.toISOString() ?? null,
          summaryShort: g.episode.summaryShort,
          summaryLong: g.episode.summaryLong,
        })),
        quotes: person.quotes,
        coGuests: topCoGuests,
      });

      await prisma.person.update({
        where: { id: person.id },
        data: {
          loreSummary: profile,
          personType:
            nightmaresEps.length >= 3
              ? "recurring"
              : person.personType,
        },
      });

      log(`  ✓ Profile saved for ${person.displayName}`);
      success++;

      // Respect rate limits
      await new Promise((r) => setTimeout(r, 800));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED ${person.displayName}: ${msg}`);
      failures++;
    }
  }

  log(`\nDone — success: ${success}, skipped: ${skipped}, failures: ${failures}`);
  await disconnect();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
