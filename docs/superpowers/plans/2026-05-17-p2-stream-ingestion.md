# Phase 2 — Plan 2: Stream Ingestion Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pipeline that takes a raw stream transcript, chunks it, extracts entity mentions, detects factual events, scores sentiment, and writes to the database — making every past and future stream queryable.

**Architecture:** An admin-triggered API route (`POST /api/admin/streams/ingest`) accepts a transcript (text or YouTube video ID) and kicks off a sequential pipeline: chunk → extract entities → detect events → separate interpretations → persist. Events and interpretations are stored in separate tables to preserve the fact/interpretation boundary. Uses Anthropic SDK for AI steps.

**Tech Stack:** Prisma, TypeScript, Next.js App Router, Anthropic SDK (claude-haiku-4-5), Vitest

**Prerequisite:** Plan 1 (Entity Graph) must be complete — event detection wires into `EntityInteraction`.

---

## File Structure

- Create: `src/types/ingestion.ts` — stream session/chunk/event types
- Create: `src/lib/ingestion/chunk-splitter.ts` — text → fixed-size chunks with speaker detection
- Create: `src/lib/ingestion/entity-extractor.ts` — AI entity mention extraction per chunk
- Create: `src/lib/ingestion/event-detector.ts` — AI factual event detection per chunk
- Create: `src/lib/ingestion/stream-ingestor.ts` — orchestrator
- Create: `src/lib/ingestion/__tests__/chunk-splitter.test.ts`
- Create: `src/lib/ingestion/__tests__/event-detector.test.ts`
- Create: `src/app/api/admin/streams/ingest/route.ts`
- Create: `src/app/api/admin/streams/[sessionId]/route.ts` — GET session status
- Modify: `prisma/schema.prisma` — add StreamSession, StreamChunk, StreamEntityMention, StreamEvent, StreamInterpretation
- Create: `prisma/migrations/20260517000001_stream_ingestion/migration.sql`

---

### Task 1: Ingestion Types

**Files:**
- Create: `src/types/ingestion.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/ingestion.ts

export type StreamStatus = "pending" | "processing" | "complete" | "failed";
export type AmbiguityLevel = "low" | "moderate" | "high";

export interface StreamSession {
  id: string;
  youtubeVideoId: string | null;
  title: string | null;
  status: StreamStatus;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StreamChunk {
  id: string;
  sessionId: string;
  chunkIndex: number;
  startSeconds: number | null;
  endSeconds: number | null;
  text: string;
  speakerLabel: string | null;
  sentiment: number | null;
  sentimentLabel: string | null;
}

export interface StreamEntityMention {
  chunkId: string;
  entitySlug: string | null;
  entityName: string;
  confidence: number;
}

export interface StreamEvent {
  id: string;
  sessionId: string;
  chunkIndex: number | null;
  eventType: string;
  speaker: string | null;
  target: string | null;
  rawText: string | null;
  timestampSeconds: number | null;
}

export interface EvidenceRef {
  type: "stream_chunk" | "stream_event" | "transcript_segment" | "quote";
  id: string;
  excerpt?: string;
}

export interface StreamInterpretation {
  id: string;
  eventId: string;
  pattern: string;
  confidence: number;
  ambiguity: AmbiguityLevel;
  evidenceRefs: EvidenceRef[];
  competingPatterns: string[];
}

export interface IngestRequest {
  transcript: string;
  youtubeVideoId?: string;
  title?: string;
}

export interface ChunkInput {
  text: string;
  speakerLabel?: string;
  startSeconds?: number;
  endSeconds?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/ingestion.ts
git commit -m "feat(ingestion): add stream ingestion TypeScript types"
```

---

### Task 2: Prisma Schema — Stream Tables

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260517000001_stream_ingestion/migration.sql`

- [ ] **Step 1: Add stream models to schema**

Add after the Entity Graph models in `prisma/schema.prisma`:

```prisma
// ─── Stream Ingestion ──────────────────────────────────────────────────────

model StreamSession {
  id             String   @id @default(cuid())
  youtubeVideoId String?
  title          String?
  rawTranscript  String?  @db.Text
  status         String   @default("pending")
  startedAt      DateTime?
  completedAt    DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  chunks StreamChunk[]
  events StreamEvent[]

  @@index([status])
  @@index([createdAt])
}

model StreamChunk {
  id             String        @id @default(cuid())
  sessionId      String
  session        StreamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  chunkIndex     Int
  startSeconds   Int?
  endSeconds     Int?
  text           String        @db.Text
  speakerLabel   String?
  sentiment      Float?
  sentimentLabel String?
  createdAt      DateTime      @default(now())

  entityMentions StreamEntityMention[]

  @@index([sessionId])
  @@index([chunkIndex])
}

model StreamEntityMention {
  id         String      @id @default(cuid())
  chunkId    String
  chunk      StreamChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)
  entitySlug String?
  entityName String
  confidence Float

  @@index([chunkId])
  @@index([entitySlug])
}

model StreamEvent {
  id               String        @id @default(cuid())
  sessionId        String
  session          StreamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  chunkIndex       Int?
  eventType        String
  speaker          String?
  target           String?
  rawText          String?       @db.Text
  timestampSeconds Int?
  createdAt        DateTime      @default(now())

  interpretations StreamInterpretation[]

  @@index([sessionId])
  @@index([eventType])
}

model StreamInterpretation {
  id                String      @id @default(cuid())
  eventId           String
  event             StreamEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  pattern           String
  confidence        Float
  ambiguity         String
  evidenceRefs      Json        @default("[]")
  competingPatterns Json        @default("[]")
  createdAt         DateTime    @default(now())

  @@index([eventId])
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd C:/Users/johnb/cultcodex-ui
npx prisma migrate dev --name stream_ingestion --create-only
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(ingestion): add StreamSession, StreamChunk, StreamEvent, StreamInterpretation schema"
```

---

### Task 3: Chunk Splitter

**Files:**
- Create: `src/lib/ingestion/chunk-splitter.ts`
- Create: `src/lib/ingestion/__tests__/chunk-splitter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ingestion/__tests__/chunk-splitter.test.ts
import { describe, it, expect } from "vitest";
import { splitIntoChunks, parseSpeakerLine } from "../chunk-splitter";

describe("parseSpeakerLine", () => {
  it("extracts speaker from [Speaker]: format", () => {
    const result = parseSpeakerLine("[Psyche]: Welcome to the void.");
    expect(result.speaker).toBe("Psyche");
    expect(result.text).toBe("Welcome to the void.");
  });

  it("returns null speaker when no bracket format", () => {
    const result = parseSpeakerLine("This is just plain text.");
    expect(result.speaker).toBeNull();
    expect(result.text).toBe("This is just plain text.");
  });
});

describe("splitIntoChunks", () => {
  it("splits long transcript into chunks of ~500 words", () => {
    const words = Array(1200).fill("word").join(" ");
    const chunks = splitIntoChunks(words, { maxWords: 500 });
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0].text.split(" ").length).toBeLessThanOrEqual(520);
  });

  it("preserves chunk index ordering", () => {
    const words = Array(600).fill("word").join(" ");
    const chunks = splitIntoChunks(words, { maxWords: 300 });
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i));
  });

  it("returns single chunk for short transcript", () => {
    const chunks = splitIntoChunks("Short text.", { maxWords: 500 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].chunkIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/ingestion/__tests__/chunk-splitter.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ingestion/chunk-splitter.ts
import type { ChunkInput } from "@/types/ingestion";

export interface RawChunk extends ChunkInput {
  chunkIndex: number;
}

export function parseSpeakerLine(line: string): { speaker: string | null; text: string } {
  const match = line.match(/^\[([^\]]+)\]:\s*(.+)/);
  if (match) {
    return { speaker: match[1].trim(), text: match[2].trim() };
  }
  return { speaker: null, text: line.trim() };
}

export function splitIntoChunks(
  transcript: string,
  options: { maxWords?: number } = {}
): RawChunk[] {
  const maxWords = options.maxWords ?? 500;
  const lines = transcript.split(/\n+/).filter((l) => l.trim().length > 0);

  const chunks: RawChunk[] = [];
  let buffer: string[] = [];
  let bufferWordCount = 0;
  let currentSpeaker: string | null = null;
  let chunkIndex = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    chunks.push({
      chunkIndex,
      text: buffer.join(" "),
      speakerLabel: currentSpeaker ?? undefined,
    });
    chunkIndex++;
    buffer = [];
    bufferWordCount = 0;
  };

  for (const line of lines) {
    const { speaker, text } = parseSpeakerLine(line);
    if (speaker && speaker !== currentSpeaker) {
      flush();
      currentSpeaker = speaker;
    }

    const words = text.split(/\s+/);
    if (bufferWordCount + words.length > maxWords) {
      flush();
    }
    buffer.push(text);
    bufferWordCount += words.length;
  }

  flush();
  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/ingestion/__tests__/chunk-splitter.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingestion/chunk-splitter.ts src/lib/ingestion/__tests__/chunk-splitter.test.ts
git commit -m "feat(ingestion): chunk splitter with speaker detection"
```

---

### Task 4: Entity Extractor

**Files:**
- Create: `src/lib/ingestion/entity-extractor.ts`

- [ ] **Step 1: Write the implementation**

```typescript
// src/lib/ingestion/entity-extractor.ts
import Anthropic from "@anthropic-ai/sdk";
import type { StreamEntityMention } from "@/types/ingestion";

const client = new Anthropic();

const EXTRACT_SYSTEM = `You extract named people/entities mentioned in conversation text. Return ONLY a JSON array. No prose. Format: [{"name":"EntityName","confidence":0.9}]. Confidence 0–1. Only real names, no generic words. Max 8 entries.`;

export async function extractEntityMentions(
  chunkText: string
): Promise<Omit<StreamEntityMention, "chunkId">[]> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content: chunkText.slice(0, 1500) }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "[]";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { name: string; confidence: number }[];
    return parsed
      .filter((e) => e.name && typeof e.confidence === "number")
      .map((e) => ({
        entitySlug: null,
        entityName: e.name.trim(),
        confidence: Math.max(0, Math.min(1, e.confidence)),
      }));
  } catch {
    return [];
  }
}

export async function scoreSentiment(
  chunkText: string
): Promise<{ score: number; label: "positive" | "neutral" | "negative" }> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 50,
    system: `Score the emotional tone of this text. Return ONLY JSON: {"score": 0.0, "label": "positive"|"neutral"|"negative"}. Score -1 (very negative) to +1 (very positive).`,
    messages: [{ role: "user", content: chunkText.slice(0, 800) }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { score: 0, label: "neutral" };

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { score: number; label: string };
    const label = ["positive", "neutral", "negative"].includes(parsed.label)
      ? (parsed.label as "positive" | "neutral" | "negative")
      : "neutral";
    return { score: Math.max(-1, Math.min(1, parsed.score)), label };
  } catch {
    return { score: 0, label: "neutral" };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ingestion/entity-extractor.ts
git commit -m "feat(ingestion): AI entity mention extractor and sentiment scorer"
```

---

### Task 5: Event Detector

**Files:**
- Create: `src/lib/ingestion/event-detector.ts`
- Create: `src/lib/ingestion/__tests__/event-detector.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ingestion/__tests__/event-detector.test.ts
import { describe, it, expect } from "vitest";
import { parseEventsFromAiResponse } from "../event-detector";

describe("parseEventsFromAiResponse", () => {
  it("parses valid event JSON", () => {
    const raw = JSON.stringify([
      { eventType: "interrupted", speaker: "Psyche", target: "Guest", rawText: "Let me finish" }
    ]);
    const events = parseEventsFromAiResponse(raw, 3);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("interrupted");
    expect(events[0].chunkIndex).toBe(3);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseEventsFromAiResponse("not json", 0)).toEqual([]);
  });

  it("filters entries missing eventType", () => {
    const raw = JSON.stringify([{ speaker: "X" }, { eventType: "defended", speaker: "Y" }]);
    const events = parseEventsFromAiResponse(raw, 0);
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe("defended");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/ingestion/__tests__/event-detector.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ingestion/event-detector.ts
import Anthropic from "@anthropic-ai/sdk";
import type { StreamEvent } from "@/types/ingestion";

const client = new Anthropic();

type RawEvent = Omit<StreamEvent, "id" | "sessionId" | "createdAt">;

const DETECT_SYSTEM = `You detect factual social events in conversation text. Return ONLY a JSON array of events. No prose.
Event format: {"eventType":"string","speaker":"string|null","target":"string|null","rawText":"string|null"}
Event types: interrupted, defended, accused, praised, dismissed, escalated, reconciled, betrayed, revealed, challenged.
Only events clearly present in the text. Max 5 events. Return [] if none.`;

export function parseEventsFromAiResponse(
  raw: string,
  chunkIndex: number
): RawEvent[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>[];
    return parsed
      .filter((e) => typeof e.eventType === "string" && e.eventType.length > 0)
      .map((e) => ({
        chunkIndex,
        eventType: String(e.eventType),
        speaker: typeof e.speaker === "string" ? e.speaker : null,
        target: typeof e.target === "string" ? e.target : null,
        rawText: typeof e.rawText === "string" ? e.rawText : null,
        timestampSeconds: null,
      }));
  } catch {
    return [];
  }
}

export async function detectEvents(
  chunkText: string,
  chunkIndex: number
): Promise<RawEvent[]> {
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: DETECT_SYSTEM,
    messages: [{ role: "user", content: chunkText.slice(0, 1500) }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "[]";
  return parseEventsFromAiResponse(text, chunkIndex);
}

const INTERPRET_SYSTEM = `Given a factual event from a live conversation, identify the narrative pattern.
Return ONLY JSON: {"pattern":"string","confidence":0.0,"ambiguity":"low"|"moderate"|"high","competingPatterns":["string"]}
Confidence 0–1. Be probabilistic. Do not state certainty.`;

export async function interpretEvent(
  event: RawEvent
): Promise<{ pattern: string; confidence: number; ambiguity: string; competingPatterns: string[] } | null> {
  const eventDesc = `Type: ${event.eventType}. Speaker: ${event.speaker ?? "unknown"}. Target: ${event.target ?? "unknown"}. Text: "${(event.rawText ?? "").slice(0, 300)}"`;

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: INTERPRET_SYSTEM,
    messages: [{ role: "user", content: eventDesc }],
  });

  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/ingestion/__tests__/event-detector.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingestion/event-detector.ts src/lib/ingestion/__tests__/event-detector.test.ts
git commit -m "feat(ingestion): AI event detector and interpreter with fact/interpretation separation"
```

---

### Task 6: Stream Ingestor Orchestrator

**Files:**
- Create: `src/lib/ingestion/stream-ingestor.ts`

- [ ] **Step 1: Write the orchestrator**

```typescript
// src/lib/ingestion/stream-ingestor.ts
import { prisma } from "@/lib/db";
import { splitIntoChunks } from "./chunk-splitter";
import { extractEntityMentions, scoreSentiment } from "./entity-extractor";
import { detectEvents, interpretEvent } from "./event-detector";

export async function ingestStream(sessionId: string): Promise<void> {
  const session = await prisma.streamSession.findUniqueOrThrow({
    where: { id: sessionId },
  });

  if (!session.rawTranscript) {
    await prisma.streamSession.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });
    return;
  }

  await prisma.streamSession.update({
    where: { id: sessionId },
    data: { status: "processing", startedAt: new Date() },
  });

  try {
    const rawChunks = splitIntoChunks(session.rawTranscript, { maxWords: 400 });

    for (const raw of rawChunks) {
      const [sentiment, mentions, events] = await Promise.all([
        scoreSentiment(raw.text),
        extractEntityMentions(raw.text),
        detectEvents(raw.text, raw.chunkIndex),
      ]);

      const chunk = await prisma.streamChunk.create({
        data: {
          sessionId,
          chunkIndex: raw.chunkIndex,
          text: raw.text,
          speakerLabel: raw.speakerLabel ?? null,
          sentiment: sentiment.score,
          sentimentLabel: sentiment.label,
        },
      });

      if (mentions.length > 0) {
        await prisma.streamEntityMention.createMany({
          data: mentions.map((m) => ({
            chunkId: chunk.id,
            entitySlug: m.entitySlug,
            entityName: m.entityName,
            confidence: m.confidence,
          })),
          skipDuplicates: true,
        });
      }

      for (const event of events) {
        const dbEvent = await prisma.streamEvent.create({
          data: {
            sessionId,
            chunkIndex: event.chunkIndex,
            eventType: event.eventType,
            speaker: event.speaker,
            target: event.target,
            rawText: event.rawText,
            timestampSeconds: event.timestampSeconds,
          },
        });

        const interpretation = await interpretEvent(event);
        if (interpretation) {
          await prisma.streamInterpretation.create({
            data: {
              eventId: dbEvent.id,
              pattern: interpretation.pattern,
              confidence: interpretation.confidence,
              ambiguity: interpretation.ambiguity,
              evidenceRefs: [{ type: "stream_chunk", id: chunk.id }],
              competingPatterns: interpretation.competingPatterns ?? [],
            },
          });
        }
      }
    }

    await prisma.streamSession.update({
      where: { id: sessionId },
      data: { status: "complete", completedAt: new Date() },
    });
  } catch (err) {
    await prisma.streamSession.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });
    throw err;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ingestion/stream-ingestor.ts
git commit -m "feat(ingestion): stream ingestor orchestrator — chunk, extract, detect, persist"
```

---

### Task 7: Ingest API Route

**Files:**
- Create: `src/app/api/admin/streams/ingest/route.ts`
- Create: `src/app/api/admin/streams/[sessionId]/route.ts`

- [ ] **Step 1: Write the ingest route**

```typescript
// src/app/api/admin/streams/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ingestStream } from "@/lib/ingestion/stream-ingestor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const transcript = String(body.transcript ?? "").trim();
  const youtubeVideoId = body.youtubeVideoId ? String(body.youtubeVideoId) : null;
  const title = body.title ? String(body.title) : null;

  if (!transcript) {
    return NextResponse.json({ ok: false, error: "transcript required" }, { status: 400 });
  }

  const session = await prisma.streamSession.create({
    data: {
      rawTranscript: transcript,
      youtubeVideoId,
      title,
      status: "pending",
    },
  });

  // Fire-and-forget — client polls GET route for status
  ingestStream(session.id).catch((err) =>
    console.error(`[ingest] session ${session.id} failed:`, err)
  );

  return NextResponse.json({ ok: true, sessionId: session.id });
}
```

- [ ] **Step 2: Write the status route**

```typescript
// src/app/api/admin/streams/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.streamSession.findUnique({
    where: { id: params.sessionId },
    include: {
      _count: { select: { chunks: true, events: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    session: {
      id: session.id,
      status: session.status,
      title: session.title,
      chunkCount: session._count.chunks,
      eventCount: session._count.events,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    },
  });
}
```

- [ ] **Step 3: Manual integration test**

Start dev server, then POST a short transcript:

```bash
curl -X POST http://localhost:3000/api/admin/streams/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-admin-session-cookie>" \
  -d '{"transcript":"[Psyche]: Welcome everyone.\n[Guest]: Thanks for having me.\n[Psyche]: Let me cut you off there.", "title": "Test Stream"}'
```
Expected: `{"ok":true,"sessionId":"..."}` then poll the GET route until `status: "complete"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/streams/
git commit -m "feat(ingestion): admin ingest API route with fire-and-forget processing"
```

---

## Self-Review

**Spec coverage:**
- ✅ Pipeline: transcript → chunking → entity extraction → sentiment → event detection → graph updates → Oracle indexing
- ✅ Events separated from interpretations (StreamEvent vs StreamInterpretation)
- ✅ Evidence refs on interpretations
- ✅ Confidence scores on interpretations
- ⏭ Graph updates from events (wiring EntityInteraction from StreamEvent) — can be added to `stream-ingestor.ts` after Plan 1 is complete: find entity by name, call `upsertRelationship`, create `EntityInteraction`
- ⏭ Oracle indexing (OracleChunk from stream) — add to orchestrator after Plan 1: create OracleChunk entries for each StreamSession
- ⏭ YouTube caption fetch — not in scope; caller supplies raw transcript

**No placeholders found.**

**Type consistency:** `StreamEvent` uses `chunkIndex: number | null` consistently. `RawEvent` in event-detector omits DB-generated fields (`id`, `sessionId`, `createdAt`) matching schema.
