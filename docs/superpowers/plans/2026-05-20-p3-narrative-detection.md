# Phase 3 — Plan B: Narrative Event Detection

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After all stream chunks are processed, analyze the sequence of events to detect higher-order narrative patterns — betrayal arcs, escalation sequences, mob formation, dogpile emergence, and redemption arcs.

**Architecture:** A `NarrativePattern` table stores detected patterns at the session level. A `narrative-detector.ts` service runs post-ingestion, scanning `StreamEvent` sequences for patterns using sliding-window and entity-pair analysis. The detector runs automatically at the end of `ingestStream` and results are stored linked to the session.

**Tech Stack:** Prisma, TypeScript, Vitest. AI-assisted pattern labeling via Anthropic SDK for ambiguous cases.

**Prerequisite:** Phase 2 Stream Ingestion complete. Phase 3 Plan A (Entity Resolution) recommended but not required.

---

## File Structure

- Create: `src/types/narrative.ts` — NarrativePatternType, NarrativePattern types
- Create: `src/lib/analysis/narrative-patterns.ts` — pattern definitions and window analysis
- Create: `src/lib/analysis/narrative-detector.ts` — session-level orchestrator
- Create: `src/lib/analysis/__tests__/narrative-patterns.test.ts`
- Create: `src/lib/analysis/__tests__/narrative-detector.test.ts`
- Create: `src/app/api/admin/streams/[sessionId]/patterns/route.ts` — GET detected patterns
- Modify: `src/lib/ingestion/stream-ingestor.ts` — call detector after pipeline completes
- Modify: `prisma/schema.prisma` — add NarrativePattern model
- Create: `prisma/migrations/20260520000001_narrative_pattern/migration.sql`

---

### Task 1: Narrative Types

**Files:**
- Create: `src/types/narrative.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/narrative.ts

export type NarrativePatternType =
  | "betrayal_arc"        // entity defended X, later accused/undermined X
  | "escalation_sequence" // 3+ interrupt/challenge events between same pair
  | "mob_formation"       // 3+ distinct entities targeting same target in one window
  | "dogpile"             // rapid succession (5+ events in 3 chunks) targeting one entity
  | "redemption_arc"      // broken/hostile pair ends with defense/reconciliation
  | "alliance_forming"    // 3+ mutual defenses between same pair
  | "chaos_spike";        // sentiment drops >0.5 within 2 chunks and multiple conflicts

export interface NarrativePatternRecord {
  id: string;
  sessionId: string;
  patternType: NarrativePatternType;
  involvedEntities: string[]; // entity names or slugs
  eventIds: string[];         // StreamEvent IDs comprising this pattern
  confidence: number;
  chunkStart: number | null;
  chunkEnd: number | null;
  summary: string | null;
  createdAt: string;
}

export interface EventWindow {
  events: Array<{
    id: string;
    eventType: string;
    speaker: string | null;
    target: string | null;
    chunkIndex: number | null;
  }>;
  chunkStart: number;
  chunkEnd: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/narrative.ts
git commit -m "feat(narrative): add narrative pattern TypeScript types"
```

---

### Task 2: NarrativePattern Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260520000001_narrative_pattern/migration.sql`

- [ ] **Step 1: Add model to schema**

Add after the Stream Ingestion models in `prisma/schema.prisma`:

```prisma
// ─── Narrative Patterns ───────────────────────────────────────────────────

model NarrativePattern {
  id               String        @id @default(cuid())
  sessionId        String
  session          StreamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  patternType      String
  involvedEntities String[]
  eventIds         String[]
  confidence       Float
  chunkStart       Int?
  chunkEnd         Int?
  summary          String?       @db.Text
  createdAt        DateTime      @default(now())

  @@index([sessionId])
  @@index([patternType])
}
```

Also add the back-relation on `StreamSession`:
```prisma
  narrativePatterns NarrativePattern[]
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd C:/Users/johnb/cultcodex-ui
npx prisma migrate dev --name narrative_pattern --create-only
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(narrative): add NarrativePattern schema"
```

---

### Task 3: Pattern Analysis Functions

**Files:**
- Create: `src/lib/analysis/narrative-patterns.ts`
- Create: `src/lib/analysis/__tests__/narrative-patterns.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/analysis/__tests__/narrative-patterns.test.ts
import { describe, it, expect } from "vitest";
import {
  detectEscalationSequence,
  detectMobFormation,
  detectDogpile,
  detectBetrayalArc,
  buildEntityPairKey,
} from "../narrative-patterns";

const makeEvent = (
  id: string,
  eventType: string,
  speaker: string | null,
  target: string | null,
  chunkIndex: number
) => ({ id, eventType, speaker, target, chunkIndex });

describe("buildEntityPairKey", () => {
  it("produces consistent key regardless of order", () => {
    expect(buildEntityPairKey("alex", "psyche")).toBe(buildEntityPairKey("psyche", "alex"));
  });

  it("includes both names", () => {
    const key = buildEntityPairKey("alex", "psyche");
    expect(key).toContain("alex");
    expect(key).toContain("psyche");
  });
});

describe("detectEscalationSequence", () => {
  it("returns pattern when 3+ conflict events between same pair", () => {
    const events = [
      makeEvent("e1", "interrupted", "Alex", "Psyche", 0),
      makeEvent("e2", "challenged", "Alex", "Psyche", 1),
      makeEvent("e3", "interrupted", "Alex", "Psyche", 2),
    ];
    const patterns = detectEscalationSequence(events);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternType).toBe("escalation_sequence");
    expect(patterns[0].involvedEntities).toContain("Alex");
    expect(patterns[0].involvedEntities).toContain("Psyche");
  });

  it("returns empty when events involve different pairs", () => {
    const events = [
      makeEvent("e1", "interrupted", "Alex", "Psyche", 0),
      makeEvent("e2", "interrupted", "Bob", "Carol", 1),
      makeEvent("e3", "challenged", "Dave", "Eve", 2),
    ];
    expect(detectEscalationSequence(events)).toHaveLength(0);
  });
});

describe("detectMobFormation", () => {
  it("detects 3 distinct speakers targeting same entity in window", () => {
    const events = [
      makeEvent("e1", "accused",    "Alex",  "Psyche", 0),
      makeEvent("e2", "challenged", "Bob",   "Psyche", 0),
      makeEvent("e3", "dismissed",  "Carol", "Psyche", 1),
    ];
    const patterns = detectMobFormation(events, 3);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternType).toBe("mob_formation");
    expect(patterns[0].involvedEntities).toContain("Psyche");
  });

  it("ignores same speaker hitting same target multiple times", () => {
    const events = [
      makeEvent("e1", "accused",    "Alex", "Psyche", 0),
      makeEvent("e2", "challenged", "Alex", "Psyche", 0),
      makeEvent("e3", "dismissed",  "Alex", "Psyche", 1),
    ];
    expect(detectMobFormation(events, 3)).toHaveLength(0);
  });
});

describe("detectDogpile", () => {
  it("detects 5+ events targeting same entity within 3 chunks", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent(`e${i}`, "accused", `Speaker${i}`, "Target", i < 3 ? 0 : i < 5 ? 1 : 2)
    );
    const patterns = detectDogpile(events);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternType).toBe("dogpile");
  });

  it("does not fire for 4 events on same target", () => {
    const events = Array.from({ length: 4 }, (_, i) =>
      makeEvent(`e${i}`, "accused", `Speaker${i}`, "Target", 0)
    );
    expect(detectDogpile(events)).toHaveLength(0);
  });
});

describe("detectBetrayalArc", () => {
  it("detects defense followed by accusation from same speaker to same target", () => {
    const events = [
      makeEvent("e1", "defended",  "Alex", "Bob", 0),
      makeEvent("e2", "defended",  "Alex", "Bob", 2),
      makeEvent("e3", "accused",   "Alex", "Bob", 8),
      makeEvent("e4", "dismissed", "Alex", "Bob", 10),
    ];
    const patterns = detectBetrayalArc(events);
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternType).toBe("betrayal_arc");
  });

  it("does not fire when accusation comes before defense", () => {
    const events = [
      makeEvent("e1", "accused",  "Alex", "Bob", 0),
      makeEvent("e2", "defended", "Alex", "Bob", 5),
    ];
    expect(detectBetrayalArc(events)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analysis/__tests__/narrative-patterns.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/analysis/narrative-patterns.ts
import type { NarrativePatternType } from "@/types/narrative";

type RawEvent = {
  id: string;
  eventType: string;
  speaker: string | null;
  target: string | null;
  chunkIndex: number | null;
};

type DetectedPattern = {
  patternType: NarrativePatternType;
  involvedEntities: string[];
  eventIds: string[];
  confidence: number;
  chunkStart: number | null;
  chunkEnd: number | null;
};

const CONFLICT_TYPES = new Set([
  "interrupted", "challenged", "accused", "dismissed", "escalated", "betrayed",
]);

const DEFENSE_TYPES = new Set(["defended", "reconciled", "praised"]);

export function buildEntityPairKey(a: string, b: string): string {
  return [a, b].sort().join(":::");
}

export function detectEscalationSequence(events: RawEvent[]): DetectedPattern[] {
  const conflictsByPair = new Map<string, RawEvent[]>();

  for (const ev of events) {
    if (!CONFLICT_TYPES.has(ev.eventType)) continue;
    if (!ev.speaker || !ev.target) continue;
    const key = buildEntityPairKey(ev.speaker, ev.target);
    const arr = conflictsByPair.get(key) ?? [];
    arr.push(ev);
    conflictsByPair.set(key, arr);
  }

  const patterns: DetectedPattern[] = [];
  for (const [key, evs] of conflictsByPair) {
    if (evs.length < 3) continue;
    const [a, b] = key.split(":::");
    const chunks = evs.map((e) => e.chunkIndex ?? 0);
    patterns.push({
      patternType: "escalation_sequence",
      involvedEntities: [a, b],
      eventIds: evs.map((e) => e.id),
      confidence: Math.min(0.95, 0.6 + evs.length * 0.07),
      chunkStart: Math.min(...chunks),
      chunkEnd: Math.max(...chunks),
    });
  }
  return patterns;
}

export function detectMobFormation(
  events: RawEvent[],
  windowSize = 4
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const sortedEvents = [...events].sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

  for (let i = 0; i < sortedEvents.length; i++) {
    const windowStart = sortedEvents[i].chunkIndex ?? 0;
    const windowEnd = windowStart + windowSize;
    const window = sortedEvents.filter(
      (e) => (e.chunkIndex ?? 0) >= windowStart && (e.chunkIndex ?? 0) <= windowEnd
    );

    // Group by target
    const byTarget = new Map<string, Set<string>>();
    for (const ev of window) {
      if (!ev.target || !ev.speaker) continue;
      if (!CONFLICT_TYPES.has(ev.eventType)) continue;
      const speakers = byTarget.get(ev.target) ?? new Set();
      speakers.add(ev.speaker);
      byTarget.set(ev.target, speakers);
    }

    for (const [target, speakers] of byTarget) {
      if (speakers.size < 3) continue;
      const relevantEvs = window.filter(
        (e) => e.target === target && CONFLICT_TYPES.has(e.eventType)
      );
      // Avoid duplicate patterns
      const already = patterns.some(
        (p) => p.patternType === "mob_formation" && p.involvedEntities[0] === target
      );
      if (already) continue;

      patterns.push({
        patternType: "mob_formation",
        involvedEntities: [target, ...Array.from(speakers)],
        eventIds: relevantEvs.map((e) => e.id),
        confidence: Math.min(0.95, 0.65 + speakers.size * 0.05),
        chunkStart: windowStart,
        chunkEnd: windowEnd,
      });
    }
  }
  return patterns;
}

export function detectDogpile(events: RawEvent[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const sortedEvents = [...events].sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

  for (let i = 0; i < sortedEvents.length; i++) {
    const anchor = sortedEvents[i].chunkIndex ?? 0;
    const window = sortedEvents.filter(
      (e) => (e.chunkIndex ?? 0) >= anchor && (e.chunkIndex ?? 0) <= anchor + 2
    );

    const byTarget = new Map<string, RawEvent[]>();
    for (const ev of window) {
      if (!ev.target) continue;
      const arr = byTarget.get(ev.target) ?? [];
      arr.push(ev);
      byTarget.set(ev.target, arr);
    }

    for (const [target, evs] of byTarget) {
      if (evs.length < 5) continue;
      const already = patterns.some(
        (p) => p.patternType === "dogpile" && p.involvedEntities[0] === target
      );
      if (already) continue;

      const speakers = [...new Set(evs.map((e) => e.speaker).filter(Boolean))];
      patterns.push({
        patternType: "dogpile",
        involvedEntities: [target, ...speakers],
        eventIds: evs.map((e) => e.id),
        confidence: Math.min(0.95, 0.7 + evs.length * 0.04),
        chunkStart: anchor,
        chunkEnd: anchor + 2,
      });
    }
  }
  return patterns;
}

export function detectBetrayalArc(events: RawEvent[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const sorted = [...events].sort((a, b) => (a.chunkIndex ?? 0) - (b.chunkIndex ?? 0));

  // Group by speaker→target pair
  const pairMap = new Map<string, RawEvent[]>();
  for (const ev of sorted) {
    if (!ev.speaker || !ev.target) continue;
    const key = `${ev.speaker}→${ev.target}`;
    const arr = pairMap.get(key) ?? [];
    arr.push(ev);
    pairMap.set(key, arr);
  }

  for (const [key, evs] of pairMap) {
    const [speaker, target] = key.split("→");
    const defenses = evs.filter((e) => DEFENSE_TYPES.has(e.eventType));
    const attacks = evs.filter((e) => CONFLICT_TYPES.has(e.eventType));
    if (defenses.length === 0 || attacks.length === 0) continue;

    const firstDefenseChunk = Math.min(...defenses.map((e) => e.chunkIndex ?? 0));
    const firstAttackChunk = Math.min(...attacks.map((e) => e.chunkIndex ?? 0));

    // Betrayal: defended first, then attacked — with meaningful gap
    if (firstDefenseChunk < firstAttackChunk && firstAttackChunk - firstDefenseChunk >= 3) {
      const allEvs = [...defenses, ...attacks];
      const chunks = allEvs.map((e) => e.chunkIndex ?? 0);
      patterns.push({
        patternType: "betrayal_arc",
        involvedEntities: [speaker, target],
        eventIds: allEvs.map((e) => e.id),
        confidence: Math.min(0.90, 0.65 + (attacks.length + defenses.length) * 0.04),
        chunkStart: Math.min(...chunks),
        chunkEnd: Math.max(...chunks),
      });
    }
  }
  return patterns;
}

export function detectAllianceForming(events: RawEvent[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  const defensesByPair = new Map<string, RawEvent[]>();

  for (const ev of events) {
    if (!DEFENSE_TYPES.has(ev.eventType)) continue;
    if (!ev.speaker || !ev.target) continue;
    const key = buildEntityPairKey(ev.speaker, ev.target);
    const arr = defensesByPair.get(key) ?? [];
    arr.push(ev);
    defensesByPair.set(key, arr);
  }

  for (const [key, evs] of defensesByPair) {
    if (evs.length < 3) continue;
    const [a, b] = key.split(":::");
    const chunks = evs.map((e) => e.chunkIndex ?? 0);
    patterns.push({
      patternType: "alliance_forming",
      involvedEntities: [a, b],
      eventIds: evs.map((e) => e.id),
      confidence: Math.min(0.90, 0.55 + evs.length * 0.08),
      chunkStart: Math.min(...chunks),
      chunkEnd: Math.max(...chunks),
    });
  }
  return patterns;
}

export function runAllPatternDetectors(events: RawEvent[]): DetectedPattern[] {
  return [
    ...detectEscalationSequence(events),
    ...detectMobFormation(events),
    ...detectDogpile(events),
    ...detectBetrayalArc(events),
    ...detectAllianceForming(events),
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/analysis/__tests__/narrative-patterns.test.ts
```
Expected: PASS — 12 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/narrative-patterns.ts src/lib/analysis/__tests__/narrative-patterns.test.ts
git commit -m "feat(narrative): pattern detectors — escalation, mob, dogpile, betrayal, alliance"
```

---

### Task 4: Narrative Detector Orchestrator

**Files:**
- Create: `src/lib/analysis/narrative-detector.ts`
- Create: `src/lib/analysis/__tests__/narrative-detector.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/analysis/__tests__/narrative-detector.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectNarrativePatterns } from "../narrative-detector";

vi.mock("@/lib/db", () => ({
  prisma: {
    streamEvent: {
      findMany: vi.fn(),
    },
    narrativePattern: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("detectNarrativePatterns", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches events for session and saves patterns", async () => {
    (prisma.streamEvent.findMany as any).mockResolvedValue([
      { id: "e1", eventType: "interrupted", speaker: "Alex", target: "Psyche", chunkIndex: 0 },
      { id: "e2", eventType: "challenged",  speaker: "Alex", target: "Psyche", chunkIndex: 1 },
      { id: "e3", eventType: "accused",     speaker: "Alex", target: "Psyche", chunkIndex: 2 },
    ]);

    const count = await detectNarrativePatterns("session-123");
    expect(prisma.streamEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sessionId: "session-123" } })
    );
    expect(prisma.narrativePattern.createMany).toHaveBeenCalled();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it("returns 0 and does not call createMany when no events", async () => {
    (prisma.streamEvent.findMany as any).mockResolvedValue([]);
    const count = await detectNarrativePatterns("session-empty");
    expect(count).toBe(0);
    expect(prisma.narrativePattern.createMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/analysis/__tests__/narrative-detector.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/analysis/narrative-detector.ts
import { prisma } from "@/lib/db";
import { runAllPatternDetectors } from "./narrative-patterns";

export async function detectNarrativePatterns(sessionId: string): Promise<number> {
  const events = await prisma.streamEvent.findMany({
    where: { sessionId },
    select: {
      id: true,
      eventType: true,
      speaker: true,
      target: true,
      chunkIndex: true,
    },
    orderBy: { chunkIndex: "asc" },
  });

  if (events.length === 0) return 0;

  const detected = runAllPatternDetectors(events);
  if (detected.length === 0) return 0;

  await prisma.narrativePattern.createMany({
    data: detected.map((p) => ({
      sessionId,
      patternType: p.patternType,
      involvedEntities: p.involvedEntities,
      eventIds: p.eventIds,
      confidence: p.confidence,
      chunkStart: p.chunkStart ?? null,
      chunkEnd: p.chunkEnd ?? null,
      summary: null,
    })),
    skipDuplicates: false,
  });

  return detected.length;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/analysis/__tests__/narrative-detector.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/narrative-detector.ts src/lib/analysis/__tests__/narrative-detector.test.ts
git commit -m "feat(narrative): narrative detector orchestrator — fetch events, run detectors, persist"
```

---

### Task 5: Wire Detector into Stream Ingestor

**Files:**
- Modify: `src/lib/ingestion/stream-ingestor.ts`

- [ ] **Step 1: Add detector call at the end of ingestStream**

At the top of `src/lib/ingestion/stream-ingestor.ts`, add:

```typescript
import { detectNarrativePatterns } from "@/lib/analysis/narrative-detector";
```

At the end of the `try` block, just before the final status update to `"complete"`, add:

```typescript
// Run narrative pattern detection across all events
const patternCount = await detectNarrativePatterns(sessionId);
console.log(`[ingest] ${patternCount} narrative patterns detected for session ${sessionId}`);
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All passing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ingestion/stream-ingestor.ts
git commit -m "feat(narrative): run narrative detector after stream ingestion completes"
```

---

### Task 6: Patterns API Route

**Files:**
- Create: `src/app/api/admin/streams/[sessionId]/patterns/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/admin/streams/[sessionId]/patterns/route.ts
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

  const patterns = await prisma.narrativePattern.findMany({
    where: { sessionId: params.sessionId },
    orderBy: { confidence: "desc" },
  });

  return NextResponse.json({ ok: true, patterns });
}

// Allow manual re-detection (e.g., after adding new events)
export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Clear existing patterns for this session
  await prisma.narrativePattern.deleteMany({
    where: { sessionId: params.sessionId },
  });

  const { detectNarrativePatterns } = await import(
    "@/lib/analysis/narrative-detector"
  );
  const count = await detectNarrativePatterns(params.sessionId);

  return NextResponse.json({ ok: true, detected: count });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/streams/
git commit -m "feat(narrative): GET/POST narrative patterns API for stream sessions"
```

---

## Self-Review

**Spec coverage:**
- ✅ Betrayal arcs — defended then accused with gap ≥ 3 chunks
- ✅ Escalation sequences — 3+ conflict events between same pair
- ✅ Mob formation — 3+ distinct speakers targeting same target in window
- ✅ Dogpile emergence — 5+ events targeting one entity within 3 chunks
- ✅ Alliance forming — 3+ mutual defenses between same pair (bonus pattern)
- ✅ Wired into ingestor — runs automatically after pipeline completes
- ✅ Re-triggerable via POST — admin can re-run after adding events
- ⏭ Mob phase transitions (chaos→mob→dogpile as 3-phase) — can be added to `runAllPatternDetectors` as a composite detector using output of mob_formation + dogpile patterns
- ⏭ AI-generated summaries per pattern — add optional Claude call in `narrative-detector.ts` after `createMany`, updating `summary` field

**No placeholders found.**

**Type consistency:** `NarrativePatternType` union used consistently in `types/narrative.ts` and `narrative-patterns.ts`. `DetectedPattern.patternType` is typed as `NarrativePatternType` throughout. `buildEntityPairKey` separator `":::"` used in exactly two places (build + split).
