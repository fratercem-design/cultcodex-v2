# Ingestion Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CLI scripts that import episode data from JSON files into the CultCodex v2 database, with idempotent upserts, automatic slug generation, and searchText population.

**Architecture:** Modular TypeScript scripts in `scripts/ingest/`, each handling one entity type (episodes, people, topics, lore). A shared `scripts/ingest/lib.ts` provides the Prisma client, slug helper, and searchText builder. All scripts use upsert-by-slug for idempotence. Import order: topics & people first (no deps), then episodes (links to topics/people).

**Tech Stack:** TypeScript, tsx, Prisma 7.4.2 with @prisma/adapter-pg, dotenv, zod for input validation

---

### Task 1: Shared ingestion library

**Files:**
- Create: `scripts/ingest/lib.ts`
- Test: `scripts/ingest/__tests__/lib.test.ts`

**Step 1: Write the failing test**

```typescript
// scripts/ingest/__tests__/lib.test.ts
import { describe, it, expect } from "vitest";
import { slugify, buildSearchText } from "../lib";

describe("slugify", () => {
  it("converts title to lowercase kebab-case", () => {
    expect(slugify("Welcome to the Cult")).toBe("welcome-to-the-cult");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Episode #5: The Veil's Edge!")).toBe(
      "episode-5-the-veils-edge"
    );
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("foo  --  bar")).toBe("foo-bar");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });
});

describe("buildSearchText", () => {
  it("joins non-empty parts with spaces", () => {
    expect(buildSearchText("Hello World", "tag one", "tag two")).toBe(
      "hello world tag one tag two"
    );
  });

  it("filters out null and undefined", () => {
    expect(buildSearchText("title", null, undefined, "extra")).toBe(
      "title extra"
    );
  });

  it("lowercases everything", () => {
    expect(buildSearchText("SHOUT", "Loud")).toBe("shout loud");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/ingest/__tests__/lib.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```typescript
// scripts/ingest/lib.ts
import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ─── Prisma client for scripts ──────────────────────
let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  const adapter = new PrismaPg({ connectionString });
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

export async function disconnect(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

// ─── Slug generation ────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Search text builder ────────────────────────────
export function buildSearchText(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map((p) => p.toLowerCase())
    .join(" ");
}
```

**Step 4: Run test to verify it passes**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/ingest/__tests__/lib.test.ts`
Expected: PASS — all 7 tests green

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/lib.ts scripts/ingest/__tests__/lib.test.ts
git commit -m "feat(ingest): add shared lib with slugify, buildSearchText, getPrisma"
```

---

### Task 2: Zod schemas for import data

**Files:**
- Create: `scripts/ingest/schemas.ts`
- Test: `scripts/ingest/__tests__/schemas.test.ts`

**Step 1: Write the failing test**

```typescript
// scripts/ingest/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { EpisodeRowSchema, PersonRowSchema, TopicRowSchema } from "../schemas";

describe("EpisodeRowSchema", () => {
  it("accepts valid episode data", () => {
    const result = EpisodeRowSchema.safeParse({
      title: "Welcome to the Cult",
      episodeNumber: 1,
      airDate: "2023-01-15",
      youtubeVideoId: "abc123",
      summaryShort: "First episode.",
      guests: ["Dr. Arcana"],
      topics: ["Tarot", "Consciousness"],
    });
    expect(result.success).toBe(true);
  });

  it("requires title", () => {
    const result = EpisodeRowSchema.safeParse({ episodeNumber: 1 });
    expect(result.success).toBe(false);
  });

  it("makes most fields optional", () => {
    const result = EpisodeRowSchema.safeParse({ title: "Minimal" });
    expect(result.success).toBe(true);
  });
});

describe("PersonRowSchema", () => {
  it("accepts valid person data", () => {
    const result = PersonRowSchema.safeParse({
      displayName: "Dr. Arcana",
      personType: "recurring",
    });
    expect(result.success).toBe(true);
  });

  it("defaults personType to guest", () => {
    const result = PersonRowSchema.parse({ displayName: "Someone" });
    expect(result.personType).toBe("guest");
  });
});

describe("TopicRowSchema", () => {
  it("accepts valid topic data", () => {
    const result = TopicRowSchema.safeParse({
      title: "Tarot",
      description: "Card readings",
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/ingest/__tests__/schemas.test.ts`
Expected: FAIL — module not found

**Step 3: Install zod, then write implementation**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npm install zod`

```typescript
// scripts/ingest/schemas.ts
import { z } from "zod";

export const EpisodeRowSchema = z.object({
  title: z.string().min(1),
  episodeNumber: z.number().int().positive().optional(),
  airDate: z.string().optional(), // ISO date string "YYYY-MM-DD"
  duration: z.string().optional(), // "H:MM:SS"
  youtubeVideoId: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
  summaryShort: z.string().optional(),
  summaryLong: z.string().optional(),
  cutOfPsyche: z.string().optional(),
  series: z.string().optional(), // series slug to link
  guests: z.array(z.string()).default([]), // person display names
  topics: z.array(z.string()).default([]), // topic titles
  lore: z.array(z.string()).default([]), // lore entry titles
});

export type EpisodeRow = z.infer<typeof EpisodeRowSchema>;

export const PersonRowSchema = z.object({
  displayName: z.string().min(1),
  altNames: z.array(z.string()).default([]),
  shortBio: z.string().optional(),
  personType: z
    .enum(["guest", "host", "mentioned", "recurring"])
    .default("guest"),
  avatarUrl: z.string().url().optional(),
});

export type PersonRow = z.infer<typeof PersonRowSchema>;

export const TopicRowSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export type TopicRow = z.infer<typeof TopicRowSchema>;

export const LoreRowSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  summary: z.string().optional(),
  fullEntry: z.string().optional(),
  canonStatus: z
    .enum(["canonical", "speculative", "community_myth", "disputed", "humorous"])
    .default("speculative"),
});

export type LoreRow = z.infer<typeof LoreRowSchema>;
```

**Step 4: Run test to verify it passes**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run scripts/ingest/__tests__/schemas.test.ts`
Expected: PASS — all 6 tests green

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/schemas.ts scripts/ingest/__tests__/schemas.test.ts package.json package-lock.json
git commit -m "feat(ingest): add zod validation schemas for import data"
```

---

### Task 3: Topics & People import scripts

**Files:**
- Create: `scripts/ingest/import-topics.ts`
- Create: `scripts/ingest/import-people.ts`

These are leaf entities with no foreign-key dependencies, so they can be imported first.

**Step 1: Write import-topics.ts**

```typescript
// scripts/ingest/import-topics.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { TopicRowSchema } from "./schemas";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-topics.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(TopicRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.title);
    const result = await prisma.topic.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        description: row.description ?? null,
      },
      update: {
        title: row.title,
        description: row.description ?? undefined,
      },
    });

    // Check if createdAt === updatedAt (roughly) to determine create vs update
    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`Topics: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 2: Write import-people.ts**

```typescript
// scripts/ingest/import-people.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { PersonRowSchema } from "./schemas";
import { PersonType } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-people.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(PersonRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.displayName);
    const searchText = buildSearchText(
      row.displayName,
      ...row.altNames,
      row.shortBio
    );

    const result = await prisma.person.upsert({
      where: { slug },
      create: {
        displayName: row.displayName,
        slug,
        altNames: row.altNames,
        shortBio: row.shortBio ?? null,
        personType: row.personType as PersonType,
        avatarUrl: row.avatarUrl ?? null,
        searchText,
      },
      update: {
        displayName: row.displayName,
        altNames: row.altNames,
        shortBio: row.shortBio ?? undefined,
        personType: row.personType as PersonType,
        avatarUrl: row.avatarUrl ?? undefined,
        searchText,
      },
    });

    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`People: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 3: Create sample data files for testing**

Create: `scripts/ingest/data/sample-topics.json`
```json
[
  { "title": "Tarot", "description": "Tarot card readings, symbolism, and divination." },
  { "title": "Consciousness", "description": "Exploration of awareness, perception, and the mind." },
  { "title": "Mythology", "description": "Ancient myths, archetypes, and storytelling." }
]
```

Create: `scripts/ingest/data/sample-people.json`
```json
[
  { "displayName": "Psyche", "personType": "host", "shortBio": "Host of the Cult of Psyche." },
  { "displayName": "Dr. Arcana", "altNames": ["The Doctor", "Arcana"], "personType": "recurring", "shortBio": "Occult scholar." },
  { "displayName": "Luna Veil", "personType": "guest", "shortBio": "Tarot reader and consciousness researcher." }
]
```

**Step 4: Manual smoke test (requires running DB)**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsx scripts/ingest/import-topics.ts scripts/ingest/data/sample-topics.json`
Expected: `Topics: 3 created, 0 updated (3 total)` (or updated counts if data already exists from seed)

Run again (idempotence): same command
Expected: `Topics: 0 created, 3 updated (3 total)`

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/import-topics.ts scripts/ingest/import-people.ts scripts/ingest/data/
git commit -m "feat(ingest): add topics and people import scripts with sample data"
```

---

### Task 4: Episodes import script (with relationship linking)

**Files:**
- Create: `scripts/ingest/import-episodes.ts`
- Create: `scripts/ingest/data/sample-episodes.json`

This is the most complex script because episodes link to people (guests), topics, and lore entries by name. The script resolves names to slugs and creates join-table records.

**Step 1: Write import-episodes.ts**

```typescript
// scripts/ingest/import-episodes.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { EpisodeRowSchema } from "./schemas";
import { ContentStatus } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-episodes.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(EpisodeRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;
  const warnings: string[] = [];

  for (const row of rows) {
    const slug = slugify(row.title);
    const searchText = buildSearchText(
      row.title,
      row.summaryShort,
      row.summaryLong,
      ...row.guests,
      ...row.topics
    );

    // Resolve series
    let seriesId: string | null = null;
    if (row.series) {
      const series = await prisma.series.findUnique({
        where: { slug: slugify(row.series) },
      });
      if (series) seriesId = series.id;
      else warnings.push(`Series "${row.series}" not found for "${row.title}"`);
    }

    // Upsert episode
    const episode = await prisma.episode.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        episodeNumber: row.episodeNumber ?? null,
        airDate: row.airDate ? new Date(row.airDate) : null,
        duration: row.duration ?? null,
        youtubeVideoId: row.youtubeVideoId ?? null,
        thumbnailUrl: row.thumbnailUrl ?? null,
        summaryShort: row.summaryShort ?? null,
        summaryLong: row.summaryLong ?? null,
        cutOfPsyche: row.cutOfPsyche ?? null,
        searchText,
        status: ContentStatus.published,
        seriesId,
      },
      update: {
        title: row.title,
        episodeNumber: row.episodeNumber ?? undefined,
        airDate: row.airDate ? new Date(row.airDate) : undefined,
        duration: row.duration ?? undefined,
        youtubeVideoId: row.youtubeVideoId ?? undefined,
        thumbnailUrl: row.thumbnailUrl ?? undefined,
        summaryShort: row.summaryShort ?? undefined,
        summaryLong: row.summaryLong ?? undefined,
        cutOfPsyche: row.cutOfPsyche ?? undefined,
        searchText,
        seriesId: seriesId ?? undefined,
      },
    });

    const isNew =
      Math.abs(episode.createdAt.getTime() - episode.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;

    // Link guests (clear + re-create for idempotence)
    if (row.guests.length > 0) {
      await prisma.episodeGuest.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.guests) {
        const person = await prisma.person.findUnique({
          where: { slug: slugify(name) },
        });
        if (person) {
          await prisma.episodeGuest.create({
            data: { episodeId: episode.id, personId: person.id },
          });
        } else {
          warnings.push(`Guest "${name}" not found for "${row.title}"`);
        }
      }
    }

    // Link topics (clear + re-create for idempotence)
    if (row.topics.length > 0) {
      await prisma.episodeTopic.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.topics) {
        const topic = await prisma.topic.findUnique({
          where: { slug: slugify(name) },
        });
        if (topic) {
          await prisma.episodeTopic.create({
            data: { episodeId: episode.id, topicId: topic.id },
          });
        } else {
          warnings.push(`Topic "${name}" not found for "${row.title}"`);
        }
      }
    }

    // Link lore (clear + re-create for idempotence)
    if (row.lore.length > 0) {
      await prisma.episodeLore.deleteMany({
        where: { episodeId: episode.id },
      });
      for (const name of row.lore) {
        const lore = await prisma.loreEntry.findUnique({
          where: { slug: slugify(name) },
        });
        if (lore) {
          await prisma.episodeLore.create({
            data: { episodeId: episode.id, loreEntryId: lore.id },
          });
        } else {
          warnings.push(`Lore "${name}" not found for "${row.title}"`);
        }
      }
    }
  }

  console.log(`Episodes: ${created} created, ${updated} updated (${rows.length} total)`);
  if (warnings.length > 0) {
    console.warn(`\nWarnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  - ${w}`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 2: Create sample episodes data**

Create: `scripts/ingest/data/sample-episodes.json`
```json
[
  {
    "title": "Welcome to the Cult",
    "episodeNumber": 1,
    "airDate": "2023-01-15",
    "duration": "2:15:30",
    "summaryShort": "The inaugural episode establishing the Cult of Psyche.",
    "guests": ["Dr. Arcana"],
    "topics": ["Consciousness", "Tarot"]
  },
  {
    "title": "Beyond the Veil",
    "episodeNumber": 2,
    "airDate": "2023-01-22",
    "duration": "1:45:00",
    "summaryShort": "Luna Veil explores perception and the nature of reality.",
    "guests": ["Luna Veil"],
    "topics": ["Consciousness", "Mythology"]
  },
  {
    "title": "The Arcana Codex",
    "episodeNumber": 3,
    "airDate": "2023-01-29",
    "duration": "2:30:00",
    "summaryShort": "Dr. Arcana reveals the hidden codex of tarot symbolism.",
    "guests": ["Dr. Arcana"],
    "topics": ["Tarot", "Mythology"]
  }
]
```

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/import-episodes.ts scripts/ingest/data/sample-episodes.json
git commit -m "feat(ingest): add episodes import with guest/topic/lore linking"
```

---

### Task 5: Lore import script

**Files:**
- Create: `scripts/ingest/import-lore.ts`
- Create: `scripts/ingest/data/sample-lore.json`

**Step 1: Write import-lore.ts**

```typescript
// scripts/ingest/import-lore.ts
import { readFileSync } from "fs";
import { getPrisma, disconnect, slugify, buildSearchText } from "./lib";
import { LoreRowSchema } from "./schemas";
import { CanonStatus } from "../../src/generated/prisma/client";
import { z } from "zod";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/ingest/import-lore.ts <file.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  const rows = z.array(LoreRowSchema).parse(raw);
  const prisma = getPrisma();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const slug = slugify(row.title);
    const searchText = buildSearchText(
      row.title,
      row.category,
      row.summary
    );

    const result = await prisma.loreEntry.upsert({
      where: { slug },
      create: {
        title: row.title,
        slug,
        category: row.category ?? null,
        summary: row.summary ?? null,
        fullEntry: row.fullEntry ?? null,
        canonStatus: row.canonStatus as CanonStatus,
        searchText,
      },
      update: {
        title: row.title,
        category: row.category ?? undefined,
        summary: row.summary ?? undefined,
        fullEntry: row.fullEntry ?? undefined,
        canonStatus: row.canonStatus as CanonStatus,
        searchText,
      },
    });

    const isNew =
      Math.abs(result.createdAt.getTime() - result.updatedAt.getTime()) < 1000;
    if (isNew) created++;
    else updated++;
  }

  console.log(`Lore: ${created} created, ${updated} updated (${rows.length} total)`);
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

**Step 2: Create sample lore data**

Create: `scripts/ingest/data/sample-lore.json`
```json
[
  {
    "title": "The Psyche Protocol",
    "category": "doctrine",
    "summary": "The founding principles of the Cult of Psyche.",
    "canonStatus": "canonical"
  },
  {
    "title": "The Veil Theory",
    "category": "concept",
    "summary": "The hypothesis that reality consists of layered veils of perception.",
    "canonStatus": "speculative"
  }
]
```

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/import-lore.ts scripts/ingest/data/sample-lore.json
git commit -m "feat(ingest): add lore import script with sample data"
```

---

### Task 6: Orchestrator script and npm scripts

**Files:**
- Create: `scripts/ingest/import-all.ts`
- Modify: `package.json` (add npm scripts)

**Step 1: Write import-all.ts**

```typescript
// scripts/ingest/import-all.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";

const scriptDir = dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");

function run(script: string, dataFile: string) {
  const fullScript = resolve(scriptDir, script);
  const fullData = resolve(process.cwd(), dataFile);

  if (!existsSync(fullData)) {
    console.log(`Skipping ${script}: ${dataFile} not found`);
    return;
  }

  console.log(`\n--- Running ${script} with ${dataFile} ---`);
  execSync(`npx tsx "${fullScript}" "${fullData}"`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

const dataDir = process.argv[2] || "scripts/ingest/data";

// Import order: leaf entities first, then episodes (which link to them)
run("import-topics.ts", `${dataDir}/topics.json`);
run("import-people.ts", `${dataDir}/people.json`);
run("import-lore.ts", `${dataDir}/lore.json`);
run("import-episodes.ts", `${dataDir}/episodes.json`);

console.log("\nAll imports complete.");
```

**Step 2: Add npm scripts to package.json**

Add to `"scripts"` in `package.json`:
```json
"ingest": "npx tsx scripts/ingest/import-all.ts",
"ingest:topics": "npx tsx scripts/ingest/import-topics.ts",
"ingest:people": "npx tsx scripts/ingest/import-people.ts",
"ingest:lore": "npx tsx scripts/ingest/import-lore.ts",
"ingest:episodes": "npx tsx scripts/ingest/import-episodes.ts"
```

**Step 3: Run tests to make sure nothing broke**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx vitest run`
Expected: All tests pass (existing 39 + new lib/schema tests)

**Step 4: Run TypeScript check**

Run: `cd "C:/Users/John Bates/Projects/cultcodex-v2" && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add scripts/ingest/import-all.ts package.json
git commit -m "feat(ingest): add orchestrator script and npm ingest commands"
```

---

## Usage Summary

After implementation, the pipeline works like this:

```bash
# Import everything from a data directory
npm run ingest                                    # uses scripts/ingest/data/
npm run ingest -- path/to/custom/data             # custom directory

# Import individual entity types
npm run ingest:topics -- data/topics.json
npm run ingest:people -- data/people.json
npm run ingest:lore -- data/lore.json
npm run ingest:episodes -- data/episodes.json     # must run after topics/people/lore
```

**Data file naming convention** (for import-all.ts):
```
data/
  topics.json      # array of { title, description? }
  people.json      # array of { displayName, personType?, altNames?, shortBio? }
  lore.json        # array of { title, category?, summary?, canonStatus? }
  episodes.json    # array of { title, episodeNumber?, airDate?, guests[], topics[], ... }
```

All imports are **idempotent** — running the same data twice updates existing records by slug match.
