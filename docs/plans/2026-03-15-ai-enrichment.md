# AI Enrichment Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a pipeline that sends episode transcripts to Claude Sonnet 4.6 and extracts structured data (summaries, guests, quotes, lore, topics) into intermediate JSON files, then imports them into the database.

**Architecture:** Two scripts — `enrich-episodes.ts` calls the Claude API for each episode and saves structured JSON to `scripts/enrich/data/{slug}.json`. `import-enriched.ts` reads those files and upserts to PostgreSQL via Prisma using the same patterns as the existing ingest pipeline. Selective processing (only episodes with transcripts and missing enrichment), batch-controlled, resumable.

**Tech Stack:** TypeScript, @anthropic-ai/sdk, Zod, Prisma, npx tsx

---

### Task 1: Install Anthropic SDK and add config

**Files:**
- Modify: `package.json` (add dependency)
- Modify: `.env.example` (add enrichment vars)

**Step 1: Install the SDK**

Run:
```bash
cd C:\Users\John Bates\Projects\cultcodex-v2
npm install @anthropic-ai/sdk
```

**Step 2: Add env vars to `.env.example`**

Append to `.env.example`:
```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ENRICHMENT_MODEL=claude-sonnet-4-6-20250514
ENRICHMENT_BATCH_SIZE=10
```

**Step 3: Add npm scripts to `package.json`**

Add to the `"scripts"` section:
```json
"enrich:episodes": "npx tsx scripts/enrich/enrich-episodes.ts",
"enrich:import": "npx tsx scripts/enrich/import-enriched.ts"
```

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: add @anthropic-ai/sdk and enrichment config"
```

---

### Task 2: Enrichment Zod schemas and types

**Files:**
- Create: `scripts/enrich/schemas.ts`
- Create: `scripts/enrich/__tests__/schemas.test.ts`

**Step 1: Write the test**

```typescript
// scripts/enrich/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { EnrichmentResultSchema } from "../schemas";

describe("EnrichmentResultSchema", () => {
  it("parses a valid enrichment result", () => {
    const input = {
      summaryShort: "A discussion about tarot and consciousness.",
      summaryLong: "In this episode, the host explores...\n\nThe conversation turns to...",
      cutOfPsyche: "Welcome to the cult, baby!",
      guests: [
        { name: "John Doe", personType: "guest", shortBio: "Tarot reader and mystic" },
      ],
      quotes: [
        {
          text: "The cards never lie.",
          speaker: "John Doe",
          timestampSeconds: 1234,
          context: "During a tarot reading",
          significance: "Core philosophy of the show",
        },
      ],
      lore: [
        {
          title: "The Veil",
          summary: "A metaphorical boundary between worlds",
          canonStatus: "canonical",
          category: "cosmology",
        },
      ],
      topics: ["tarot", "consciousness", "mythology"],
    };
    const result = EnrichmentResultSchema.parse(input);
    expect(result.guests).toHaveLength(1);
    expect(result.quotes[0].timestampSeconds).toBe(1234);
    expect(result.lore[0].canonStatus).toBe("canonical");
  });

  it("allows nullable timestampSeconds in quotes", () => {
    const input = {
      summaryShort: "Short summary.",
      summaryLong: "Long summary.",
      cutOfPsyche: "",
      guests: [],
      quotes: [
        {
          text: "Some quote",
          speaker: "Unknown",
          timestampSeconds: null,
          context: "",
          significance: "",
        },
      ],
      lore: [],
      topics: [],
    };
    const result = EnrichmentResultSchema.parse(input);
    expect(result.quotes[0].timestampSeconds).toBeNull();
  });

  it("rejects invalid canonStatus", () => {
    const input = {
      summaryShort: "x",
      summaryLong: "x",
      cutOfPsyche: "",
      guests: [],
      quotes: [],
      lore: [{ title: "x", summary: "x", canonStatus: "invalid", category: "x" }],
      topics: [],
    };
    expect(() => EnrichmentResultSchema.parse(input)).toThrow();
  });

  it("rejects invalid personType", () => {
    const input = {
      summaryShort: "x",
      summaryLong: "x",
      cutOfPsyche: "",
      guests: [{ name: "x", personType: "villain", shortBio: "" }],
      quotes: [],
      lore: [],
      topics: [],
    };
    expect(() => EnrichmentResultSchema.parse(input)).toThrow();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/enrich/__tests__/schemas.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the schemas**

```typescript
// scripts/enrich/schemas.ts
import { z } from "zod/v4";

export const EnrichedGuestSchema = z.object({
  name: z.string().min(1),
  personType: z.enum(["guest", "host", "mentioned", "recurring"]),
  shortBio: z.string(),
});

export const EnrichedQuoteSchema = z.object({
  text: z.string().min(1),
  speaker: z.string().min(1),
  timestampSeconds: z.number().int().nullable(),
  context: z.string(),
  significance: z.string(),
});

export const EnrichedLoreSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  canonStatus: z.enum([
    "canonical",
    "speculative",
    "community_myth",
    "disputed",
    "humorous",
  ]),
  category: z.string(),
});

export const EnrichmentResultSchema = z.object({
  summaryShort: z.string(),
  summaryLong: z.string(),
  cutOfPsyche: z.string(),
  guests: z.array(EnrichedGuestSchema),
  quotes: z.array(EnrichedQuoteSchema),
  lore: z.array(EnrichedLoreSchema),
  topics: z.array(z.string()),
});

export type EnrichmentResult = z.infer<typeof EnrichmentResultSchema>;
export type EnrichedGuest = z.infer<typeof EnrichedGuestSchema>;
export type EnrichedQuote = z.infer<typeof EnrichedQuoteSchema>;
export type EnrichedLore = z.infer<typeof EnrichedLoreSchema>;
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scripts/enrich/__tests__/schemas.test.ts`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add scripts/enrich/schemas.ts scripts/enrich/__tests__/schemas.test.ts
git commit -m "feat: add Zod schemas for enrichment output"
```

---

### Task 3: Enrichment shared library (Claude client + prompt builder + transcript loader)

**Files:**
- Create: `scripts/enrich/lib.ts`
- Create: `scripts/enrich/__tests__/lib.test.ts`

**Step 1: Write tests for transcript loading and prompt building**

```typescript
// scripts/enrich/__tests__/lib.test.ts
import { describe, it, expect } from "vitest";
import { buildTranscriptText, buildUserMessage } from "../lib";

describe("buildTranscriptText", () => {
  it("concatenates segments with timestamps", () => {
    const segments = [
      { offset: 0, duration: 2000, text: "Hello everyone" },
      { offset: 5000, duration: 3000, text: "Welcome to the show" },
    ];
    const result = buildTranscriptText(segments);
    expect(result).toContain("[0:00] Hello everyone");
    expect(result).toContain("[0:05] Welcome to the show");
  });

  it("formats minutes and hours correctly", () => {
    const segments = [
      { offset: 65000, duration: 1000, text: "One minute in" },
      { offset: 3661000, duration: 1000, text: "Over an hour" },
    ];
    const result = buildTranscriptText(segments);
    expect(result).toContain("[1:05] One minute in");
    expect(result).toContain("[1:01:01] Over an hour");
  });

  it("returns empty string for empty segments", () => {
    expect(buildTranscriptText([])).toBe("");
  });
});

describe("buildUserMessage", () => {
  it("includes title, episode number, and description", () => {
    const msg = buildUserMessage({
      title: "The Veil Lifts",
      episodeNumber: 42,
      airDate: "2025-06-15",
      description: "A deep dive into consciousness",
      transcript: "[0:00] Hello everyone",
    });
    expect(msg).toContain("The Veil Lifts");
    expect(msg).toContain("Episode 42");
    expect(msg).toContain("2025-06-15");
    expect(msg).toContain("A deep dive into consciousness");
    expect(msg).toContain("[0:00] Hello everyone");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/enrich/__tests__/lib.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the library**

```typescript
// scripts/enrich/lib.ts
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";

// --- Transcript helpers ---

interface RawSegment {
  offset: number;   // milliseconds
  duration: number;  // milliseconds
  text: string;
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function buildTranscriptText(segments: RawSegment[]): string {
  if (segments.length === 0) return "";
  return segments
    .map((seg) => `[${formatTimestamp(seg.offset)}] ${seg.text}`)
    .join("\n");
}

// --- Prompt building ---

const SYSTEM_PROMPT = `You are an expert analyst for the "Cult of Psyche" podcast/livestream archive. This show features tarot readings, open panel discussions, consciousness exploration, mythology deep-dives, and occult topics. The host is known as "Psyche" or "Trix."

Your task: analyze the provided episode transcript and extract structured data. Be accurate — only extract what is genuinely present in the transcript. Do not hallucinate guests, quotes, or lore that aren't discussed.

Return a JSON object with this exact structure:
{
  "summaryShort": "1-2 sentence summary of the episode",
  "summaryLong": "2-3 paragraph comprehensive summary covering main topics, key moments, and themes",
  "cutOfPsyche": "A characteristic or memorable quote/moment from this episode (verbatim from transcript if possible)",
  "guests": [
    {
      "name": "Display name of the person",
      "personType": "guest|host|mentioned|recurring",
      "shortBio": "Brief description based on what's known from the episode"
    }
  ],
  "quotes": [
    {
      "text": "Exact quote text from the transcript",
      "speaker": "Name of the speaker",
      "timestampSeconds": 1234,
      "context": "What was being discussed when this was said",
      "significance": "Why this quote is notable"
    }
  ],
  "lore": [
    {
      "title": "Name of the concept, myth, or recurring theme",
      "summary": "Brief explanation of this lore element",
      "canonStatus": "canonical|speculative|community_myth|disputed|humorous",
      "category": "cosmology|character|event|concept|ritual|prophecy|artifact|location"
    }
  ],
  "topics": ["topic1", "topic2"]
}

Guidelines:
- For guests: include the host as personType "host". Panel participants are "guest". People discussed but not present are "mentioned".
- For quotes: extract the 3-5 most notable, interesting, or representative quotes. Include timestamp in seconds if identifiable from transcript timestamps.
- For lore: identify mythology references, recurring show concepts, tarot interpretations, or spiritual/occult ideas discussed. Use canonStatus to reflect how definitively the idea is presented.
- For topics: list the main subjects discussed (e.g., "tarot", "consciousness", "astrology", "Greek mythology").
- Return ONLY valid JSON. No markdown, no code fences, no explanation.`;

interface UserMessageInput {
  title: string;
  episodeNumber: number;
  airDate: string;
  description: string;
  transcript: string;
}

export function buildUserMessage(input: UserMessageInput): string {
  return `Episode: "${input.title}"
Episode ${input.episodeNumber} — Aired ${input.airDate}

Description:
${input.description}

Transcript:
${input.transcript}`;
}

// --- Claude API client ---

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

export async function enrichEpisode(
  input: UserMessageInput
): Promise<EnrichmentResult> {
  const client = getClient();
  const model = process.env.ENRICHMENT_MODEL ?? "claude-sonnet-4-6-20250514";

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserMessage(input) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Strip any markdown code fences if Claude wraps them
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonText);
  return EnrichmentResultSchema.parse(parsed);
}

export { SYSTEM_PROMPT };
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run scripts/enrich/__tests__/lib.test.ts`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add scripts/enrich/lib.ts scripts/enrich/__tests__/lib.test.ts
git commit -m "feat: add enrichment library with Claude client and prompt builder"
```

---

### Task 4: Enrichment data directory setup

**Files:**
- Create: `scripts/enrich/data/.gitignore`

**Step 1: Create the data directory with gitignore**

```
# scripts/enrich/data/.gitignore
*
!.gitignore
!README.md
```

**Step 2: Commit**

```bash
git add scripts/enrich/data/.gitignore
git commit -m "chore: add enrichment data directory with gitignore"
```

---

### Task 5: Main enrichment script (`enrich-episodes.ts`)

**Files:**
- Create: `scripts/enrich/enrich-episodes.ts`

**Context:**
- Reads `scripts/scrape/data/youtube-raw.json` for episode metadata (title, description, videoId, publishedAt, episodeNumber assigned by transform order)
- Reads `scripts/scrape/data/transcripts/{videoId}.json` for transcript segments
- Queries DB for episodes missing enrichment (summaryLong is empty)
- Calls `enrichEpisode()` for each, saves result to `scripts/enrich/data/{slug}.json`
- Note: `youtube-raw.json` videos are sorted chronologically (oldest first = ep 1), so array index + 1 = episode number
- The transform script (`scripts/scrape/youtube-to-ingest.ts`) handles slug generation and deduplication — read it to find the `slugify` function or import from `scripts/ingest/lib.ts`

**Step 1: Implement the script**

```typescript
// scripts/enrich/enrich-episodes.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify } from "../ingest/lib";
import { enrichEpisode, buildTranscriptText } from "./lib";
import { YouTubeRawSchema } from "../scrape/types";

const DATA_DIR = path.join(__dirname, "data");
const TRANSCRIPTS_DIR = path.join(__dirname, "..", "scrape", "data", "transcripts");
const RAW_PATH = path.join(__dirname, "..", "scrape", "data", "youtube-raw.json");
const LOG_PATH = path.join(__dirname, "enrich-progress.log");

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + "\n");
}

function parseArgs(): { batch: number; force: boolean } {
  const args = process.argv.slice(2);
  let batch = parseInt(process.env.ENRICHMENT_BATCH_SIZE ?? "10", 10);
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) {
      batch = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === "--force") {
      force = true;
    }
  }

  return { batch, force };
}

async function main() {
  const { batch, force } = parseArgs();
  const prisma = getPrisma();

  // Load YouTube raw data for metadata
  const rawJson = JSON.parse(fs.readFileSync(RAW_PATH, "utf-8"));
  const raw = YouTubeRawSchema.parse(rawJson);

  // Videos sorted chronologically in the raw file (oldest first = ep 1)
  const videos = raw.videos;

  // Find episodes needing enrichment
  const episodesNeedingEnrichment = await prisma.episode.findMany({
    where: { summaryLong: "" },
    select: { slug: true, youtubeVideoId: true, episodeNumber: true, title: true },
    orderBy: { episodeNumber: "asc" },
  });

  log(`Found ${episodesNeedingEnrichment.length} episodes needing enrichment`);

  // Filter to those with transcripts and not already enriched (JSON file exists)
  const candidates = episodesNeedingEnrichment.filter((ep) => {
    if (!ep.youtubeVideoId) return false;
    const transcriptPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId}.json`);
    if (!fs.existsSync(transcriptPath)) return false;
    if (!force) {
      const enrichedPath = path.join(DATA_DIR, `${ep.slug}.json`);
      if (fs.existsSync(enrichedPath)) return false;
    }
    return true;
  });

  log(`${candidates.length} candidates with transcripts (batch size: ${batch})`);

  const toProcess = candidates.slice(0, batch);
  let success = 0;
  let failures = 0;

  for (const ep of toProcess) {
    try {
      // Load transcript
      const transcriptPath = path.join(TRANSCRIPTS_DIR, `${ep.youtubeVideoId}.json`);
      const segments = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));
      const transcriptText = buildTranscriptText(segments);

      // Find matching video in raw data for description
      const video = videos.find((v) => v.videoId === ep.youtubeVideoId);
      const description = video?.description ?? "";
      const airDate = video?.publishedAt?.split("T")[0] ?? "";

      log(`Enriching EP.${ep.episodeNumber}: ${ep.title}`);

      const result = await enrichEpisode({
        title: ep.title,
        episodeNumber: ep.episodeNumber,
        airDate,
        description,
        transcript: transcriptText,
      });

      // Save to JSON file
      const outPath = path.join(DATA_DIR, `${ep.slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
      log(`  ✓ Saved ${ep.slug}.json (${result.guests.length} guests, ${result.quotes.length} quotes, ${result.lore.length} lore)`);
      success++;

      // Rate limit: 1 request per second
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`  ✗ FAILED EP.${ep.episodeNumber} (${ep.slug}): ${msg}`);
      failures++;
    }
  }

  log(`Done: ${success} enriched, ${failures} failed, ${candidates.length - toProcess.length} remaining`);
  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
```

**Step 2: Test manually with a dry run**

Run: `npx tsx scripts/enrich/enrich-episodes.ts --batch 1`

This will process 1 episode. Verify:
- It finds episodes needing enrichment
- It loads the transcript
- It calls Claude API and saves a JSON file to `scripts/enrich/data/{slug}.json`
- The JSON file contains valid enrichment data

**Step 3: Commit**

```bash
git add scripts/enrich/enrich-episodes.ts
git commit -m "feat: add enrichment script with Claude API integration"
```

---

### Task 6: Import enriched data script (`import-enriched.ts`)

**Files:**
- Create: `scripts/enrich/import-enriched.ts`

**Context:**
- Follows the same upsert patterns as `scripts/ingest/import-people.ts`, `import-episodes.ts`, `import-lore.ts`
- Uses `getPrisma()`, `slugify()`, `buildSearchText()` from `scripts/ingest/lib.ts`
- Reads all `scripts/enrich/data/{slug}.json` files
- For each file: upserts Person records, creates Quotes, upserts LoreEntry records, updates Episode fields, links join tables
- Must be idempotent — safe to re-run

**Step 1: Implement the import script**

```typescript
// scripts/enrich/import-enriched.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify, buildSearchText } from "../ingest/lib";
import { EnrichmentResultSchema } from "./schemas";

const DATA_DIR = path.join(__dirname, "data");

interface Stats {
  episodes: number;
  people: { created: number; updated: number };
  quotes: number;
  lore: { created: number; updated: number };
  topics: { created: number; linked: number };
}

async function main() {
  const prisma = getPrisma();
  const stats: Stats = {
    episodes: 0,
    people: { created: 0, updated: 0 },
    quotes: 0,
    lore: { created: 0, updated: 0 },
    topics: { created: 0, linked: 0 },
  };

  // Read all enriched JSON files
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  console.log(`Found ${files.length} enriched episode files`);

  for (const file of files) {
    const slug = file.replace(".json", "");
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));

    let result;
    try {
      result = EnrichmentResultSchema.parse(raw);
    } catch (err) {
      console.warn(`⚠ Skipping ${file}: invalid schema`);
      continue;
    }

    // Find the episode
    const episode = await prisma.episode.findUnique({ where: { slug } });
    if (!episode) {
      console.warn(`⚠ Skipping ${file}: episode not found in DB`);
      continue;
    }

    // --- Update episode fields ---
    await prisma.episode.update({
      where: { slug },
      data: {
        summaryShort: result.summaryShort || episode.summaryShort,
        summaryLong: result.summaryLong,
        cutOfPsyche: result.cutOfPsyche,
        searchText: buildSearchText(
          episode.title,
          result.summaryShort,
          result.summaryLong,
          ...result.guests.map((g) => g.name),
          ...result.topics
        ),
      },
    });

    // --- Upsert guests (Person records) + link to episode ---
    // Clear existing guest links for this episode
    await prisma.episodeGuest.deleteMany({ where: { episodeId: episode.id } });

    for (const guest of result.guests) {
      const personSlug = slugify(guest.name);
      const person = await prisma.person.upsert({
        where: { slug: personSlug },
        create: {
          displayName: guest.name,
          slug: personSlug,
          shortBio: guest.shortBio,
          personType: guest.personType,
          searchText: buildSearchText(guest.name, guest.shortBio),
        },
        update: {
          shortBio: guest.shortBio || undefined,
          personType: guest.personType,
          searchText: buildSearchText(guest.name, guest.shortBio),
        },
      });

      // Check if this is a new person (for stats)
      const timeDiff = person.updatedAt.getTime() - person.createdAt.getTime();
      if (timeDiff < 1000) stats.people.created++;
      else stats.people.updated++;

      // Link to episode
      await prisma.episodeGuest.create({
        data: { episodeId: episode.id, personId: person.id },
      });

      // Set firstAppearanceEpisodeId if not set
      if (!person.firstAppearanceEpisodeId) {
        await prisma.person.update({
          where: { id: person.id },
          data: { firstAppearanceEpisodeId: episode.id },
        });
      }
    }

    // --- Create quotes ---
    // Delete existing quotes for this episode (idempotent)
    await prisma.quote.deleteMany({ where: { episodeId: episode.id } });

    for (const quote of result.quotes) {
      const speakerSlug = slugify(quote.speaker);
      const speaker = await prisma.person.findUnique({ where: { slug: speakerSlug } });

      await prisma.quote.create({
        data: {
          text: quote.text,
          episodeId: episode.id,
          speakerPersonId: speaker?.id ?? null,
          timestampSeconds: quote.timestampSeconds,
          context: quote.context,
          significance: quote.significance,
        },
      });
      stats.quotes++;
    }

    // --- Upsert lore entries + link to episode ---
    await prisma.episodeLore.deleteMany({ where: { episodeId: episode.id } });

    for (const lore of result.lore) {
      const loreSlug = slugify(lore.title);
      const loreEntry = await prisma.loreEntry.upsert({
        where: { slug: loreSlug },
        create: {
          title: lore.title,
          slug: loreSlug,
          category: lore.category,
          summary: lore.summary,
          canonStatus: lore.canonStatus,
          searchText: buildSearchText(lore.title, lore.category, lore.summary),
        },
        update: {
          summary: lore.summary || undefined,
          category: lore.category || undefined,
          canonStatus: lore.canonStatus,
          searchText: buildSearchText(lore.title, lore.category, lore.summary),
        },
      });

      const timeDiff = loreEntry.updatedAt.getTime() - loreEntry.createdAt.getTime();
      if (timeDiff < 1000) stats.lore.created++;
      else stats.lore.updated++;

      // Set firstMentionEpisodeId if not set
      if (!loreEntry.firstMentionEpisodeId) {
        await prisma.loreEntry.update({
          where: { id: loreEntry.id },
          data: { firstMentionEpisodeId: episode.id },
        });
      }

      await prisma.episodeLore.create({
        data: { episodeId: episode.id, loreEntryId: loreEntry.id },
      });
    }

    // --- Link topics ---
    await prisma.episodeTopic.deleteMany({ where: { episodeId: episode.id } });

    for (const topicTitle of result.topics) {
      const topicSlug = slugify(topicTitle);
      const topic = await prisma.topic.upsert({
        where: { slug: topicSlug },
        create: {
          title: topicTitle,
          slug: topicSlug,
          description: "",
        },
        update: {},
      });

      const timeDiff = topic.updatedAt.getTime() - topic.createdAt.getTime();
      if (timeDiff < 1000) stats.topics.created++;

      await prisma.episodeTopic.create({
        data: { episodeId: episode.id, topicId: topic.id },
      });
      stats.topics.linked++;
    }

    stats.episodes++;
    console.log(`✓ ${slug} (${result.guests.length}G ${result.quotes.length}Q ${result.lore.length}L ${result.topics.length}T)`);
  }

  console.log("\n--- Import Summary ---");
  console.log(`Episodes updated: ${stats.episodes}`);
  console.log(`People: ${stats.people.created} created, ${stats.people.updated} updated`);
  console.log(`Quotes: ${stats.quotes} created`);
  console.log(`Lore: ${stats.lore.created} created, ${stats.lore.updated} updated`);
  console.log(`Topics: ${stats.topics.created} created, ${stats.topics.linked} linked`);

  await disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  disconnect();
  process.exit(1);
});
```

**Step 2: Test by importing the test enrichment file from Task 5**

After Task 5 produced a `{slug}.json` file, run:
```bash
npx tsx scripts/enrich/import-enriched.ts
```

Verify:
- Episode summaryLong is updated in the DB
- Person records are created/updated
- Quotes are created
- Lore entries are created
- Join table links exist

**Step 3: Commit**

```bash
git add scripts/enrich/import-enriched.ts
git commit -m "feat: add enrichment import script for DB upserts"
```

---

### Task 7: Add user's Anthropic API key to `.env` and run first batch

**Step 1: Prompt user to add API key**

The user needs to add `ANTHROPIC_API_KEY=sk-ant-...` to their `.env` file.

**Step 2: Run a small batch (5 episodes)**

```bash
npm run enrich:episodes -- --batch 5
```

Verify:
- 5 JSON files appear in `scripts/enrich/data/`
- Each file has valid enrichment data
- No errors in console output

**Step 3: Import the enriched data**

```bash
npm run enrich:import
```

Verify:
- Episode pages now show summaryLong content
- Person/guest records exist in DB
- Quotes appear on the `/quotes` page
- Lore entries appear on the `/lore` page (if that page exists)

**Step 4: Commit the progress log gitignore**

Add `enrich-progress.log` to `scripts/enrich/data/.gitignore` if not already covered.

---

### Task 8: Run full tests and verify

**Step 1: Run the full test suite**

```bash
npm test
```

Expected: All tests pass (existing 67 + new enrichment schema tests)

**Step 2: Verify enriched data on the website**

Start dev server and check:
- `/episodes/{slug}` — episode with enrichment should show summaryLong
- `/quotes` — should show extracted quotes (no longer empty state)
- `/lore` — should show lore entries (if page exists)
- `/people` — should show guest records (if page exists)

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "chore: enrichment pipeline complete"
```
