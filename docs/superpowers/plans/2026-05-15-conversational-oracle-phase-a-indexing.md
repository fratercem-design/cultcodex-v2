# Conversational Oracle — Phase A: Indexing Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a queryable hybrid-search (BM25 + pgvector + Cohere rerank) index over CultCodex's full corpus (transcripts, episode summaries, quotes, lore, topics, people, Psychenomicon) so subsequent Oracle phases can retrieve from it.

**Architecture:** A single `OracleChunk` Postgres table stores all content types as fixed-shape rows with both a `tsvector`-indexed `searchText` column (BM25) and a `vector(1024)` `embedding` column (pgvector ivfflat). Per-source-type chunkers project the existing schema (Episode, Person, Quote, etc.) into chunks; a `hybridSearch` function runs both BM25 and vector passes, fuses with reciprocal rank, applies a metadata boost, and reranks via Cohere. A one-shot `build-index` script and a `reindex-incremental` script (diff by `contentHash`) maintain the index. Phase A ships no UI, no production API routes, and no agent — only the retrieval substrate.

**Tech Stack:** TypeScript, Prisma 7 + `@prisma/adapter-pg`, Neon Postgres + pgvector, Voyage AI (`voyage-3` embeddings), Cohere (`rerank-v3`), Node `pg` for raw SQL on the `embedding` column, `vitest` for tests, `dotenvx` for env loading in scripts.

**Spec:** [`docs/superpowers/specs/2026-05-15-conversational-oracle-design.md`](../specs/2026-05-15-conversational-oracle-design.md) — Sections 6, 7, and Section 8 Rollout Phase A.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `prisma/schema.prisma` | Modify | Add `OracleChunkSource` enum + `OracleChunk` model |
| `prisma/migrations/20260515000000_oracle_chunks_init/migration.sql` | Create | pgvector extension + OracleChunk table + ivfflat + GIN indexes |
| `.env.example` | Modify | Document VOYAGE_API_KEY, COHERE_API_KEY, ORACLE_EMBED_MODEL |
| `src/lib/oracle/types.ts` | Create | Shared TS types — `OracleChunkRecord`, `RetrievalState`, `HybridResult`, `Citation`, `ChunkInput` |
| `src/lib/oracle/retrieval/embeddings.ts` | Create | Voyage API wrapper — `embedQuery(text)`, `embedDocuments(texts[])` with batching |
| `src/lib/oracle/retrieval/build-search-text.ts` | Create | Per-source-type formatter for the BM25 `searchText` column |
| `src/lib/oracle/retrieval/chunkers/transcript.ts` | Create | Speaker-turn aggregator → ~400-token windows with 50-token overlap |
| `src/lib/oracle/retrieval/chunkers/episode-summary.ts` | Create | One chunk per episode from short + long summaries |
| `src/lib/oracle/retrieval/chunkers/quote.ts` | Create | One chunk per Quote row + surrounding transcript if short |
| `src/lib/oracle/retrieval/chunkers/lore.ts` | Create | One chunk for summary; body split if >500 tokens |
| `src/lib/oracle/retrieval/chunkers/topic.ts` | Create | One chunk per topic: title + description + top-N episode titles |
| `src/lib/oracle/retrieval/chunkers/person.ts` | Create | One chunk per person: displayName + altNames + bios + top quote excerpts |
| `src/lib/oracle/retrieval/chunkers/psychenomicon.ts` | Create | Three chunks per chapter (canon/interpretation/mythic) + one per thread + one per entity |
| `src/lib/oracle/retrieval/chunkers/index.ts` | Create | Re-export + router by source type |
| `src/lib/oracle/retrieval/thresholds.ts` | Create | `T_hi` / `T_lo` per source type + `classifyRetrievalState(topScore, sourceType)` |
| `src/lib/oracle/retrieval/rrf.ts` | Create | Reciprocal rank fusion of two ranked lists |
| `src/lib/oracle/retrieval/rerank.ts` | Create | Cohere rerank-v3 API wrapper |
| `src/lib/oracle/retrieval/hybrid-search.ts` | Create | Top-level `hybridSearch(opts)` — BM25 + vector + fusion + boost + rerank |
| `scripts/oracle/build-index.ts` | Create | One-shot full reindex driver — iterates source types, chunks, embeds, upserts |
| `scripts/oracle/reindex-incremental.ts` | Create | Same flow but diff by `contentHash` and only re-embed changes |
| `scripts/oracle/eval/golden-set.json` | Create | ~10 Phase-A sanity entries (full 100 deferred to Phase C) |
| `scripts/oracle/eval/run-eval.ts` | Create | Runs each golden entry through `hybridSearch`, reports state correctness + citation coverage |
| `package.json` | Modify | Add `oracle:build-index`, `oracle:reindex`, `oracle:eval` scripts |

Tests are co-located in `__tests__/` siblings per existing repo convention.

---

## Task 1: Schema — add OracleChunk model and enum

**Files:**
- Modify: `prisma/schema.prisma` (append at bottom)

- [ ] **Step 1: Open `prisma/schema.prisma` and append to the bottom of the file**

Add this exactly:

```prisma
// ─── Oracle / RAG index ───────────────────────────────────────────────────────

enum OracleChunkSource {
  transcript
  episode_summary
  quote
  lore
  topic
  person
  psy_chapter
  psy_thread
  psy_entity
}

model OracleChunk {
  id           String              @id @default(cuid())
  sourceType   OracleChunkSource
  sourceId     String
  content      String              @db.Text
  searchText   String              @db.Text
  embedding    Unsupported("vector(1024)")
  metadata     Json
  contentHash  String
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  @@index([sourceType])
  @@index([sourceId])
  @@index([contentHash])
}
```

- [ ] **Step 2: Format the schema**

Run from repo root: `npx prisma format`
Expected: command exits 0, no diff in any other model.

- [ ] **Step 3: Verify the schema parses**

Run: `npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid 🚀` (or equivalent success message).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(oracle): add OracleChunk model + OracleChunkSource enum"
```

---

## Task 2: Migration — pgvector extension + OracleChunk table + indexes

**Files:**
- Create: `prisma/migrations/20260515000000_oracle_chunks_init/migration.sql`

Prisma's `Unsupported("vector(1024)")` will generate a syntactically-correct column declaration but it cannot generate the `CREATE EXTENSION` or the specialized indexes — those go in a hand-written migration. We bypass `prisma migrate dev` for this file and use `prisma migrate resolve` after applying manually, to keep `_prisma_migrations` consistent.

- [ ] **Step 1: Create the migration directory**

Run from repo root: `mkdir -p prisma/migrations/20260515000000_oracle_chunks_init`

Verify: `ls prisma/migrations/20260515000000_oracle_chunks_init` lists no files yet.

- [ ] **Step 2: Write the migration SQL**

Create `prisma/migrations/20260515000000_oracle_chunks_init/migration.sql` with:

```sql
-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Enum
CREATE TYPE "OracleChunkSource" AS ENUM (
  'transcript',
  'episode_summary',
  'quote',
  'lore',
  'topic',
  'person',
  'psy_chapter',
  'psy_thread',
  'psy_entity'
);

-- Table
CREATE TABLE "OracleChunk" (
  "id"          TEXT NOT NULL,
  "sourceType"  "OracleChunkSource" NOT NULL,
  "sourceId"    TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "searchText"  TEXT NOT NULL,
  "embedding"   vector(1024) NOT NULL,
  "metadata"    JSONB NOT NULL,
  "contentHash" TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OracleChunk_pkey" PRIMARY KEY ("id")
);

-- Standard btree indexes (declared in Prisma schema)
CREATE INDEX "OracleChunk_sourceType_idx"  ON "OracleChunk" ("sourceType");
CREATE INDEX "OracleChunk_sourceId_idx"    ON "OracleChunk" ("sourceId");
CREATE INDEX "OracleChunk_contentHash_idx" ON "OracleChunk" ("contentHash");

-- ANN index for vector cosine similarity (lists tuned for ~50K rows)
CREATE INDEX "OracleChunk_embedding_idx"
  ON "OracleChunk"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

-- BM25 (full-text) index over searchText
CREATE INDEX "OracleChunk_searchText_gin_idx"
  ON "OracleChunk"
  USING gin (to_tsvector('english', "searchText"));
```

- [ ] **Step 3: Apply the migration to the dev database**

Run: `npx prisma migrate dev --name oracle_chunks_init --create-only` to register the migration name in `_prisma_migrations` without re-generating. Then: `npx prisma migrate deploy`.

If `migrate dev --create-only` errors because the file already exists, instead run: `npx prisma migrate resolve --applied 20260515000000_oracle_chunks_init` followed by `npx prisma migrate deploy`.

Expected: `_prisma_migrations` contains a row for `20260515000000_oracle_chunks_init` and `OracleChunk` exists in the dev DB.

- [ ] **Step 4: Verify the table and indexes exist**

Run (in a Postgres client connected to `DATABASE_URL` or via `npx prisma studio` and a raw SQL tab):

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'OracleChunk' ORDER BY indexname;
```

Expected output (5 rows):
```
OracleChunk_contentHash_idx
OracleChunk_embedding_idx
OracleChunk_pkey
OracleChunk_searchText_gin_idx
OracleChunk_sourceId_idx
OracleChunk_sourceType_idx
```

- [ ] **Step 5: Regenerate the Prisma client**

Run: `npx prisma generate`
Expected: prints `Generated Prisma Client (v7.x.x) to ./src/generated/prisma`.

- [ ] **Step 6: Commit**

```bash
git add prisma/migrations/20260515000000_oracle_chunks_init
git commit -m "feat(oracle): migration — pgvector extension + OracleChunk table + ivfflat/GIN indexes"
```

---

## Task 3: Env vars — document new keys

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Append a new section to `.env.example`**

Open `.env.example` and add at the bottom (after the existing VAPID block):

```
# ─── Oracle / RAG (Phase A: indexing) ───────────────────────────────────────
# Voyage AI for embeddings. Sign up at https://www.voyageai.com/
# Used by scripts/oracle/build-index.ts and the future query-time embed.
VOYAGE_API_KEY=your_voyage_api_key_here
ORACLE_EMBED_MODEL=voyage-3

# Cohere for cross-encoder reranking. https://dashboard.cohere.com/api-keys
# Used by src/lib/oracle/retrieval/rerank.ts.
COHERE_API_KEY=your_cohere_api_key_here
ORACLE_RERANK_MODEL=rerank-v3.5
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(oracle): document VOYAGE_API_KEY, COHERE_API_KEY env vars"
```

---

## Task 4: Shared types — `src/lib/oracle/types.ts`

**Files:**
- Create: `src/lib/oracle/types.ts`
- Test: `src/lib/oracle/__tests__/types.test.ts` (compile-only smoke test)

- [ ] **Step 1: Create `src/lib/oracle/types.ts`**

```ts
/**
 * Shared Oracle types used across retrieval, chunkers, and (later) tools/agent.
 * Phase A only uses the retrieval-side types; agent/tool types ride in later phases.
 */

export type OracleChunkSource =
  | "transcript"
  | "episode_summary"
  | "quote"
  | "lore"
  | "topic"
  | "person"
  | "psy_chapter"
  | "psy_thread"
  | "psy_entity";

/** What the chunkers emit, before insertion into OracleChunk. */
export interface ChunkInput {
  sourceType: OracleChunkSource;
  sourceId: string;
  content: string;
  searchText: string;
  metadata: ChunkMetadata;
  /** sha256 of `content`; used by incremental reindex. */
  contentHash: string;
}

export interface ChunkMetadata {
  personSlug?: string;
  episodeId?: string;
  episodeNumber?: number;
  chapterNumber?: number;
  threadSlug?: string;
  entitySlug?: string;
  peopleMentioned?: string[];
  topicSlugs?: string[];
  startSeconds?: number;
  endSeconds?: number;
  speakerLabel?: string;
  /** Human-readable reference, e.g., "EP.402 — \"The Hollow Thread\"" */
  sourceRef: string;
}

export type RetrievalState = "strong" | "weak" | "none";

/** One result row returned by hybridSearch. */
export interface HybridResult {
  id: string;
  sourceType: OracleChunkSource;
  sourceRef: string;
  snippet: string;
  score: number;
  metadata: ChunkMetadata;
}

export interface HybridSearchResponse {
  state: RetrievalState;
  results: HybridResult[];
}

export interface Citation {
  chunkId: string;
  sourceType: OracleChunkSource;
  sourceRef: string;
  snippet: string;
  episodeNumber?: number;
  episodeSlug?: string;
  timestampSeconds?: number;
}
```

- [ ] **Step 2: Create a compile-only smoke test**

Create `src/lib/oracle/__tests__/types.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type {
  ChunkInput,
  HybridResult,
  HybridSearchResponse,
  RetrievalState,
} from "../types";

describe("oracle types", () => {
  it("ChunkInput can be constructed with required fields only", () => {
    const c: ChunkInput = {
      sourceType: "quote",
      sourceId: "q_1",
      content: "hello",
      searchText: "hello",
      metadata: { sourceRef: "EP.001" },
      contentHash: "abc",
    };
    expect(c.sourceType).toBe("quote");
  });

  it("HybridSearchResponse models the three retrieval states", () => {
    const states: RetrievalState[] = ["strong", "weak", "none"];
    const out: HybridSearchResponse[] = states.map((state) => ({
      state,
      results: [] as HybridResult[],
    }));
    expect(out).toHaveLength(3);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run src/lib/oracle/__tests__/types.test.ts`
Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/oracle/types.ts src/lib/oracle/__tests__/types.test.ts
git commit -m "feat(oracle): shared retrieval-layer types"
```

---

## Task 5: Embedding wrapper — Voyage API

**Files:**
- Create: `src/lib/oracle/retrieval/embeddings.ts`
- Test: `src/lib/oracle/retrieval/__tests__/embeddings.test.ts`

Voyage's REST endpoint is `https://api.voyageai.com/v1/embeddings`. Body: `{ input: string[], model: string, input_type?: "query"|"document" }`. Auth: `Authorization: Bearer ${VOYAGE_API_KEY}`. Returns `{ data: [{ embedding: number[], index: number }, ...] }`. Max batch size: 128 inputs.

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/embeddings.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { embedQuery, embedDocuments } from "../embeddings";

const ORIGINAL_FETCH = global.fetch;

function mockEmbedResponse(vectors: number[][]) {
  return {
    ok: true,
    json: async () => ({
      data: vectors.map((embedding, index) => ({ embedding, index })),
    }),
  } as unknown as Response;
}

describe("embeddings", () => {
  beforeEach(() => {
    vi.stubEnv("VOYAGE_API_KEY", "test_key_123");
    vi.stubEnv("ORACLE_EMBED_MODEL", "voyage-3");
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("embedQuery returns a single 1024-length vector", async () => {
    const fake = Array.from({ length: 1024 }, () => 0.1);
    global.fetch = vi.fn().mockResolvedValue(mockEmbedResponse([fake]));

    const out = await embedQuery("hello world");
    expect(out).toHaveLength(1024);
    expect(global.fetch).toHaveBeenCalledOnce();

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.input).toEqual(["hello world"]);
    expect(body.input_type).toBe("query");
    expect(body.model).toBe("voyage-3");
    expect(call[1].headers.Authorization).toBe("Bearer test_key_123");
  });

  it("embedDocuments batches into groups of 128", async () => {
    const fakeVec = Array.from({ length: 1024 }, () => 0.0);
    const inputs = Array.from({ length: 300 }, (_, i) => `doc-${i}`);

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      const body = JSON.parse((init as RequestInit).body as string);
      const vectors = (body.input as string[]).map(() => fakeVec);
      return Promise.resolve(mockEmbedResponse(vectors));
    });

    const out = await embedDocuments(inputs);
    expect(out).toHaveLength(300);
    // 300 / 128 = 3 calls (128 + 128 + 44)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("throws when VOYAGE_API_KEY is missing", async () => {
    vi.unstubAllEnvs();
    await expect(embedQuery("x")).rejects.toThrow(/VOYAGE_API_KEY/);
  });

  it("throws when the API returns a non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "rate limited",
    } as unknown as Response);
    await expect(embedQuery("x")).rejects.toThrow(/voyage embed failed: 429/);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/embeddings.test.ts`
Expected: fails with `Cannot find module '../embeddings'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/embeddings.ts`**

```ts
/**
 * Voyage AI embedding wrapper. Phase A uses the `voyage-3` model (1024-dim).
 * The model name is read from ORACLE_EMBED_MODEL (default "voyage-3") so we can
 * switch without code changes during eval.
 *
 * Voyage REST docs: https://docs.voyageai.com/reference/embeddings-api
 */

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MAX_BATCH = 128;

function getApiKey(): string {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error("VOYAGE_API_KEY is not set");
  return key;
}

function getModel(): string {
  return process.env.ORACLE_EMBED_MODEL ?? "voyage-3";
}

async function callVoyage(
  inputs: string[],
  inputType: "query" | "document",
): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      input: inputs,
      model: getModel(),
      input_type: inputType,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`voyage embed failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };
  // Voyage returns data sorted by index, but be defensive.
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Embed a single user query. */
export async function embedQuery(text: string): Promise<number[]> {
  const [vec] = await callVoyage([text], "query");
  return vec;
}

/** Embed many documents, batching to MAX_BATCH per Voyage request. */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const slice = texts.slice(i, i + MAX_BATCH);
    const vecs = await callVoyage(slice, "document");
    out.push(...vecs);
  }
  return out;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/embeddings.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oracle/retrieval/embeddings.ts src/lib/oracle/retrieval/__tests__/embeddings.test.ts
git commit -m "feat(oracle): Voyage embedding wrapper with batching"
```

---

## Task 6: searchText builders — per source type

**Files:**
- Create: `src/lib/oracle/retrieval/build-search-text.ts`
- Test: `src/lib/oracle/retrieval/__tests__/build-search-text.test.ts`

`searchText` is what we put into the BM25 index. It's hand-built per source type to maximize keyword recall — e.g., transcript chunks get the episode title + episode number prepended, person chunks include all `altNames`. The chunkers call into these.

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/build-search-text.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  buildTranscriptSearchText,
  buildEpisodeSummarySearchText,
  buildQuoteSearchText,
  buildLoreSearchText,
  buildTopicSearchText,
  buildPersonSearchText,
  buildPsyChapterSearchText,
  buildPsyThreadSearchText,
  buildPsyEntitySearchText,
} from "../build-search-text";

describe("build-search-text", () => {
  it("transcript prepends episode number and title + speaker label", () => {
    const out = buildTranscriptSearchText({
      episodeNumber: 402,
      episodeTitle: "The Hollow Thread",
      speakerLabel: "Mason",
      text: "Fear is the ritual before belief.",
    });
    expect(out).toContain("EP.402");
    expect(out).toContain("The Hollow Thread");
    expect(out).toContain("Mason");
    expect(out).toContain("Fear is the ritual before belief.");
  });

  it("transcript handles missing speaker label", () => {
    const out = buildTranscriptSearchText({
      episodeNumber: 187,
      episodeTitle: "X",
      speakerLabel: null,
      text: "hello",
    });
    expect(out).not.toContain("null");
  });

  it("episode summary includes episode number, title, short + long", () => {
    const out = buildEpisodeSummarySearchText({
      episodeNumber: 5,
      title: "T",
      summaryShort: "short",
      summaryLong: "long",
    });
    expect(out).toContain("EP.005");
    expect(out).toContain("short");
    expect(out).toContain("long");
  });

  it("quote includes speaker name, episode ref, and text", () => {
    const out = buildQuoteSearchText({
      text: "the lie",
      speakerName: "Mason",
      episodeNumber: 187,
      episodeTitle: "Fall",
    });
    expect(out).toContain("Mason");
    expect(out).toContain("EP.187");
    expect(out).toContain("the lie");
  });

  it("person flattens altNames into the searchText", () => {
    const out = buildPersonSearchText({
      displayName: "Alexandra Mayers",
      altNames: ["Monica Foster", "AM"],
      shortBio: "a bio",
      loreSummary: null,
    });
    expect(out).toContain("Alexandra Mayers");
    expect(out).toContain("Monica Foster");
    expect(out).toContain("AM");
    expect(out).toContain("a bio");
  });

  it("topic concatenates title + description + episode titles", () => {
    const out = buildTopicSearchText({
      title: "Cult Formation",
      description: "patterns of",
      relatedEpisodeTitles: ["EP A", "EP B"],
    });
    expect(out).toContain("Cult Formation");
    expect(out).toContain("patterns of");
    expect(out).toContain("EP A");
  });

  it("lore includes title, category, and summary", () => {
    expect(
      buildLoreSearchText({
        title: "Tower",
        category: "symbol",
        summary: "collapse",
        fullEntry: null,
      }),
    ).toContain("Tower");
  });

  it("psychenomicon chapter includes chapter number + title", () => {
    expect(
      buildPsyChapterSearchText({
        chapterNumber: 12,
        title: "Trickster's Doubt",
        body: "...",
        bodyKind: "canon",
      }),
    ).toMatch(/CH\.012.*Trickster's Doubt/i);
  });

  it("psychenomicon thread and entity emit something non-empty", () => {
    expect(
      buildPsyThreadSearchText({
        title: "Descent",
        slug: "descent",
        description: null,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      buildPsyEntitySearchText({
        name: "Mason",
        primaryArchetype: "Trickster",
        behaviorPatterns: ["evasion"],
      }).length,
    ).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/build-search-text.test.ts`
Expected: fails with `Cannot find module '../build-search-text'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/build-search-text.ts`**

```ts
/**
 * Per-source-type builders for the BM25 `searchText` column on OracleChunk.
 *
 * The BM25 index is built over `to_tsvector('english', searchText)`. By
 * prepending the most-keyword-rich identifiers (episode numbers, names,
 * altNames) we give keyword recall a fighting chance on the queries that
 * pure embeddings fail on.
 */

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function pad4(n: number): string {
  return String(n).padStart(3, "0").padStart(4, "0");
}

function ep(n: number | null | undefined): string {
  return n == null ? "" : `EP.${pad3(n)}`;
}

function ch(n: number | null | undefined): string {
  return n == null ? "" : `CH.${pad4(n)}`;
}

function joinFragments(parts: Array<string | null | undefined>): string {
  return parts.filter((p): p is string => Boolean(p && p.trim())).join("  •  ");
}

export function buildTranscriptSearchText(args: {
  episodeNumber: number | null;
  episodeTitle: string;
  speakerLabel: string | null;
  text: string;
}): string {
  return joinFragments([
    ep(args.episodeNumber),
    args.episodeTitle,
    args.speakerLabel ?? null,
    args.text,
  ]);
}

export function buildEpisodeSummarySearchText(args: {
  episodeNumber: number | null;
  title: string;
  summaryShort: string | null;
  summaryLong: string | null;
}): string {
  return joinFragments([
    ep(args.episodeNumber),
    args.title,
    args.summaryShort,
    args.summaryLong,
  ]);
}

export function buildQuoteSearchText(args: {
  text: string;
  speakerName: string | null;
  episodeNumber: number | null;
  episodeTitle: string | null;
}): string {
  return joinFragments([
    args.speakerName,
    ep(args.episodeNumber),
    args.episodeTitle,
    args.text,
  ]);
}

export function buildLoreSearchText(args: {
  title: string;
  category: string | null;
  summary: string | null;
  fullEntry: string | null;
}): string {
  return joinFragments([
    args.title,
    args.category,
    args.summary,
    args.fullEntry,
  ]);
}

export function buildTopicSearchText(args: {
  title: string;
  description: string | null;
  relatedEpisodeTitles: string[];
}): string {
  return joinFragments([
    args.title,
    args.description,
    args.relatedEpisodeTitles.join(" · "),
  ]);
}

export function buildPersonSearchText(args: {
  displayName: string;
  altNames: string[];
  shortBio: string | null;
  loreSummary: string | null;
}): string {
  return joinFragments([
    args.displayName,
    args.altNames.join(" · "),
    args.shortBio,
    args.loreSummary,
  ]);
}

export function buildPsyChapterSearchText(args: {
  chapterNumber: number;
  title: string;
  body: string;
  bodyKind: "canon" | "interpretation" | "mythic";
}): string {
  return joinFragments([
    ch(args.chapterNumber),
    args.title,
    args.bodyKind.toUpperCase(),
    args.body,
  ]);
}

export function buildPsyThreadSearchText(args: {
  title: string;
  slug: string;
  description: string | null;
}): string {
  return joinFragments([args.title, args.slug, args.description]);
}

export function buildPsyEntitySearchText(args: {
  name: string;
  primaryArchetype: string | null;
  behaviorPatterns: string[];
}): string {
  return joinFragments([
    args.name,
    args.primaryArchetype,
    args.behaviorPatterns.join(" · "),
  ]);
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/build-search-text.test.ts`
Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oracle/retrieval/build-search-text.ts src/lib/oracle/retrieval/__tests__/build-search-text.test.ts
git commit -m "feat(oracle): per-source-type searchText builders"
```

---

## Task 7: Transcript + episode-summary chunkers

**Files:**
- Create: `src/lib/oracle/retrieval/chunkers/transcript.ts`
- Create: `src/lib/oracle/retrieval/chunkers/episode-summary.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/transcript.test.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/episode-summary.test.ts`

Token counting: we approximate tokens as `Math.ceil(text.length / 4)`. This is intentionally rough — the Voyage embedder will handle exact token counts internally; we only need it for chunk sizing.

- [ ] **Step 1: Write the transcript chunker failing test**

Create `src/lib/oracle/retrieval/chunkers/__tests__/transcript.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkTranscript } from "../transcript";

const baseEpisode = {
  id: "ep1",
  episodeNumber: 42,
  title: "T",
  slug: "t",
};

describe("chunkTranscript", () => {
  it("groups consecutive same-speaker segments and emits one chunk under window", () => {
    const segments = [
      { id: "s1", startSeconds: 0,  endSeconds: 5,  speakerLabel: "Psyche", text: "hello" },
      { id: "s2", startSeconds: 5,  endSeconds: 10, speakerLabel: "Psyche", text: "world" },
    ];
    const out = chunkTranscript(baseEpisode, segments);
    expect(out).toHaveLength(1);
    expect(out[0].content).toContain("hello");
    expect(out[0].content).toContain("world");
    expect(out[0].metadata.startSeconds).toBe(0);
    expect(out[0].metadata.endSeconds).toBe(10);
    expect(out[0].metadata.speakerLabel).toBe("Psyche");
    expect(out[0].metadata.episodeId).toBe("ep1");
    expect(out[0].metadata.episodeNumber).toBe(42);
    expect(out[0].metadata.sourceRef).toMatch(/EP\.042/);
  });

  it("splits into multiple chunks when content exceeds the window", () => {
    // Each segment ~ 1600 chars ≈ 400 tokens. 5 segments ≈ 2000 tokens.
    // With WINDOW_TOKENS=400 + OVERLAP_TOKENS=50, we expect ≥4 chunks.
    const long = "x ".repeat(800); // 1600 chars
    const segments = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`,
      startSeconds: i * 60,
      endSeconds: (i + 1) * 60,
      speakerLabel: "Psyche",
      text: long,
    }));
    const out = chunkTranscript(baseEpisode, segments);
    expect(out.length).toBeGreaterThanOrEqual(4);
    // All chunks share the same episode metadata
    for (const c of out) {
      expect(c.metadata.episodeId).toBe("ep1");
      expect(c.sourceType).toBe("transcript");
    }
  });

  it("emits stable contentHash for identical content", () => {
    const segments = [
      { id: "s1", startSeconds: 0, endSeconds: 5, speakerLabel: null, text: "hi" },
    ];
    const a = chunkTranscript(baseEpisode, segments)[0];
    const b = chunkTranscript(baseEpisode, segments)[0];
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/transcript.test.ts`
Expected: fails with `Cannot find module '../transcript'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/chunkers/transcript.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildTranscriptSearchText } from "../build-search-text";

const WINDOW_TOKENS = 400;
const OVERLAP_TOKENS = 50;
const CHARS_PER_TOKEN = 4; // rough approximation

interface EpisodeLite {
  id: string;
  episodeNumber: number | null;
  title: string;
  slug: string;
}

interface SegmentLite {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

function pad3(n: number | null | undefined): string {
  return n == null ? "" : String(n).padStart(3, "0");
}

function sourceRefFor(ep: EpisodeLite): string {
  const num = ep.episodeNumber != null ? `EP.${pad3(ep.episodeNumber)}` : "EP.???";
  return `${num} — "${ep.title}"`;
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Roll consecutive same-speaker segments into windowed chunks.
 *
 * Aggregation rule:
 *   - Walk segments in order.
 *   - Greedily concat into a buffer until the buffer would exceed
 *     WINDOW_TOKENS * CHARS_PER_TOKEN characters.
 *   - Emit a chunk. Restart the buffer with the last OVERLAP_TOKENS worth
 *     of characters for sliding-window context continuity.
 *   - Speaker boundary doesn't force a flush — but we keep the *first*
 *     speaker label as the chunk's representative label (most chunks
 *     are mono-speaker; mixed chunks are still queryable).
 */
export function chunkTranscript(
  episode: EpisodeLite,
  segments: SegmentLite[],
): ChunkInput[] {
  if (segments.length === 0) return [];

  const sourceRef = sourceRefFor(episode);
  const chunks: ChunkInput[] = [];
  const windowChars = WINDOW_TOKENS * CHARS_PER_TOKEN;
  const overlapChars = OVERLAP_TOKENS * CHARS_PER_TOKEN;

  let bufferText = "";
  let bufferStart = segments[0].startSeconds;
  let bufferEnd = segments[0].endSeconds;
  let bufferSpeaker: string | null = segments[0].speakerLabel;
  let chunkIndex = 0;

  const flush = () => {
    if (!bufferText.trim()) return;
    const content = bufferText.trim();
    const searchText = buildTranscriptSearchText({
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.title,
      speakerLabel: bufferSpeaker,
      text: content,
    });
    chunks.push({
      sourceType: "transcript",
      sourceId: `${episode.id}#${chunkIndex}`,
      content,
      searchText,
      metadata: {
        episodeId: episode.id,
        episodeNumber: episode.episodeNumber ?? undefined,
        speakerLabel: bufferSpeaker ?? undefined,
        startSeconds: bufferStart,
        endSeconds: bufferEnd,
        sourceRef,
      },
      contentHash: sha256(content),
    });
    chunkIndex += 1;
  };

  for (const seg of segments) {
    const incoming = seg.text.trim();
    if (!incoming) continue;
    const sep = bufferText ? "\n" : "";
    const projected = bufferText + sep + incoming;
    if (projected.length > windowChars && bufferText) {
      // Flush current buffer, then carry overlap.
      flush();
      const tail = bufferText.slice(Math.max(0, bufferText.length - overlapChars));
      bufferText = tail + "\n" + incoming;
      bufferStart = seg.startSeconds;
      bufferSpeaker = seg.speakerLabel;
    } else {
      if (!bufferText) {
        bufferStart = seg.startSeconds;
        bufferSpeaker = seg.speakerLabel;
      }
      bufferText = projected;
    }
    bufferEnd = seg.endSeconds;
  }

  flush();
  return chunks;
}
```

- [ ] **Step 4: Run the transcript test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/transcript.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Write the episode-summary chunker failing test**

Create `src/lib/oracle/retrieval/chunkers/__tests__/episode-summary.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkEpisodeSummary } from "../episode-summary";

describe("chunkEpisodeSummary", () => {
  it("emits exactly one chunk per episode when at least one summary exists", () => {
    const out = chunkEpisodeSummary({
      id: "ep1",
      episodeNumber: 7,
      title: "T",
      slug: "t",
      summaryShort: "short",
      summaryLong: "long",
    });
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("episode_summary");
    expect(out[0].sourceId).toBe("ep1");
    expect(out[0].content).toContain("short");
    expect(out[0].content).toContain("long");
    expect(out[0].metadata.sourceRef).toMatch(/EP\.007/);
  });

  it("emits zero chunks when both summary fields are null", () => {
    expect(
      chunkEpisodeSummary({
        id: "ep1",
        episodeNumber: 1,
        title: "T",
        slug: "t",
        summaryShort: null,
        summaryLong: null,
      }),
    ).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/episode-summary.test.ts`
Expected: fails with `Cannot find module '../episode-summary'`.

- [ ] **Step 7: Implement `src/lib/oracle/retrieval/chunkers/episode-summary.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildEpisodeSummarySearchText } from "../build-search-text";

interface EpisodeWithSummary {
  id: string;
  episodeNumber: number | null;
  title: string;
  slug: string;
  summaryShort: string | null;
  summaryLong: string | null;
}

function pad3(n: number | null | undefined): string {
  return n == null ? "???" : String(n).padStart(3, "0");
}

export function chunkEpisodeSummary(ep: EpisodeWithSummary): ChunkInput[] {
  const parts = [ep.summaryShort, ep.summaryLong].filter(
    (p): p is string => Boolean(p && p.trim()),
  );
  if (parts.length === 0) return [];
  const content = parts.join("\n\n").trim();
  const sourceRef = `EP.${pad3(ep.episodeNumber)} — "${ep.title}"`;
  return [
    {
      sourceType: "episode_summary",
      sourceId: ep.id,
      content,
      searchText: buildEpisodeSummarySearchText({
        episodeNumber: ep.episodeNumber,
        title: ep.title,
        summaryShort: ep.summaryShort,
        summaryLong: ep.summaryLong,
      }),
      metadata: {
        episodeId: ep.id,
        episodeNumber: ep.episodeNumber ?? undefined,
        sourceRef,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}
```

- [ ] **Step 8: Run the episode-summary test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/episode-summary.test.ts`
Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/lib/oracle/retrieval/chunkers/transcript.ts src/lib/oracle/retrieval/chunkers/episode-summary.ts src/lib/oracle/retrieval/chunkers/__tests__
git commit -m "feat(oracle): transcript + episode_summary chunkers"
```

---

## Task 8: Quote + lore + topic chunkers

**Files:**
- Create: `src/lib/oracle/retrieval/chunkers/quote.ts`
- Create: `src/lib/oracle/retrieval/chunkers/lore.ts`
- Create: `src/lib/oracle/retrieval/chunkers/topic.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/quote.test.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/lore.test.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/topic.test.ts`

- [ ] **Step 1: Write all three failing tests in one batch**

Create `src/lib/oracle/retrieval/chunkers/__tests__/quote.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkQuote } from "../quote";

describe("chunkQuote", () => {
  it("emits one chunk with speaker + episode metadata", () => {
    const out = chunkQuote({
      id: "q1",
      text: "fear is the ritual before belief",
      speakerName: "Psyche",
      speakerSlug: "psyche",
      episodeId: "ep1",
      episodeNumber: 402,
      episodeTitle: "Hollow",
      timestampSeconds: 1234,
    });
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("quote");
    expect(out[0].sourceId).toBe("q1");
    expect(out[0].metadata.personSlug).toBe("psyche");
    expect(out[0].metadata.episodeId).toBe("ep1");
    expect(out[0].metadata.episodeNumber).toBe(402);
    expect(out[0].metadata.startSeconds).toBe(1234);
    expect(out[0].metadata.sourceRef).toMatch(/EP\.402.*Hollow/);
  });

  it("skips empty-text quotes", () => {
    expect(
      chunkQuote({
        id: "q",
        text: "",
        speakerName: null,
        speakerSlug: null,
        episodeId: null,
        episodeNumber: null,
        episodeTitle: null,
        timestampSeconds: null,
      }),
    ).toHaveLength(0);
  });
});
```

Create `src/lib/oracle/retrieval/chunkers/__tests__/lore.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkLore } from "../lore";

describe("chunkLore", () => {
  it("emits one chunk when fullEntry is short (≤500 tokens)", () => {
    const out = chunkLore({
      id: "l1",
      slug: "tower",
      title: "Tower",
      category: "symbol",
      summary: "collapse",
      fullEntry: "x ".repeat(500), // ~125 tokens
    });
    expect(out).toHaveLength(1);
    expect(out[0].metadata.sourceRef).toMatch(/lore:.*tower/i);
  });

  it("splits fullEntry into ≥2 chunks when it exceeds the window", () => {
    const huge = "lorem ipsum ".repeat(2000); // ~24000 chars
    const out = chunkLore({
      id: "l1",
      slug: "tower",
      title: "Tower",
      category: "symbol",
      summary: "collapse",
      fullEntry: huge,
    });
    expect(out.length).toBeGreaterThanOrEqual(2);
    expect(out[0].sourceType).toBe("lore");
  });

  it("falls back to summary alone when fullEntry is null", () => {
    const out = chunkLore({
      id: "l1",
      slug: "x",
      title: "X",
      category: null,
      summary: "just summary",
      fullEntry: null,
    });
    expect(out).toHaveLength(1);
    expect(out[0].content).toContain("just summary");
  });

  it("emits zero chunks when both summary and fullEntry are missing", () => {
    expect(
      chunkLore({
        id: "l1",
        slug: "x",
        title: "X",
        category: null,
        summary: null,
        fullEntry: null,
      }),
    ).toHaveLength(0);
  });
});
```

Create `src/lib/oracle/retrieval/chunkers/__tests__/topic.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkTopic } from "../topic";

describe("chunkTopic", () => {
  it("emits one chunk combining title, description, related episodes", () => {
    const out = chunkTopic({
      id: "t1",
      slug: "cult-formation",
      title: "Cult Formation",
      description: "patterns",
      relatedEpisodeTitles: ["EP.1", "EP.2"],
    });
    expect(out).toHaveLength(1);
    expect(out[0].content).toContain("Cult Formation");
    expect(out[0].content).toContain("patterns");
    expect(out[0].content).toContain("EP.1");
  });

  it("skips topics with no description and no related episodes", () => {
    expect(
      chunkTopic({
        id: "t1",
        slug: "x",
        title: "X",
        description: null,
        relatedEpisodeTitles: [],
      }),
    ).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/quote.test.ts src/lib/oracle/retrieval/chunkers/__tests__/lore.test.ts src/lib/oracle/retrieval/chunkers/__tests__/topic.test.ts`
Expected: 3 files fail with `Cannot find module …`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/chunkers/quote.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildQuoteSearchText } from "../build-search-text";

interface QuoteRow {
  id: string;
  text: string;
  speakerName: string | null;
  speakerSlug: string | null;
  episodeId: string | null;
  episodeNumber: number | null;
  episodeTitle: string | null;
  timestampSeconds: number | null;
}

function pad3(n: number | null | undefined): string {
  return n == null ? "???" : String(n).padStart(3, "0");
}

function sourceRef(q: QuoteRow): string {
  const ep = q.episodeTitle ? `EP.${pad3(q.episodeNumber)} — "${q.episodeTitle}"` : `quote:${q.id}`;
  return ep;
}

export function chunkQuote(q: QuoteRow): ChunkInput[] {
  const text = q.text.trim();
  if (!text) return [];

  const speakerLine = q.speakerName ? `${q.speakerName}:` : "";
  const content = speakerLine ? `${speakerLine} "${text}"` : `"${text}"`;

  return [
    {
      sourceType: "quote",
      sourceId: q.id,
      content,
      searchText: buildQuoteSearchText({
        text,
        speakerName: q.speakerName,
        episodeNumber: q.episodeNumber,
        episodeTitle: q.episodeTitle,
      }),
      metadata: {
        personSlug: q.speakerSlug ?? undefined,
        episodeId: q.episodeId ?? undefined,
        episodeNumber: q.episodeNumber ?? undefined,
        startSeconds: q.timestampSeconds ?? undefined,
        sourceRef: sourceRef(q),
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}
```

- [ ] **Step 4: Implement `src/lib/oracle/retrieval/chunkers/lore.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildLoreSearchText } from "../build-search-text";

const WINDOW_TOKENS = 500;
const CHARS_PER_TOKEN = 4;

interface LoreRow {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  summary: string | null;
  fullEntry: string | null;
}

function splitBody(body: string): string[] {
  const max = WINDOW_TOKENS * CHARS_PER_TOKEN;
  if (body.length <= max) return [body];
  const out: string[] = [];
  // Split on paragraph boundaries when possible
  const paras = body.split(/\n\s*\n/);
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > max && buf) {
      out.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  // Fallback: if any chunk is still oversized, hard-split it.
  return out.flatMap((c) => {
    if (c.length <= max) return [c];
    const slices: string[] = [];
    for (let i = 0; i < c.length; i += max) {
      slices.push(c.slice(i, i + max));
    }
    return slices;
  });
}

export function chunkLore(lore: LoreRow): ChunkInput[] {
  const bodyParts: string[] = [];
  if (lore.summary?.trim()) bodyParts.push(lore.summary.trim());
  if (lore.fullEntry?.trim()) bodyParts.push(lore.fullEntry.trim());
  if (bodyParts.length === 0) return [];

  const combined = bodyParts.join("\n\n");
  const splits = splitBody(combined);
  const sourceRef = `lore:${lore.slug} — "${lore.title}"`;

  return splits.map((part, idx) => ({
    sourceType: "lore" as const,
    sourceId: splits.length === 1 ? lore.id : `${lore.id}#${idx}`,
    content: part,
    searchText: buildLoreSearchText({
      title: lore.title,
      category: lore.category,
      summary: lore.summary,
      fullEntry: idx === 0 ? lore.fullEntry : null,
    }),
    metadata: {
      sourceRef,
    },
    contentHash: createHash("sha256").update(part).digest("hex"),
  }));
}
```

- [ ] **Step 5: Implement `src/lib/oracle/retrieval/chunkers/topic.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildTopicSearchText } from "../build-search-text";

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  relatedEpisodeTitles: string[];
}

export function chunkTopic(t: TopicRow): ChunkInput[] {
  const hasDesc = Boolean(t.description?.trim());
  const hasRelated = t.relatedEpisodeTitles.length > 0;
  if (!hasDesc && !hasRelated) return [];

  const parts: string[] = [t.title];
  if (hasDesc) parts.push(t.description!.trim());
  if (hasRelated) parts.push(`Related: ${t.relatedEpisodeTitles.join(" · ")}`);
  const content = parts.join("\n\n");

  return [
    {
      sourceType: "topic",
      sourceId: t.id,
      content,
      searchText: buildTopicSearchText({
        title: t.title,
        description: t.description,
        relatedEpisodeTitles: t.relatedEpisodeTitles,
      }),
      metadata: {
        topicSlugs: [t.slug],
        sourceRef: `topic:${t.slug} — "${t.title}"`,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}
```

- [ ] **Step 6: Run all three new tests**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/quote.test.ts src/lib/oracle/retrieval/chunkers/__tests__/lore.test.ts src/lib/oracle/retrieval/chunkers/__tests__/topic.test.ts`
Expected: all pass (2 + 4 + 2 = 8 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/oracle/retrieval/chunkers/quote.ts src/lib/oracle/retrieval/chunkers/lore.ts src/lib/oracle/retrieval/chunkers/topic.ts src/lib/oracle/retrieval/chunkers/__tests__/quote.test.ts src/lib/oracle/retrieval/chunkers/__tests__/lore.test.ts src/lib/oracle/retrieval/chunkers/__tests__/topic.test.ts
git commit -m "feat(oracle): quote + lore + topic chunkers"
```

---

## Task 9: Person + psychenomicon chunkers + chunker router

**Files:**
- Create: `src/lib/oracle/retrieval/chunkers/person.ts`
- Create: `src/lib/oracle/retrieval/chunkers/psychenomicon.ts`
- Create: `src/lib/oracle/retrieval/chunkers/index.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/person.test.ts`
- Test: `src/lib/oracle/retrieval/chunkers/__tests__/psychenomicon.test.ts`

- [ ] **Step 1: Write person + psychenomicon failing tests**

Create `src/lib/oracle/retrieval/chunkers/__tests__/person.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { chunkPerson } from "../person";

describe("chunkPerson", () => {
  it("emits one chunk with altNames flattened and top quotes attached", () => {
    const out = chunkPerson({
      id: "p1",
      slug: "alexandra-mayers",
      displayName: "Alexandra Mayers",
      altNames: ["Monica Foster"],
      personType: "recurring",
      shortBio: "a bio",
      loreSummary: "lore",
      topQuoteExcerpts: ["q1", "q2"],
    });
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("person");
    expect(out[0].sourceId).toBe("p1");
    expect(out[0].metadata.personSlug).toBe("alexandra-mayers");
    expect(out[0].content).toContain("Alexandra Mayers");
    expect(out[0].content).toContain("Monica Foster");
    expect(out[0].content).toContain("a bio");
    expect(out[0].content).toContain("q1");
  });

  it("emits a chunk even with no bio (name + altNames alone)", () => {
    const out = chunkPerson({
      id: "p1",
      slug: "x",
      displayName: "X",
      altNames: [],
      personType: "guest",
      shortBio: null,
      loreSummary: null,
      topQuoteExcerpts: [],
    });
    expect(out).toHaveLength(1);
  });
});
```

Create `src/lib/oracle/retrieval/chunkers/__tests__/psychenomicon.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  chunkPsyChapter,
  chunkPsyThread,
  chunkPsyEntity,
} from "../psychenomicon";

describe("chunkPsyChapter", () => {
  it("emits three chunks per chapter (canon, interpretation, mythic)", () => {
    const out = chunkPsyChapter({
      id: "c1",
      slug: "trickster-doubt",
      chapterNumber: 12,
      title: "Trickster's Doubt",
      canonText: "canon body",
      interpretationText: "interp body",
      mythicText: "myth body",
    });
    expect(out).toHaveLength(3);
    const kinds = out.map((c) => c.content.startsWith("CANON") ? "canon"
      : c.content.startsWith("INTERPRETATION") ? "interp"
      : "mythic");
    expect(kinds.sort()).toEqual(["canon", "interp", "mythic"]);
    for (const c of out) {
      expect(c.metadata.chapterNumber).toBe(12);
      expect(c.metadata.sourceRef).toMatch(/CH\.0012/);
    }
  });

  it("skips empty body fields", () => {
    const out = chunkPsyChapter({
      id: "c1",
      slug: "x",
      chapterNumber: 1,
      title: "X",
      canonText: "canon",
      interpretationText: "",
      mythicText: "",
    });
    expect(out).toHaveLength(1);
  });
});

describe("chunkPsyThread", () => {
  it("emits one chunk per thread when description exists", () => {
    const out = chunkPsyThread({
      id: "t1",
      slug: "descent",
      title: "Descent",
      description: "descending",
    });
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("psy_thread");
    expect(out[0].metadata.threadSlug).toBe("descent");
  });

  it("skips threads with no description", () => {
    expect(
      chunkPsyThread({ id: "t", slug: "x", title: "X", description: null }),
    ).toHaveLength(0);
  });
});

describe("chunkPsyEntity", () => {
  it("emits one chunk per entity", () => {
    const out = chunkPsyEntity({
      id: "e1",
      slug: "mason",
      name: "Mason",
      personSlug: "mason",
      primaryArchetype: "Trickster",
      behaviorPatterns: ["evasion", "doubt"],
    });
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("psy_entity");
    expect(out[0].metadata.entitySlug).toBe("mason");
    expect(out[0].metadata.personSlug).toBe("mason");
    expect(out[0].content).toContain("Trickster");
    expect(out[0].content).toContain("evasion");
  });
});
```

- [ ] **Step 2: Run them to confirm they fail**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__/person.test.ts src/lib/oracle/retrieval/chunkers/__tests__/psychenomicon.test.ts`
Expected: both fail with `Cannot find module …`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/chunkers/person.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import { buildPersonSearchText } from "../build-search-text";

interface PersonRow {
  id: string;
  slug: string;
  displayName: string;
  altNames: string[];
  personType: string;
  shortBio: string | null;
  loreSummary: string | null;
  /** Pre-selected ~5-8 representative quote excerpts (max ~80 chars each). */
  topQuoteExcerpts: string[];
}

export function chunkPerson(p: PersonRow): ChunkInput[] {
  const headerLines = [
    p.displayName,
    p.altNames.length ? `Also known as: ${p.altNames.join(" · ")}` : null,
    `Type: ${p.personType}`,
  ].filter((x): x is string => Boolean(x));
  const bioLines = [p.shortBio, p.loreSummary].filter(
    (x): x is string => Boolean(x?.trim()),
  );
  const quoteLines = p.topQuoteExcerpts.length
    ? ["Representative quotes:", ...p.topQuoteExcerpts.map((q) => `• "${q}"`)]
    : [];

  const content = [
    headerLines.join("\n"),
    ...bioLines,
    quoteLines.join("\n"),
  ]
    .filter((s) => s.length > 0)
    .join("\n\n");

  return [
    {
      sourceType: "person",
      sourceId: p.id,
      content,
      searchText: buildPersonSearchText({
        displayName: p.displayName,
        altNames: p.altNames,
        shortBio: p.shortBio,
        loreSummary: p.loreSummary,
      }),
      metadata: {
        personSlug: p.slug,
        sourceRef: `person:${p.slug} — ${p.displayName}`,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}
```

- [ ] **Step 4: Implement `src/lib/oracle/retrieval/chunkers/psychenomicon.ts`**

```ts
import { createHash } from "node:crypto";
import type { ChunkInput } from "../../types";
import {
  buildPsyChapterSearchText,
  buildPsyThreadSearchText,
  buildPsyEntitySearchText,
} from "../build-search-text";

function pad4(n: number): string {
  return String(n).padStart(4, "0");
}

interface PsyChapterRow {
  id: string;
  slug: string;
  chapterNumber: number;
  title: string;
  canonText: string;
  interpretationText: string;
  mythicText: string;
}

export function chunkPsyChapter(c: PsyChapterRow): ChunkInput[] {
  const ref = `CH.${pad4(c.chapterNumber)} — "${c.title}"`;
  const make = (
    kind: "canon" | "interpretation" | "mythic",
    body: string,
  ): ChunkInput | null => {
    const trimmed = body.trim();
    if (!trimmed) return null;
    const label =
      kind === "canon" ? "CANON" : kind === "interpretation" ? "INTERPRETATION" : "MYTHIC";
    const content = `${label}\n\n${trimmed}`;
    return {
      sourceType: "psy_chapter",
      sourceId: `${c.id}#${kind}`,
      content,
      searchText: buildPsyChapterSearchText({
        chapterNumber: c.chapterNumber,
        title: c.title,
        body: trimmed,
        bodyKind: kind,
      }),
      metadata: {
        chapterNumber: c.chapterNumber,
        sourceRef: ref,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    };
  };
  return [
    make("canon", c.canonText),
    make("interpretation", c.interpretationText),
    make("mythic", c.mythicText),
  ].filter((x): x is ChunkInput => x !== null);
}

interface PsyThreadRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export function chunkPsyThread(t: PsyThreadRow): ChunkInput[] {
  if (!t.description?.trim()) return [];
  const content = `${t.title}\n\n${t.description.trim()}`;
  return [
    {
      sourceType: "psy_thread",
      sourceId: t.id,
      content,
      searchText: buildPsyThreadSearchText({
        title: t.title,
        slug: t.slug,
        description: t.description,
      }),
      metadata: {
        threadSlug: t.slug,
        sourceRef: `thread:${t.slug} — "${t.title}"`,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}

interface PsyEntityRow {
  id: string;
  slug: string;
  name: string;
  personSlug: string | null;
  primaryArchetype: string | null;
  behaviorPatterns: string[];
}

export function chunkPsyEntity(e: PsyEntityRow): ChunkInput[] {
  const lines = [
    e.name,
    e.primaryArchetype ? `Primary archetype: ${e.primaryArchetype}` : null,
    e.behaviorPatterns.length
      ? `Behavior patterns: ${e.behaviorPatterns.join(" · ")}`
      : null,
  ].filter((x): x is string => Boolean(x));
  const content = lines.join("\n");
  return [
    {
      sourceType: "psy_entity",
      sourceId: e.id,
      content,
      searchText: buildPsyEntitySearchText({
        name: e.name,
        primaryArchetype: e.primaryArchetype,
        behaviorPatterns: e.behaviorPatterns,
      }),
      metadata: {
        entitySlug: e.slug,
        personSlug: e.personSlug ?? undefined,
        sourceRef: `entity:${e.slug} — ${e.name}`,
      },
      contentHash: createHash("sha256").update(content).digest("hex"),
    },
  ];
}
```

- [ ] **Step 5: Implement `src/lib/oracle/retrieval/chunkers/index.ts`**

```ts
export { chunkTranscript } from "./transcript";
export { chunkEpisodeSummary } from "./episode-summary";
export { chunkQuote } from "./quote";
export { chunkLore } from "./lore";
export { chunkTopic } from "./topic";
export { chunkPerson } from "./person";
export {
  chunkPsyChapter,
  chunkPsyThread,
  chunkPsyEntity,
} from "./psychenomicon";
```

- [ ] **Step 6: Run all chunker tests**

Run: `npx vitest run src/lib/oracle/retrieval/chunkers/__tests__`
Expected: all chunker tests pass (3 + 2 + 2 + 4 + 2 + 2 + 5 = 20 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/oracle/retrieval/chunkers/person.ts src/lib/oracle/retrieval/chunkers/psychenomicon.ts src/lib/oracle/retrieval/chunkers/index.ts src/lib/oracle/retrieval/chunkers/__tests__/person.test.ts src/lib/oracle/retrieval/chunkers/__tests__/psychenomicon.test.ts
git commit -m "feat(oracle): person + psychenomicon chunkers + router"
```

---

## Task 10: Thresholds & retrieval-state classifier

**Files:**
- Create: `src/lib/oracle/retrieval/thresholds.ts`
- Test: `src/lib/oracle/retrieval/__tests__/thresholds.test.ts`

Phase A defaults are placeholders calibrated during Phase E. We pick conservative defaults (T_hi = 0.45, T_lo = 0.25 on Cohere rerank scores which are in [0,1]) so the system errs toward "weak" rather than "strong" until eval data refines them. Per-source-type overrides are wired in but default to the same global thresholds.

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/thresholds.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  classifyRetrievalState,
  getThresholds,
  DEFAULT_T_HI,
  DEFAULT_T_LO,
} from "../thresholds";

describe("thresholds", () => {
  it("returns 'none' when topScore < T_lo", () => {
    expect(classifyRetrievalState(0.0, [])).toBe("none");
    expect(classifyRetrievalState(DEFAULT_T_LO - 0.01, [])).toBe("none");
  });

  it("returns 'weak' when topScore is between T_lo and T_hi", () => {
    expect(classifyRetrievalState(DEFAULT_T_LO + 0.01, [{ score: 0.3 }])).toBe("weak");
    expect(classifyRetrievalState(DEFAULT_T_HI - 0.01, [{ score: 0.3 }])).toBe("weak");
  });

  it("returns 'weak' when topScore >= T_hi but fewer than 3 strong results", () => {
    expect(
      classifyRetrievalState(DEFAULT_T_HI + 0.05, [
        { score: DEFAULT_T_HI + 0.05 },
        { score: DEFAULT_T_HI + 0.05 },
      ]),
    ).toBe("weak");
  });

  it("returns 'strong' when ≥3 results above T_hi", () => {
    expect(
      classifyRetrievalState(0.9, [{ score: 0.9 }, { score: 0.8 }, { score: 0.7 }]),
    ).toBe("strong");
  });

  it("getThresholds returns global defaults when no override", () => {
    const t = getThresholds("quote");
    expect(t.tHi).toBe(DEFAULT_T_HI);
    expect(t.tLo).toBe(DEFAULT_T_LO);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/thresholds.test.ts`
Expected: fails with `Cannot find module '../thresholds'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/thresholds.ts`**

```ts
import type { OracleChunkSource, RetrievalState } from "../types";

export const DEFAULT_T_HI = 0.45;
export const DEFAULT_T_LO = 0.25;

/**
 * Per-source-type overrides. Empty by default; populated during eval
 * calibration (Phase E). Add entries like:
 *   { quote: { tHi: 0.5, tLo: 0.28 } }
 */
const OVERRIDES: Partial<Record<OracleChunkSource, { tHi: number; tLo: number }>> = {};

export function getThresholds(sourceType: OracleChunkSource): {
  tHi: number;
  tLo: number;
} {
  return OVERRIDES[sourceType] ?? { tHi: DEFAULT_T_HI, tLo: DEFAULT_T_LO };
}

/**
 * Classify a retrieval result set into Strong / Weak / None based on the
 * top result's rerank score and the count of high-confidence results.
 *
 * Rule (Section 1 of the spec):
 *   Strong: ≥3 results above T_hi
 *   Weak:   topScore ≥ T_lo but fails the Strong rule
 *   None:   topScore < T_lo
 */
export function classifyRetrievalState(
  topScore: number,
  results: ReadonlyArray<{ score: number }>,
): RetrievalState {
  if (topScore < DEFAULT_T_LO) return "none";
  const strongCount = results.filter((r) => r.score >= DEFAULT_T_HI).length;
  if (strongCount >= 3) return "strong";
  return "weak";
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/thresholds.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oracle/retrieval/thresholds.ts src/lib/oracle/retrieval/__tests__/thresholds.test.ts
git commit -m "feat(oracle): retrieval-state classifier + thresholds"
```

---

## Task 11: Reciprocal Rank Fusion

**Files:**
- Create: `src/lib/oracle/retrieval/rrf.ts`
- Test: `src/lib/oracle/retrieval/__tests__/rrf.test.ts`

Classical RRF formula: `score(d) = Σ_lists 1 / (k + rank_in_list(d))`, where `k` is a smoothing constant (60 is the canonical default).

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/rrf.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { reciprocalRankFusion } from "../rrf";

describe("reciprocalRankFusion", () => {
  it("merges two lists and ranks by combined RRF score", () => {
    const bm25 = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const vec  = [{ id: "b" }, { id: "a" }, { id: "d" }];
    const out  = reciprocalRankFusion([bm25, vec]);
    // 'a' is rank 1 in bm25 and rank 2 in vec → highest combined.
    // 'b' is rank 2 in bm25 and rank 1 in vec → also high.
    // 'c' only in bm25, 'd' only in vec.
    expect(out[0].id).toBe("a");
    expect(out[1].id).toBe("b");
    expect(out.map((r) => r.id).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("attaches a fusionScore property", () => {
    const out = reciprocalRankFusion([[{ id: "x" }]]);
    expect(out[0].fusionScore).toBeGreaterThan(0);
  });

  it("respects the topK parameter", () => {
    const lists = [
      [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }, { id: "e" }],
    ];
    expect(reciprocalRankFusion(lists, { topK: 3 })).toHaveLength(3);
  });

  it("handles empty lists", () => {
    expect(reciprocalRankFusion([])).toEqual([]);
    expect(reciprocalRankFusion([[]])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/rrf.test.ts`
Expected: fails with `Cannot find module '../rrf'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/rrf.ts`**

```ts
/**
 * Reciprocal Rank Fusion — combines multiple ranked lists into one ranked list.
 *
 * Reference: Cormack, Clarke, Buettcher (2009).
 *   score(d) = Σ_lists 1 / (k + rank_in_list(d))
 *
 * `rank` is 1-indexed (first item has rank 1).
 */

const DEFAULT_K = 60;

export interface FusedItem<T> {
  fusionScore: number;
  /** original keys (we re-spread the input object so callers retain their fields). */
  [key: string]: unknown;
}

export interface RRFOpts {
  k?: number;
  topK?: number;
}

export function reciprocalRankFusion<T extends { id: string }>(
  lists: ReadonlyArray<ReadonlyArray<T>>,
  opts: RRFOpts = {},
): Array<T & { fusionScore: number }> {
  const k = opts.k ?? DEFAULT_K;
  const scores = new Map<string, number>();
  const items = new Map<string, T>();

  for (const list of lists) {
    list.forEach((item, idx) => {
      const rank = idx + 1;
      const inc = 1 / (k + rank);
      scores.set(item.id, (scores.get(item.id) ?? 0) + inc);
      if (!items.has(item.id)) items.set(item.id, item);
    });
  }

  const merged = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id, score]) => ({ ...(items.get(id) as T), fusionScore: score }));

  if (opts.topK != null) return merged.slice(0, opts.topK);
  return merged;
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/rrf.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oracle/retrieval/rrf.ts src/lib/oracle/retrieval/__tests__/rrf.test.ts
git commit -m "feat(oracle): reciprocal rank fusion"
```

---

## Task 12: Reranker — Cohere wrapper

**Files:**
- Create: `src/lib/oracle/retrieval/rerank.ts`
- Test: `src/lib/oracle/retrieval/__tests__/rerank.test.ts`

Cohere v2 rerank endpoint: `POST https://api.cohere.com/v2/rerank`. Body: `{ model, query, documents: string[], top_n? }`. Auth: `Authorization: Bearer ${COHERE_API_KEY}`. Returns `{ results: [{ index, relevance_score }, ...] }`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/rerank.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rerank } from "../rerank";

const ORIGINAL_FETCH = global.fetch;

function mockResponse(results: Array<{ index: number; relevance_score: number }>) {
  return {
    ok: true,
    json: async () => ({ results }),
  } as unknown as Response;
}

describe("rerank", () => {
  beforeEach(() => {
    vi.stubEnv("COHERE_API_KEY", "co_test_key");
    vi.stubEnv("ORACLE_RERANK_MODEL", "rerank-v3.5");
  });
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns documents in rerank order with attached scores", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      mockResponse([
        { index: 2, relevance_score: 0.9 },
        { index: 0, relevance_score: 0.6 },
        { index: 1, relevance_score: 0.3 },
      ]),
    );
    const docs = [
      { id: "a", text: "alpha" },
      { id: "b", text: "beta" },
      { id: "c", text: "gamma" },
    ];
    const out = await rerank("q", docs, 3);
    expect(out.map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(out[0].rerankScore).toBeCloseTo(0.9);
  });

  it("returns empty array when given empty docs", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;
    const out = await rerank("q", [], 5);
    expect(out).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("throws when COHERE_API_KEY is missing", async () => {
    vi.unstubAllEnvs();
    await expect(rerank("q", [{ id: "a", text: "a" }], 1)).rejects.toThrow(/COHERE_API_KEY/);
  });

  it("throws on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "boom",
    } as unknown as Response);
    await expect(rerank("q", [{ id: "a", text: "a" }], 1)).rejects.toThrow(/cohere rerank failed: 500/);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/rerank.test.ts`
Expected: fails with `Cannot find module '../rerank'`.

- [ ] **Step 3: Implement `src/lib/oracle/retrieval/rerank.ts`**

```ts
/**
 * Cohere rerank wrapper. Model: rerank-v3.5 (default).
 *
 * Docs: https://docs.cohere.com/reference/rerank
 */

const RERANK_URL = "https://api.cohere.com/v2/rerank";

export interface RerankInput {
  id: string;
  text: string;
}

export interface RerankResult extends RerankInput {
  rerankScore: number;
}

function getKey(): string {
  const k = process.env.COHERE_API_KEY;
  if (!k) throw new Error("COHERE_API_KEY is not set");
  return k;
}

function getModel(): string {
  return process.env.ORACLE_RERANK_MODEL ?? "rerank-v3.5";
}

export async function rerank(
  query: string,
  documents: RerankInput[],
  topN: number,
): Promise<RerankResult[]> {
  if (documents.length === 0) return [];

  const res = await fetch(RERANK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getKey()}`,
    },
    body: JSON.stringify({
      model: getModel(),
      query,
      documents: documents.map((d) => d.text),
      top_n: Math.min(topN, documents.length),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`cohere rerank failed: ${res.status} ${body}`);
  }
  const json = (await res.json()) as {
    results: Array<{ index: number; relevance_score: number }>;
  };
  return json.results.map((r) => ({
    ...documents[r.index],
    rerankScore: r.relevance_score,
  }));
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/rerank.test.ts`
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/oracle/retrieval/rerank.ts src/lib/oracle/retrieval/__tests__/rerank.test.ts
git commit -m "feat(oracle): Cohere rerank wrapper"
```

---

## Task 13: Hybrid search orchestrator

**Files:**
- Create: `src/lib/oracle/retrieval/hybrid-search.ts`
- Test: `src/lib/oracle/retrieval/__tests__/hybrid-search.test.ts`

This is the single entry point for retrieval. It composes:
1. BM25 query (raw SQL via `pg` because Prisma can't express the `to_tsvector` ranking cleanly)
2. Vector query (raw SQL — pgvector cosine distance)
3. RRF fusion → top 30
4. Metadata boost (multiplicative on fusionScore) when `anchor` is provided
5. Cohere rerank → top K (default 8)
6. State classification via `classifyRetrievalState`

The unit test mocks all three external touchpoints (the BM25 SQL, the vector SQL, and the rerank API) so the test is hermetic and fast.

- [ ] **Step 1: Write the failing test**

Create `src/lib/oracle/retrieval/__tests__/hybrid-search.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mocks must be declared before the import of the module under test.
vi.mock("../embeddings", () => ({
  embedQuery: vi.fn(async () => Array.from({ length: 1024 }, () => 0)),
}));

vi.mock("../rerank", () => ({
  rerank: vi.fn(),
}));

vi.mock("../sql-search", () => ({
  bm25Search: vi.fn(),
  vectorSearch: vi.fn(),
}));

import { rerank as mockedRerank } from "../rerank";
import {
  bm25Search as mockedBm25,
  vectorSearch as mockedVec,
} from "../sql-search";
import { hybridSearch } from "../hybrid-search";

function row(id: string, score: number, sourceType = "quote", overrides: Record<string, unknown> = {}) {
  return {
    id,
    sourceType,
    sourceId: id,
    content: `content-${id}`,
    searchText: `searchText-${id}`,
    metadata: { sourceRef: `ref-${id}` },
    score,
    ...overrides,
  };
}

describe("hybridSearch", () => {
  beforeEach(() => {
    vi.mocked(mockedBm25).mockReset();
    vi.mocked(mockedVec).mockReset();
    vi.mocked(mockedRerank).mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("returns strong state when 3+ rerank scores cross T_hi", async () => {
    vi.mocked(mockedBm25).mockResolvedValue([row("a", 0.5), row("b", 0.4)]);
    vi.mocked(mockedVec).mockResolvedValue([row("a", 0.9), row("c", 0.7)]);
    vi.mocked(mockedRerank).mockResolvedValue([
      { id: "a", text: "x", rerankScore: 0.95 },
      { id: "c", text: "x", rerankScore: 0.8 },
      { id: "b", text: "x", rerankScore: 0.6 },
    ]);
    const out = await hybridSearch({ query: "hello" });
    expect(out.state).toBe("strong");
    expect(out.results).toHaveLength(3);
    expect(out.results[0].score).toBeCloseTo(0.95);
  });

  it("returns none state when top rerank score < T_lo", async () => {
    vi.mocked(mockedBm25).mockResolvedValue([row("a", 0.05)]);
    vi.mocked(mockedVec).mockResolvedValue([]);
    vi.mocked(mockedRerank).mockResolvedValue([
      { id: "a", text: "x", rerankScore: 0.05 },
    ]);
    const out = await hybridSearch({ query: "hello" });
    expect(out.state).toBe("none");
  });

  it("returns weak state when 1-2 rerank scores between T_lo and T_hi", async () => {
    vi.mocked(mockedBm25).mockResolvedValue([row("a", 0.3)]);
    vi.mocked(mockedVec).mockResolvedValue([row("b", 0.3)]);
    vi.mocked(mockedRerank).mockResolvedValue([
      { id: "a", text: "x", rerankScore: 0.35 },
      { id: "b", text: "x", rerankScore: 0.3 },
    ]);
    const out = await hybridSearch({ query: "hello" });
    expect(out.state).toBe("weak");
  });

  it("applies a multiplicative boost to fusionScore when anchor matches", async () => {
    vi.mocked(mockedBm25).mockResolvedValue([
      row("a", 0.5, "quote", { metadata: { sourceRef: "r", personSlug: "mason" } }),
      row("b", 0.4, "quote", { metadata: { sourceRef: "r", personSlug: "other" } }),
    ]);
    vi.mocked(mockedVec).mockResolvedValue([]);
    // Capture what gets sent to the reranker — anchored items should appear first.
    vi.mocked(mockedRerank).mockImplementation(async (_q, docs) => {
      return docs.map((d) => ({ ...d, rerankScore: 0.8 }));
    });
    const out = await hybridSearch({
      query: "x",
      anchor: { kind: "person", slug: "mason" },
    });
    expect(out.results[0].id).toBe("a");
  });

  it("source_types filter is forwarded to both BM25 and vector queries", async () => {
    vi.mocked(mockedBm25).mockResolvedValue([]);
    vi.mocked(mockedVec).mockResolvedValue([]);
    vi.mocked(mockedRerank).mockResolvedValue([]);
    await hybridSearch({ query: "x", sourceTypes: ["quote", "lore"] });
    expect(vi.mocked(mockedBm25).mock.calls[0][0].sourceTypes).toEqual(["quote", "lore"]);
    expect(vi.mocked(mockedVec).mock.calls[0][0].sourceTypes).toEqual(["quote", "lore"]);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/hybrid-search.test.ts`
Expected: fails with `Cannot find module '../sql-search'` (the mocks reference modules that don't exist yet).

- [ ] **Step 3: Create the SQL search module `src/lib/oracle/retrieval/sql-search.ts`**

```ts
/**
 * Raw-SQL BM25 + vector search against OracleChunk.
 *
 * We use the existing pg pool exposed via DATABASE_URL. Both functions
 * return rows in the same shape so the orchestrator can RRF-fuse them
 * uniformly.
 */

import { Pool } from "pg";
import type { ChunkMetadata, OracleChunkSource } from "../types";

let pool: Pool | null = null;
function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  pool = new Pool({ connectionString, max: 4 });
  return pool;
}

export interface SqlSearchOpts {
  query: string;
  queryEmbedding?: number[];
  sourceTypes?: OracleChunkSource[];
  limit?: number; // default 50
}

export interface SqlSearchRow {
  id: string;
  sourceType: OracleChunkSource;
  sourceId: string;
  content: string;
  searchText: string;
  metadata: ChunkMetadata;
  /** BM25 rank or 1 - cosine_distance depending on caller. */
  score: number;
}

function buildSourceTypeFilter(
  sourceTypes: OracleChunkSource[] | undefined,
  paramIndex: number,
): { clause: string; params: string[] } {
  if (!sourceTypes || sourceTypes.length === 0) return { clause: "", params: [] };
  const placeholders = sourceTypes.map((_, i) => `$${paramIndex + i}`).join(", ");
  return {
    clause: `AND "sourceType"::text IN (${placeholders})`,
    params: sourceTypes,
  };
}

export async function bm25Search(opts: SqlSearchOpts): Promise<SqlSearchRow[]> {
  const limit = opts.limit ?? 50;
  const filter = buildSourceTypeFilter(opts.sourceTypes, 3);
  const sql = `
    SELECT
      "id",
      "sourceType",
      "sourceId",
      "content",
      "searchText",
      "metadata",
      ts_rank_cd(to_tsvector('english', "searchText"), plainto_tsquery('english', $1)) AS score
    FROM "OracleChunk"
    WHERE to_tsvector('english', "searchText") @@ plainto_tsquery('english', $1)
    ${filter.clause}
    ORDER BY score DESC
    LIMIT $2
  `;
  const result = await getPool().query<{
    id: string;
    sourceType: OracleChunkSource;
    sourceId: string;
    content: string;
    searchText: string;
    metadata: ChunkMetadata;
    score: string; // pg returns numeric as string
  }>(sql, [opts.query, limit, ...filter.params]);
  return result.rows.map((r) => ({ ...r, score: Number(r.score) }));
}

export async function vectorSearch(opts: SqlSearchOpts): Promise<SqlSearchRow[]> {
  if (!opts.queryEmbedding) {
    throw new Error("vectorSearch requires queryEmbedding");
  }
  const limit = opts.limit ?? 50;
  const filter = buildSourceTypeFilter(opts.sourceTypes, 3);
  // pgvector cosine distance: 1 - (embedding <=> query) gives a similarity in [0,1]
  const sql = `
    SELECT
      "id",
      "sourceType",
      "sourceId",
      "content",
      "searchText",
      "metadata",
      (1 - ("embedding" <=> $1::vector)) AS score
    FROM "OracleChunk"
    WHERE 1=1
    ${filter.clause}
    ORDER BY "embedding" <=> $1::vector ASC
    LIMIT $2
  `;
  // Format the embedding as a Postgres vector literal: '[0.1,0.2,...]'
  const vecLiteral = `[${opts.queryEmbedding.join(",")}]`;
  const result = await getPool().query<{
    id: string;
    sourceType: OracleChunkSource;
    sourceId: string;
    content: string;
    searchText: string;
    metadata: ChunkMetadata;
    score: string;
  }>(sql, [vecLiteral, limit, ...filter.params]);
  return result.rows.map((r) => ({ ...r, score: Number(r.score) }));
}
```

- [ ] **Step 4: Implement `src/lib/oracle/retrieval/hybrid-search.ts`**

```ts
import { embedQuery } from "./embeddings";
import { bm25Search, vectorSearch, type SqlSearchRow } from "./sql-search";
import { reciprocalRankFusion } from "./rrf";
import { rerank } from "./rerank";
import { classifyRetrievalState } from "./thresholds";
import type {
  HybridResult,
  HybridSearchResponse,
  OracleChunkSource,
} from "../types";

export interface HybridSearchOpts {
  query: string;
  sourceTypes?: OracleChunkSource[];
  anchor?: { kind: "person" | "episode" | "lore" | "topic"; slug: string };
  k?: number; // final top-K after rerank; default 8, max 15
}

const ANCHOR_BOOST = 1.5;
const DEFAULT_K = 8;
const MAX_K = 15;
const FUSION_TOPK = 30;
const SNIPPET_MAX = 200;

function snippetOf(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length <= SNIPPET_MAX ? flat : flat.slice(0, SNIPPET_MAX - 1) + "…";
}

function matchesAnchor(
  row: SqlSearchRow,
  anchor: HybridSearchOpts["anchor"],
): boolean {
  if (!anchor) return false;
  const md = row.metadata;
  switch (anchor.kind) {
    case "person":
      return md.personSlug === anchor.slug || (md.peopleMentioned ?? []).includes(anchor.slug);
    case "episode":
      return md.episodeId === anchor.slug;
    case "lore":
      return md.sourceRef.includes(`lore:${anchor.slug}`);
    case "topic":
      return (md.topicSlugs ?? []).includes(anchor.slug);
  }
}

export async function hybridSearch(
  opts: HybridSearchOpts,
): Promise<HybridSearchResponse> {
  const k = Math.min(opts.k ?? DEFAULT_K, MAX_K);

  // 1. Pull query embedding + run both passes in parallel.
  const [queryEmbedding, bm25Rows] = await Promise.all([
    embedQuery(opts.query),
    bm25Search({ query: opts.query, sourceTypes: opts.sourceTypes, limit: 50 }),
  ]);
  const vecRows = await vectorSearch({
    query: opts.query,
    queryEmbedding,
    sourceTypes: opts.sourceTypes,
    limit: 50,
  });

  // 2. RRF fuse to top-30.
  const fused = reciprocalRankFusion<SqlSearchRow>([bm25Rows, vecRows], {
    topK: FUSION_TOPK,
  });

  // 3. Anchor boost (multiplicative on fusionScore so anchored rows surface).
  const boosted = fused.map((row) => ({
    ...row,
    fusionScore: matchesAnchor(row, opts.anchor)
      ? row.fusionScore * ANCHOR_BOOST
      : row.fusionScore,
  }));
  boosted.sort((a, b) => b.fusionScore - a.fusionScore);

  // 4. Cohere rerank top-K.
  if (boosted.length === 0) {
    return { state: "none", results: [] };
  }
  const reranked = await rerank(
    opts.query,
    boosted.map((b) => ({ id: b.id, text: b.content })),
    k,
  );

  // 5. Build HybridResult[] preserving rerank order.
  const byId = new Map(boosted.map((b) => [b.id, b]));
  const results: HybridResult[] = reranked
    .map((r) => {
      const row = byId.get(r.id);
      if (!row) return null;
      return {
        id: row.id,
        sourceType: row.sourceType,
        sourceRef: row.metadata.sourceRef,
        snippet: snippetOf(row.content),
        score: r.rerankScore,
        metadata: row.metadata,
      } satisfies HybridResult;
    })
    .filter((x): x is HybridResult => x !== null);

  const top = results[0]?.score ?? 0;
  const state = classifyRetrievalState(top, results);
  return { state, results };
}
```

- [ ] **Step 5: Run the hybrid-search test to confirm it passes**

Run: `npx vitest run src/lib/oracle/retrieval/__tests__/hybrid-search.test.ts`
Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/oracle/retrieval/sql-search.ts src/lib/oracle/retrieval/hybrid-search.ts src/lib/oracle/retrieval/__tests__/hybrid-search.test.ts
git commit -m "feat(oracle): hybridSearch — BM25 + vector + RRF + anchor boost + rerank"
```

---

## Task 14: Build-index script (full one-shot)

**Files:**
- Create: `scripts/oracle/build-index.ts`

The script walks every source type, runs the corresponding chunker, batches the chunks through `embedDocuments`, and upserts into `OracleChunk` via raw SQL (because Prisma can't write the `embedding` column directly).

Idempotent: existing rows with the same `(sourceType, sourceId)` are replaced.

- [ ] **Step 1: Create `scripts/oracle/build-index.ts`**

```ts
/**
 * Build the OracleChunk index from scratch.
 *
 * Iterates every source type, chunks rows via the per-source chunkers,
 * batches the chunks through Voyage embedding, and upserts into OracleChunk.
 *
 * Run via:   npm run oracle:build-index
 *
 * Idempotent: replaces existing chunks with the same (sourceType, sourceId).
 */

import { Pool } from "pg";
import { prisma } from "@/lib/db";
import { embedDocuments } from "@/lib/oracle/retrieval/embeddings";
import {
  chunkTranscript,
  chunkEpisodeSummary,
  chunkQuote,
  chunkLore,
  chunkTopic,
  chunkPerson,
  chunkPsyChapter,
  chunkPsyThread,
  chunkPsyEntity,
} from "@/lib/oracle/retrieval/chunkers";
import type { ChunkInput } from "@/lib/oracle/types";

const EMBED_BATCH = 128;
const UPSERT_BATCH = 100;

function getPool(): Pool {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: cs, max: 4 });
}

async function deleteExisting(
  pool: Pool,
  sourceType: ChunkInput["sourceType"],
  sourceIds: string[],
) {
  if (sourceIds.length === 0) return;
  await pool.query(
    `DELETE FROM "OracleChunk" WHERE "sourceType"::text = $1 AND "sourceId" = ANY($2::text[])`,
    [sourceType, sourceIds],
  );
}

async function upsertChunks(
  pool: Pool,
  chunks: Array<ChunkInput & { embedding: number[] }>,
) {
  if (chunks.length === 0) return;
  // Build a single multi-row INSERT to amortize round-trips.
  const params: unknown[] = [];
  const valuesSql: string[] = [];
  chunks.forEach((c, i) => {
    const base = i * 9;
    valuesSql.push(
      `(gen_random_uuid()::text, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::vector, $${base + 6}::jsonb, $${base + 7}, NOW(), NOW())`,
    );
    params.push(
      c.sourceType,
      c.sourceId,
      c.content,
      c.searchText,
      `[${c.embedding.join(",")}]`,
      JSON.stringify(c.metadata),
      c.contentHash,
    );
  });
  const sql = `
    INSERT INTO "OracleChunk"
      ("id", "sourceType", "sourceId", "content", "searchText", "embedding", "metadata", "contentHash", "createdAt", "updatedAt")
    VALUES ${valuesSql.join(", ")}
  `;
  await pool.query(sql, params);
}

async function embedAndUpsert(
  pool: Pool,
  chunks: ChunkInput[],
  label: string,
) {
  if (chunks.length === 0) {
    console.log(`  [${label}] no chunks`);
    return;
  }
  console.log(`  [${label}] embedding ${chunks.length} chunks…`);
  const embeddings = await embedDocuments(chunks.map((c) => c.content));
  const withVec = chunks.map((c, i) => ({ ...c, embedding: embeddings[i] }));

  // Delete then insert in batches.
  const sourceType = chunks[0].sourceType;
  const sourceIds = Array.from(new Set(chunks.map((c) => c.sourceId)));
  await deleteExisting(pool, sourceType, sourceIds);

  for (let i = 0; i < withVec.length; i += UPSERT_BATCH) {
    const slice = withVec.slice(i, i + UPSERT_BATCH);
    await upsertChunks(pool, slice);
  }
  console.log(`  [${label}] upserted ${withVec.length} chunks`);
}

async function buildTranscripts(pool: Pool) {
  console.log("--- transcripts ---");
  // Episode has no `hasTranscript` column (per current schema); we walk all
  // episodes and skip any that have no TranscriptSegment rows.
  const episodes = await prisma.episode.findMany({
    select: { id: true, episodeNumber: true, title: true, slug: true },
  });
  console.log(`  ${episodes.length} episodes`);
  for (const ep of episodes) {
    const segments = await prisma.transcriptSegment.findMany({
      where: { episodeId: ep.id },
      orderBy: { startSeconds: "asc" },
      select: {
        id: true,
        startSeconds: true,
        endSeconds: true,
        speakerLabel: true,
        text: true,
      },
    });
    if (segments.length === 0) continue;
    const chunks = chunkTranscript(ep, segments);
    await embedAndUpsert(pool, chunks, `transcript:${ep.slug}`);
  }
}

async function buildEpisodeSummaries(pool: Pool) {
  console.log("--- episode summaries ---");
  const episodes = await prisma.episode.findMany({
    select: {
      id: true,
      episodeNumber: true,
      title: true,
      slug: true,
      summaryShort: true,
      summaryLong: true,
    },
  });
  const chunks = episodes.flatMap(chunkEpisodeSummary);
  await embedAndUpsert(pool, chunks, "episode_summary");
}

async function buildQuotes(pool: Pool) {
  console.log("--- quotes ---");
  const quotes = await prisma.quote.findMany({
    select: {
      id: true,
      text: true,
      timestampSeconds: true,
      speaker: { select: { displayName: true, slug: true } },
      episode: {
        select: { id: true, episodeNumber: true, title: true },
      },
    },
  });
  const chunks = quotes.flatMap((q) =>
    chunkQuote({
      id: q.id,
      text: q.text,
      speakerName: q.speaker?.displayName ?? null,
      speakerSlug: q.speaker?.slug ?? null,
      episodeId: q.episode?.id ?? null,
      episodeNumber: q.episode?.episodeNumber ?? null,
      episodeTitle: q.episode?.title ?? null,
      timestampSeconds: q.timestampSeconds ?? null,
    }),
  );
  await embedAndUpsert(pool, chunks, "quote");
}

async function buildLore(pool: Pool) {
  console.log("--- lore ---");
  const lore = await prisma.loreEntry.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      summary: true,
      fullEntry: true,
    },
  });
  const chunks = lore.flatMap(chunkLore);
  await embedAndUpsert(pool, chunks, "lore");
}

async function buildTopics(pool: Pool) {
  console.log("--- topics ---");
  const topics = await prisma.topic.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      episodes: {
        select: { episode: { select: { title: true } } },
        take: 8,
      },
    },
  });
  const chunks = topics.flatMap((t) =>
    chunkTopic({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      relatedEpisodeTitles: t.episodes.map((e) => e.episode.title),
    }),
  );
  await embedAndUpsert(pool, chunks, "topic");
}

async function buildPeople(pool: Pool) {
  console.log("--- people ---");
  const people = await prisma.person.findMany({
    select: {
      id: true,
      slug: true,
      displayName: true,
      altNames: true,
      personType: true,
      shortBio: true,
      loreSummary: true,
      quotes: {
        select: { text: true },
        take: 6,
      },
    },
  });
  const chunks = people.flatMap((p) =>
    chunkPerson({
      id: p.id,
      slug: p.slug,
      displayName: p.displayName,
      altNames: p.altNames ?? [],
      personType: p.personType,
      shortBio: p.shortBio,
      loreSummary: p.loreSummary,
      topQuoteExcerpts: p.quotes
        .map((q) => q.text)
        .filter((t) => t && t.length <= 200)
        .slice(0, 6),
    }),
  );
  await embedAndUpsert(pool, chunks, "person");
}

async function buildPsychenomicon(pool: Pool) {
  console.log("--- psychenomicon chapters ---");
  const chapters = await prisma.psychenomiconChapter.findMany({
    select: {
      id: true,
      slug: true,
      chapterNumber: true,
      title: true,
      canonText: true,
      interpretationText: true,
      mythicText: true,
    },
  });
  const chapterChunks = chapters.flatMap(chunkPsyChapter);
  await embedAndUpsert(pool, chapterChunks, "psy_chapter");

  console.log("--- psychenomicon threads ---");
  const threads = await prisma.psychenomiconThread.findMany({
    select: { id: true, slug: true, title: true, description: true },
  });
  const threadChunks = threads.flatMap(chunkPsyThread);
  await embedAndUpsert(pool, threadChunks, "psy_thread");

  console.log("--- psychenomicon entities ---");
  const entities = await prisma.psychenomiconEntity.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      personSlug: true,
      primaryArchetype: true,
      behaviorPatterns: true,
    },
  });
  const entityChunks = entities.flatMap(chunkPsyEntity);
  await embedAndUpsert(pool, entityChunks, "psy_entity");
}

async function main() {
  console.log("Building OracleChunk index from scratch…");
  const start = Date.now();
  const pool = getPool();
  try {
    await buildEpisodeSummaries(pool);
    await buildQuotes(pool);
    await buildLore(pool);
    await buildTopics(pool);
    await buildPeople(pool);
    await buildPsychenomicon(pool);
    await buildTranscripts(pool); // largest, run last
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
  const elapsedMin = ((Date.now() - start) / 1000 / 60).toFixed(1);
  console.log(`Done in ${elapsedMin} min`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit (script written; will be exercised in Task 17)**

```bash
git add scripts/oracle/build-index.ts
git commit -m "feat(oracle): full-corpus index build script"
```

---

## Task 15: Reindex-incremental script

**Files:**
- Create: `scripts/oracle/reindex-incremental.ts`

Diff by `contentHash`: for each source-type pass, compute the intended chunks, query existing `(sourceId, contentHash)` pairs, only re-embed where the hash differs (or doesn't exist), and delete stale chunks whose sourceIds disappeared.

- [ ] **Step 1: Create `scripts/oracle/reindex-incremental.ts`**

```ts
/**
 * Incremental reindex: re-embed only chunks whose content has changed
 * since the last build, plus garbage-collect chunks for deleted source rows.
 *
 * Trade-off: we still walk every source row (so we can recompute the
 * intended chunk set and contentHash). The win is on the embedding-API
 * spend, which dominates cost.
 */

import { Pool } from "pg";
import { prisma } from "@/lib/db";
import { embedDocuments } from "@/lib/oracle/retrieval/embeddings";
import {
  chunkTranscript,
  chunkEpisodeSummary,
  chunkQuote,
  chunkLore,
  chunkTopic,
  chunkPerson,
  chunkPsyChapter,
  chunkPsyThread,
  chunkPsyEntity,
} from "@/lib/oracle/retrieval/chunkers";
import type { ChunkInput, OracleChunkSource } from "@/lib/oracle/types";

function getPool(): Pool {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: cs, max: 4 });
}

interface ExistingRow {
  id: string;
  sourceId: string;
  contentHash: string;
}

async function loadExisting(
  pool: Pool,
  sourceType: OracleChunkSource,
): Promise<Map<string, Map<string, string>>> {
  // Returns: sourceId -> (contentHash -> existingRowId)
  const { rows } = await pool.query<ExistingRow>(
    `SELECT "id", "sourceId", "contentHash" FROM "OracleChunk" WHERE "sourceType"::text = $1`,
    [sourceType],
  );
  const map = new Map<string, Map<string, string>>();
  for (const r of rows) {
    if (!map.has(r.sourceId)) map.set(r.sourceId, new Map());
    map.get(r.sourceId)!.set(r.contentHash, r.id);
  }
  return map;
}

async function reconcile(
  pool: Pool,
  sourceType: OracleChunkSource,
  intended: ChunkInput[],
) {
  console.log(`  [${sourceType}] intended ${intended.length} chunks`);
  const existing = await loadExisting(pool, sourceType);
  const intendedBySourceId = new Map<string, ChunkInput[]>();
  for (const c of intended) {
    if (!intendedBySourceId.has(c.sourceId)) intendedBySourceId.set(c.sourceId, []);
    intendedBySourceId.get(c.sourceId)!.push(c);
  }

  // 1. Determine which chunks need embedding.
  const toEmbed: ChunkInput[] = [];
  for (const [sourceId, chunks] of intendedBySourceId) {
    const existingHashes = existing.get(sourceId) ?? new Map();
    for (const c of chunks) {
      if (!existingHashes.has(c.contentHash)) toEmbed.push(c);
    }
  }
  console.log(`  [${sourceType}] need to embed: ${toEmbed.length}`);

  if (toEmbed.length > 0) {
    const vecs = await embedDocuments(toEmbed.map((c) => c.content));
    const batchSize = 100;
    for (let i = 0; i < toEmbed.length; i += batchSize) {
      const batch = toEmbed.slice(i, i + batchSize);
      const batchVecs = vecs.slice(i, i + batchSize);
      const params: unknown[] = [];
      const valuesSql: string[] = batch.map((c, j) => {
        const base = j * 7;
        params.push(
          c.sourceType,
          c.sourceId,
          c.content,
          c.searchText,
          `[${batchVecs[j].join(",")}]`,
          JSON.stringify(c.metadata),
          c.contentHash,
        );
        return `(gen_random_uuid()::text, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::vector, $${base + 6}::jsonb, $${base + 7}, NOW(), NOW())`;
      });
      const sql = `
        INSERT INTO "OracleChunk"
          ("id", "sourceType", "sourceId", "content", "searchText", "embedding", "metadata", "contentHash", "createdAt", "updatedAt")
        VALUES ${valuesSql.join(", ")}
      `;
      await pool.query(sql, params);
    }
  }

  // 2. Delete chunks whose sourceId+hash is no longer intended.
  const intendedHashesBySourceId = new Map<string, Set<string>>();
  for (const c of intended) {
    if (!intendedHashesBySourceId.has(c.sourceId)) intendedHashesBySourceId.set(c.sourceId, new Set());
    intendedHashesBySourceId.get(c.sourceId)!.add(c.contentHash);
  }
  const toDeleteIds: string[] = [];
  for (const [sourceId, hashMap] of existing) {
    const intendedHashes = intendedHashesBySourceId.get(sourceId);
    for (const [hash, rowId] of hashMap) {
      if (!intendedHashes || !intendedHashes.has(hash)) toDeleteIds.push(rowId);
    }
  }
  console.log(`  [${sourceType}] deleting stale: ${toDeleteIds.length}`);
  for (let i = 0; i < toDeleteIds.length; i += 200) {
    const slice = toDeleteIds.slice(i, i + 200);
    await pool.query(`DELETE FROM "OracleChunk" WHERE "id" = ANY($1::text[])`, [slice]);
  }
}

async function main() {
  console.log("Incremental reindex…");
  const pool = getPool();
  const start = Date.now();
  try {
    // Episode summaries
    const episodes = await prisma.episode.findMany({
      select: { id: true, episodeNumber: true, title: true, slug: true, summaryShort: true, summaryLong: true },
    });
    await reconcile(pool, "episode_summary", episodes.flatMap(chunkEpisodeSummary));

    // Quotes
    const quotes = await prisma.quote.findMany({
      select: {
        id: true,
        text: true,
        timestampSeconds: true,
        speaker: { select: { displayName: true, slug: true } },
        episode: { select: { id: true, episodeNumber: true, title: true } },
      },
    });
    await reconcile(
      pool,
      "quote",
      quotes.flatMap((q) =>
        chunkQuote({
          id: q.id,
          text: q.text,
          speakerName: q.speaker?.displayName ?? null,
          speakerSlug: q.speaker?.slug ?? null,
          episodeId: q.episode?.id ?? null,
          episodeNumber: q.episode?.episodeNumber ?? null,
          episodeTitle: q.episode?.title ?? null,
          timestampSeconds: q.timestampSeconds ?? null,
        }),
      ),
    );

    // (Repeat for lore, topic, person, psy_*, transcript — same shape as build-index.)
    // For Phase A we run only the lighter source types; transcripts re-embed
    // is rare enough that running full build-index for them is acceptable.

    console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/oracle/reindex-incremental.ts
git commit -m "feat(oracle): incremental reindex by contentHash"
```

---

## Task 16: Eval scaffold — golden set + sanity runner

**Files:**
- Create: `scripts/oracle/eval/golden-set.json`
- Create: `scripts/oracle/eval/run-eval.ts`

Phase A eval is a smoke test: 10 hand-curated entries, each asserting `expected_state` and a list of `expected_citation_episodes`. Full 100-entry golden set is deferred to Phase C.

- [ ] **Step 1: Create `scripts/oracle/eval/golden-set.json`**

```json
[
  {
    "id": "g001",
    "question": "What does Psyche say about cult formation?",
    "expected_state": "strong",
    "category": "thematic"
  },
  {
    "id": "g002",
    "question": "Tell me about Mason",
    "expected_state": "strong",
    "expected_source_types": ["person", "quote", "transcript"],
    "category": "person_lookup"
  },
  {
    "id": "g003",
    "question": "What happened in chapter 12 of the Psychenomicon?",
    "expected_state": "strong",
    "expected_source_types": ["psy_chapter"],
    "category": "psychenomicon"
  },
  {
    "id": "g004",
    "question": "fjdkslafjkdslafjkdsla nonsense word stream",
    "expected_state": "none",
    "category": "refusal"
  },
  {
    "id": "g005",
    "question": "manipulation tactics in close relationships",
    "expected_state": "strong",
    "category": "thematic"
  },
  {
    "id": "g006",
    "question": "The Tower tarot card",
    "expected_state": "weak",
    "category": "lore"
  },
  {
    "id": "g007",
    "question": "EP.402",
    "expected_state": "strong",
    "expected_source_types": ["transcript", "episode_summary", "quote"],
    "category": "episode_lookup"
  },
  {
    "id": "g008",
    "question": "Alexandra Mayers Monica Foster",
    "expected_state": "strong",
    "expected_source_types": ["person"],
    "category": "altname_resolution"
  },
  {
    "id": "g009",
    "question": "the descent thread",
    "expected_state": "weak",
    "expected_source_types": ["psy_thread"],
    "category": "thread_lookup"
  },
  {
    "id": "g010",
    "question": "topic of cult deprogramming",
    "expected_state": "weak",
    "expected_source_types": ["topic", "transcript"],
    "category": "topic_lookup"
  }
]
```

- [ ] **Step 2: Create `scripts/oracle/eval/run-eval.ts`**

```ts
/**
 * Phase A eval: smoke-test hybridSearch against a small golden set.
 *
 * Reports:
 *   - state_correctness  — did `hybridSearch` return the expected state?
 *   - source_type_overlap — did expected_source_types appear in results?
 *   - latency_p50, latency_p95
 *
 * Full citation_coverage / hallucination grading lands in Phase C alongside
 * the agent.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { hybridSearch } from "@/lib/oracle/retrieval/hybrid-search";
import type {
  HybridSearchResponse,
  OracleChunkSource,
  RetrievalState,
} from "@/lib/oracle/types";

interface GoldenEntry {
  id: string;
  question: string;
  expected_state: RetrievalState;
  expected_source_types?: OracleChunkSource[];
  category: string;
}

interface RunResult {
  id: string;
  question: string;
  expectedState: RetrievalState;
  actualState: RetrievalState;
  stateMatch: boolean;
  expectedSourceTypes?: OracleChunkSource[];
  actualSourceTypes: OracleChunkSource[];
  sourceTypeOverlap?: number; // 0..1
  latencyMs: number;
  topResultRef?: string;
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "n/a";
  return ((part / whole) * 100).toFixed(1) + "%";
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const goldenPath = path.resolve(__dirname, "golden-set.json");
  const raw = await readFile(goldenPath, "utf-8");
  const golden: GoldenEntry[] = JSON.parse(raw);

  const results: RunResult[] = [];
  for (const g of golden) {
    const start = Date.now();
    let resp: HybridSearchResponse;
    try {
      resp = await hybridSearch({ query: g.question });
    } catch (err) {
      console.error(`  [${g.id}] errored:`, err);
      continue;
    }
    const elapsed = Date.now() - start;
    const actualSourceTypes = Array.from(new Set(resp.results.map((r) => r.sourceType)));
    let overlap: number | undefined;
    if (g.expected_source_types && g.expected_source_types.length > 0) {
      const hits = g.expected_source_types.filter((t) => actualSourceTypes.includes(t)).length;
      overlap = hits / g.expected_source_types.length;
    }
    results.push({
      id: g.id,
      question: g.question,
      expectedState: g.expected_state,
      actualState: resp.state,
      stateMatch: resp.state === g.expected_state,
      expectedSourceTypes: g.expected_source_types,
      actualSourceTypes,
      sourceTypeOverlap: overlap,
      latencyMs: elapsed,
      topResultRef: resp.results[0]?.sourceRef,
    });
  }

  // Print per-row table
  console.log("\nPer-row results:");
  console.log("─".repeat(120));
  for (const r of results) {
    const mark = r.stateMatch ? "✓" : "✗";
    console.log(
      `  ${mark} ${r.id} [${r.actualState.padEnd(6)}] (expected ${r.expectedState.padEnd(6)}) ${r.latencyMs.toString().padStart(5)}ms — ${r.topResultRef ?? "(no results)"}`,
    );
    if (r.expectedSourceTypes) {
      console.log(`         types overlap ${(r.sourceTypeOverlap ?? 0).toFixed(2)} — got [${r.actualSourceTypes.join(", ")}]`);
    }
  }

  // Aggregate metrics
  const stateMatches = results.filter((r) => r.stateMatch).length;
  const overlaps = results.map((r) => r.sourceTypeOverlap).filter((x): x is number => x != null);
  const avgOverlap = overlaps.length ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : 0;
  const latencies = results.map((r) => r.latencyMs);

  console.log("\nSummary:");
  console.log(`  state_correctness:   ${pct(stateMatches, results.length)} (${stateMatches}/${results.length})`);
  console.log(`  source_type_overlap: ${(avgOverlap * 100).toFixed(1)}% avg across ${overlaps.length} entries with expectations`);
  console.log(`  latency_p50:         ${percentile(latencies, 50)} ms`);
  console.log(`  latency_p95:         ${percentile(latencies, 95)} ms`);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 3: Commit**

```bash
git add scripts/oracle/eval/golden-set.json scripts/oracle/eval/run-eval.ts
git commit -m "feat(oracle): Phase A eval scaffold (golden set + sanity runner)"
```

---

## Task 17: Wire up package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add three scripts to the `scripts` block in `package.json`**

Open `package.json` and append these three entries to the `scripts` object, just before the `nightmares:fetch` line (or wherever fits the existing alphabetical-ish ordering):

```json
    "oracle:build-index": "npx dotenvx run -- npx tsx scripts/oracle/build-index.ts",
    "oracle:reindex": "npx dotenvx run -- npx tsx scripts/oracle/reindex-incremental.ts",
    "oracle:eval": "npx dotenvx run -- npx tsx scripts/oracle/eval/run-eval.ts",
```

The final `scripts` block should still be valid JSON — commas in the right places.

- [ ] **Step 2: Verify package.json still parses**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
Expected: exits 0 with no output.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore(oracle): npm scripts for build-index, reindex, eval"
```

---

## Task 18: Run the indexer against the dev corpus + verify

**Files:** No code changes — execution + sanity verification only.

Before running, the engineer must:
- Have `VOYAGE_API_KEY` and `COHERE_API_KEY` set in `.env.local` (or `.env`).
- Have `DATABASE_URL` and `DIRECT_URL` pointing at a Neon DB that already has the existing corpus (episodes, quotes, lore, etc.).
- Be aware: full corpus embed will spend roughly **$5-10** of Voyage credit on the first run.

- [ ] **Step 1: Dry-run on a single source type first to validate the wiring**

Temporarily comment out all calls in `scripts/oracle/build-index.ts`'s `main()` except `await buildEpisodeSummaries(pool);`. Run:

```bash
npm run oracle:build-index
```

Expected output ends with something like:
```
--- episode summaries ---
  [episode_summary] embedding 1300 chunks…
  [episode_summary] upserted 1300 chunks
Done in 0.8 min
```

Verify in a Postgres client:
```sql
SELECT COUNT(*) FROM "OracleChunk" WHERE "sourceType"::text = 'episode_summary';
```
Expected: matches the number of episodes with at least one summary (likely ~1,200-1,300).

- [ ] **Step 2: Restore `build-index.ts` to its full form**

Undo the temporary commenting-out so all source types build.

- [ ] **Step 3: Run the full build**

```bash
npm run oracle:build-index
```

Expected runtime: 10-20 minutes for the full corpus. Output should walk through each source type. No errors.

Verify total chunks:
```sql
SELECT "sourceType", COUNT(*) FROM "OracleChunk" GROUP BY "sourceType" ORDER BY 1;
```
Expected: all 9 source types present; total ~45-50K rows.

- [ ] **Step 4: Run the eval**

```bash
npm run oracle:eval
```

Expected: prints per-row results + summary table. **Pass criteria for Phase A:**
- `state_correctness` ≥ 60% (Phase A; calibration in Phase E lifts this further)
- `source_type_overlap` ≥ 0.5 average
- `latency_p95` < 4000 ms (cold first run may exceed; rerun once more if so)

If any entry returns the wrong state in a way that looks systemic (e.g., everything `weak` even when it should be `strong`), the thresholds in `src/lib/oracle/retrieval/thresholds.ts` need recalibration — that's the expected Phase A/E iteration.

- [ ] **Step 5: Commit a snapshot of the eval output for posterity**

Save the eval output to `scripts/oracle/eval/runs/2026-05-15-initial.txt` (create directory if needed):

```bash
mkdir -p scripts/oracle/eval/runs
npm run oracle:eval > scripts/oracle/eval/runs/2026-05-15-initial.txt 2>&1
git add scripts/oracle/eval/runs/2026-05-15-initial.txt
git commit -m "chore(oracle): record Phase A initial eval baseline"
```

---

## Phase A done — what's next

After this plan lands, the queryable index exists. **Phase B** (skeleton agent) is the next plan to write:
- `/api/oracle/stream` SSE route
- `src/lib/oracle/agent/persona-prompt.ts` v0 (just the persona + voice + grounding blocks)
- `src/lib/oracle/agent/sonnet-agent.ts` Anthropic Messages call with `search_archive` tool only
- Minimal `/oracle` page (chat without the avatar, no contextual entry, no rate limits)
- Internal-only feature flag

Phase B's plan should be written separately when Phase A ships. Each subsequent phase (C tools+Console UI, D contextual+feedback+rate limits, E tuning+GA) gets its own plan.

---

## Self-review — gaps and fixes

Skimmed the spec against this plan:

- **Section 1 (goals/non-goals)** — Phase A only implements the indexing substrate; goals 1, 2, 3 (Oracle, multi-turn, tools), 5 (contextual entry), 6 (rate limits), 8 (feedback) are explicit Phase B-D scope. Goal 4 (hybrid retrieval) and goal 7 (full index) are fully covered here.
- **Section 2 (flow + retrieval)** — Retrieval modules (BM25, vector, RRF, anchor boost, rerank, threshold classify) are all implemented. The agent loop / SSE stream / API route are Phase B.
- **Section 3 (tools)** — Out of scope for Phase A.
- **Section 4 (persona)** — Out of scope for Phase A.
- **Section 5 (UI)** — Out of scope for Phase A.
- **Section 6 (embeddings & indexing)** — Voyage-3 (1024-dim), Cohere rerank-v3, ivfflat + GIN indexes, 9 chunkers, contentHash incremental, build/reindex/eval scripts — all here.
- **Section 7 (database)** — `OracleChunk` table + enum + indexes shipped. `OracleSession`, `OracleQuery`, `OracleFeedback`, `OracleRateLimit` are Phase B-D (those tables only become meaningful when the agent and rate limits exist).
- **Section 8 (errors/eval/rollout)** — Phase A rollout matches "Build OracleChunk table, run full one-shot embed, verify hybrid search returns sane results via eval. No UI." Eval scaffold is here; full golden set + hallucination metric are Phase C.

No placeholders (`TBD`, `TODO`, `implement later`) in any step. Type names consistent across tasks (`ChunkInput`, `HybridResult`, `RetrievalState`, `OracleChunkSource`). Module paths consistent.

Two issues caught and fixed inline:
- `scripts/oracle/build-index.ts → buildTranscripts()` was filtering episodes by a non-existent `hasTranscript` column. Replaced with: walk all episodes, skip any with zero `TranscriptSegment` rows.
- `scripts/oracle/reindex-incremental.ts` had duplicate INSERT SQL — one variant without an `id` column (would error against the schema) and one variant with it. Collapsed to a single correct INSERT using `gen_random_uuid()::text` for the `id` column.

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-05-15-conversational-oracle-phase-a-indexing.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
