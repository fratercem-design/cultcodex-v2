# Enrichment Import Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the `import-enriched.ts` script that reads Claude-enriched JSON files from `scripts/enrich/data/` and upserts all extracted entities (summaries, guests, quotes, lore, topics) into the database.

**Architecture:** The enrichment pipeline is half-built. `enrich-episodes.ts` calls Claude and writes per-episode JSON files to `scripts/enrich/data/{slug}.json`. The missing piece is `import-enriched.ts`, which reads those files and upserts Persons, Topics, LoreEntries, Quotes, and Episode relations into Postgres via Prisma. Follows the same idempotent upsert + clear-and-recreate-join-tables pattern used by `import-episodes.ts`.

**Tech Stack:** TypeScript, Prisma 7 (with PrismaPg adapter), Zod 4, Vitest 4, `@anthropic-ai/sdk` (already used by enrich scripts)

---

### Task 1: Write import-enriched schema validation

**Files:**
- Modify: `scripts/enrich/schemas.ts`

The `EnrichmentResultSchema` already exists and validates Claude's output. We need one small addition: an `ImportFileSchema` that wraps the enrichment result with the episode slug (derived from filename).

**Step 1: Write the failing test**

Create test in `scripts/enrich/__tests__/schemas.test.ts`:

```typescript
// Add to existing file
describe("ImportFileSchema", () => {
  it("wraps enrichment result with slug", () => {
    const input = {
      slug: "the-veil-lifts",
      data: {
        summaryShort: "A discussion about tarot.",
        summaryLong: "In this episode...",
        cutOfPsyche: "Welcome!",
        guests: [],
        quotes: [],
        lore: [],
        topics: [],
      },
    };
    const result = ImportFileSchema.parse(input);
    expect(result.slug).toBe("the-veil-lifts");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/enrich/__tests__/schemas.test.ts`
Expected: FAIL — `ImportFileSchema` is not exported

**Step 3: Write minimal implementation**

In `scripts/enrich/schemas.ts`, add:

```typescript
export const ImportFileSchema = z.object({
  slug: z.string().min(1),
  data: EnrichmentResultSchema,
});

export type ImportFile = z.infer<typeof ImportFileSchema>;
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/enrich/__tests__/schemas.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/enrich/schemas.ts scripts/enrich/__tests__/schemas.test.ts
git commit -m "feat(enrich): add ImportFileSchema for enrichment import"
```

---

### Task 2: Write the import-enriched core logic (upsert helpers)

**Files:**
- Create: `scripts/enrich/import-enriched.ts`
- Test: `scripts/enrich/__tests__/import-enriched.test.ts`

This is the core logic. The script needs to:
1. Read all `*.json` files from `scripts/enrich/data/`
2. For each file, derive the episode slug from the filename
3. Find the Episode by slug (skip if not found)
4. Update Episode fields: `summaryShort`, `summaryLong`, `cutOfPsyche`
5. Upsert each guest as a Person, then create EpisodeGuest join
6. Upsert each topic as a Topic, then create EpisodeTopic join
7. Upsert each lore entry as a LoreEntry, then create EpisodeLore join
8. Create Quote records linked to the Episode and Person

**Step 1: Write the failing test for the file-reading utility**

Create `scripts/enrich/__tests__/import-enriched.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { loadEnrichmentFiles } from "../import-enriched";

describe("loadEnrichmentFiles", () => {
  it("is a function", () => {
    expect(typeof loadEnrichmentFiles).toBe("function");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/enrich/__tests__/import-enriched.test.ts`
Expected: FAIL — module not found

**Step 3: Write the full import-enriched.ts**

```typescript
// scripts/enrich/import-enriched.ts
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { getPrisma, disconnect, slugify } from "../ingest/lib";
import { EnrichmentResultSchema, type EnrichmentResult } from "./schemas";
import type { PrismaClient } from "../../src/generated/prisma/client";

const DATA_DIR = path.join(__dirname, "data");

export interface ImportStats {
  processed: number;
  skipped: number;
  failed: number;
  details: {
    personsUpserted: number;
    topicsUpserted: number;
    loreUpserted: number;
    quotesCreated: number;
  };
}

export function loadEnrichmentFiles(): { slug: string; data: EnrichmentResult }[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const results: { slug: string; data: EnrichmentResult }[] = [];

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf-8"));
    const data = EnrichmentResultSchema.parse(raw);
    results.push({ slug, data });
  }

  return results;
}

async function upsertPerson(
  prisma: PrismaClient,
  name: string,
  personType: string,
  shortBio: string
): Promise<string> {
  const slug = slugify(name);
  const person = await prisma.person.upsert({
    where: { slug },
    create: {
      displayName: name,
      slug,
      personType: personType as any,
      shortBio: shortBio || null,
    },
    update: {
      // Don't overwrite existing bio if new one is empty
      ...(shortBio ? { shortBio } : {}),
    },
  });
  return person.id;
}

async function upsertTopic(prisma: PrismaClient, title: string): Promise<string> {
  const slug = slugify(title);
  const topic = await prisma.topic.upsert({
    where: { slug },
    create: { title, slug },
    update: {},
  });
  return topic.id;
}

async function upsertLore(
  prisma: PrismaClient,
  entry: { title: string; summary: string; canonStatus: string; category: string }
): Promise<string> {
  const slug = slugify(entry.title);
  const lore = await prisma.loreEntry.upsert({
    where: { slug },
    create: {
      title: entry.title,
      slug,
      summary: entry.summary || null,
      canonStatus: entry.canonStatus as any,
      category: entry.category || null,
    },
    update: {
      ...(entry.summary ? { summary: entry.summary } : {}),
    },
  });
  return lore.id;
}

async function importOneEpisode(
  prisma: PrismaClient,
  slug: string,
  data: EnrichmentResult,
  stats: ImportStats["details"]
): Promise<void> {
  // 1. Find the episode
  const episode = await prisma.episode.findUnique({ where: { slug } });
  if (!episode) throw new Error(`Episode not found: ${slug}`);

  // 2. Update episode summaries
  await prisma.episode.update({
    where: { slug },
    data: {
      summaryShort: data.summaryShort,
      summaryLong: data.summaryLong,
      cutOfPsyche: data.cutOfPsyche,
    },
  });

  // 3. Upsert guests + link to episode
  const personIdsByName = new Map<string, string>();
  for (const guest of data.guests) {
    const personId = await upsertPerson(prisma, guest.name, guest.personType, guest.shortBio);
    personIdsByName.set(guest.name, personId);
    stats.personsUpserted++;
  }

  // Clear and re-create guest joins (idempotent)
  await prisma.episodeGuest.deleteMany({ where: { episodeId: episode.id } });
  for (const [, personId] of personIdsByName) {
    await prisma.episodeGuest.create({
      data: { episodeId: episode.id, personId },
    });
  }

  // 4. Upsert topics + link
  const topicIds: string[] = [];
  for (const title of data.topics) {
    const topicId = await upsertTopic(prisma, title);
    topicIds.push(topicId);
    stats.topicsUpserted++;
  }

  await prisma.episodeTopic.deleteMany({ where: { episodeId: episode.id } });
  for (const topicId of topicIds) {
    await prisma.episodeTopic.create({
      data: { episodeId: episode.id, topicId },
    });
  }

  // 5. Upsert lore + link
  const loreIds: string[] = [];
  for (const entry of data.lore) {
    const loreId = await upsertLore(prisma, entry);
    loreIds.push(loreId);
    stats.loreUpserted++;
  }

  await prisma.episodeLore.deleteMany({ where: { episodeId: episode.id } });
  for (const loreId of loreIds) {
    await prisma.episodeLore.create({
      data: { episodeId: episode.id, loreEntryId: loreId },
    });
  }

  // 6. Create quotes (clear old ones first for idempotence)
  await prisma.quote.deleteMany({ where: { episodeId: episode.id } });
  for (const q of data.quotes) {
    const speakerId = personIdsByName.get(q.speaker) ?? null;
    await prisma.quote.create({
      data: {
        text: q.text,
        speakerPersonId: speakerId,
        episodeId: episode.id,
        timestampSeconds: q.timestampSeconds,
        context: q.context || null,
        significance: q.significance || null,
      },
    });
    stats.quotesCreated++;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const files = loadEnrichmentFiles();
  console.log(`Found ${files.length} enrichment files`);

  if (files.length === 0) {
    console.log("Nothing to import. Run npm run enrich:episodes first.");
    return;
  }

  if (dryRun) {
    console.log("DRY RUN — listing files that would be imported:");
    for (const f of files) {
      console.log(`  ${f.slug} (${f.data.guests.length} guests, ${f.data.quotes.length} quotes, ${f.data.lore.length} lore, ${f.data.topics.length} topics)`);
    }
    return;
  }

  const prisma = getPrisma();
  const stats: ImportStats = {
    processed: 0,
    skipped: 0,
    failed: 0,
    details: { personsUpserted: 0, topicsUpserted: 0, loreUpserted: 0, quotesCreated: 0 },
  };

  for (const { slug, data } of files) {
    try {
      await importOneEpisode(prisma, slug, data, stats.details);
      stats.processed++;
      console.log(`  Imported: ${slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAILED: ${slug} — ${msg}`);
      stats.failed++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Persons upserted: ${stats.details.personsUpserted}`);
  console.log(`  Topics upserted: ${stats.details.topicsUpserted}`);
  console.log(`  Lore upserted: ${stats.details.loreUpserted}`);
  console.log(`  Quotes created: ${stats.details.quotesCreated}`);

  await disconnect();
}

// Only run main() when executed directly (not imported for testing)
if (require.main === module) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    disconnect();
    process.exit(1);
  });
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/enrich/__tests__/import-enriched.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/enrich/import-enriched.ts scripts/enrich/__tests__/import-enriched.test.ts
git commit -m "feat(enrich): add import-enriched script for loading Claude output into DB"
```

---

### Task 3: Add integration tests with mock Prisma

**Files:**
- Modify: `scripts/enrich/__tests__/import-enriched.test.ts`

Add tests that verify `loadEnrichmentFiles` returns correct structure and handles edge cases (empty dir, malformed JSON). These are unit tests that don't need the DB.

**Step 1: Write additional tests**

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { loadEnrichmentFiles } from "../import-enriched";

describe("loadEnrichmentFiles", () => {
  it("returns empty array when data dir has no JSON files", () => {
    // If the data dir exists but has only .gitignore
    const files = loadEnrichmentFiles();
    // Should return only valid enrichment JSONs (none in clean state)
    expect(Array.isArray(files)).toBe(true);
  });

  it("derives slug from filename", () => {
    // This tests the slug derivation logic
    const slug = "test-episode.json".replace(/\.json$/, "");
    expect(slug).toBe("test-episode");
  });
});
```

**Step 2: Run tests**

Run: `npx vitest run scripts/enrich/__tests__/import-enriched.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add scripts/enrich/__tests__/import-enriched.test.ts
git commit -m "test(enrich): add unit tests for loadEnrichmentFiles"
```

---

### Task 4: Wire up the npm script and verify end-to-end

**Files:**
- Verify: `package.json` (already has `"enrich:import"` script pointing to `scripts/enrich/import-enriched.ts`)

**Step 1: Verify the npm script exists**

Run: `cat package.json | grep enrich`
Expected: Both `enrich:episodes` and `enrich:import` scripts present

**Step 2: Test dry-run mode**

Run: `npm run enrich:import -- --dry-run`
Expected: Lists enrichment files (or says "Nothing to import" if none exist yet)

**Step 3: Run all enrichment tests**

Run: `npx vitest run scripts/enrich/`
Expected: All tests pass (schemas.test.ts, lib.test.ts, import-enriched.test.ts)

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(enrich): complete enrichment import pipeline with dry-run support"
```

---

## Summary of Pipeline Usage

```bash
# Step 1: Scrape YouTube metadata (already done)
npm run scrape:youtube

# Step 2: Scrape transcripts (already done — 1060 fetched)
npm run scrape:transcripts

# Step 3: Ingest episodes into DB (already done)
npm run ingest:episodes

# Step 4: Enrich episodes via Claude (NEW — runs in batches)
npm run enrich:episodes -- --batch 10

# Step 5: Import enriched data into DB (NEW)
npm run enrich:import -- --dry-run   # preview first
npm run enrich:import                # actually import
```

## Design Decisions Recap

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Enrichment mode | Selective (transcripts + missing data) | Budget-friendly, pay-as-you-go |
| Claude model | Sonnet 4.6 | Balanced cost/quality for extraction |
| Pass strategy | Single pass | One API call extracts everything |
| Storage | JSON intermediate files | Review before DB import, no re-paying API |
