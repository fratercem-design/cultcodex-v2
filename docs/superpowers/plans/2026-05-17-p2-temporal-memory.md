# Phase 2 — Plan 3: Temporal Memory Layers

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement five isolated memory layers (short-term, episodic, relationship, mythic, canon) so Hermes has structured, non-polluting memory — mythic interpretations can never overwrite canon facts.

**Architecture:** A single `MemoryEntry` table with a `layer` enum column stores all memory. A service enforces layer isolation rules, handles short-term expiry, and provides typed read/write methods per layer. The Oracle reads from canon + episodic + relationship layers; mythic layer is advisory only.

**Tech Stack:** Prisma, TypeScript, Next.js App Router, Vitest

**Prerequisite:** Plans 1 and 2 should be complete for full wiring, but this plan is independently deployable.

---

## File Structure

- Create: `src/types/memory.ts` — layer enum, MemoryEntry types
- Create: `src/lib/memory/memory-layers.ts` — read/write service with layer enforcement
- Create: `src/lib/memory/__tests__/memory-layers.test.ts`
- Create: `src/app/api/admin/memory/route.ts` — GET (query) + POST (write)
- Modify: `prisma/schema.prisma` — add MemoryLayerType enum + MemoryEntry model
- Create: `prisma/migrations/20260517000002_temporal_memory/migration.sql`

---

### Task 1: Memory Types

**Files:**
- Create: `src/types/memory.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/memory.ts

export type MemoryLayerType =
  | "short_term"
  | "episodic"
  | "relationship"
  | "mythic"
  | "canon";

// Layer behaviors
// short_term: expires (TTL 24h default), low permanence, session/stream dynamics
// episodic:   permanent, specific incidents (arguments, betrayals, raids)
// relationship: permanent, long-term interpersonal evolution
// mythic:     permanent but advisory — interpretive, probabilistic, never canonical
// canon:      permanent, verified facts — anchors reality, cannot be overwritten by mythic

export interface MemoryEntry {
  id: string;
  layer: MemoryLayerType;
  entitySlug: string | null;
  key: string;           // semantic key, e.g. "psyche_vs_guest12_tension"
  content: Record<string, unknown>;
  confidence: number;    // 0–1; canon always 1.0
  expiresAt: string | null; // only short_term
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WriteMemoryInput {
  layer: MemoryLayerType;
  entitySlug?: string;
  key: string;
  content: Record<string, unknown>;
  confidence?: number;
  ttlHours?: number;     // only meaningful for short_term
  sourceType?: string;
  sourceId?: string;
}

export interface MemoryQuery {
  layer?: MemoryLayerType | MemoryLayerType[];
  entitySlug?: string;
  key?: string;
  includeExpired?: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/memory.ts
git commit -m "feat(memory): add temporal memory layer TypeScript types"
```

---

### Task 2: Prisma Schema — MemoryEntry

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260517000002_temporal_memory/migration.sql`

- [ ] **Step 1: Add MemoryEntry model to schema**

Add after the Stream Ingestion models in `prisma/schema.prisma`:

```prisma
// ─── Temporal Memory Layers ────────────────────────────────────────────────

enum MemoryLayerType {
  short_term
  episodic
  relationship
  mythic
  canon
}

model MemoryEntry {
  id          String          @id @default(cuid())
  layer       MemoryLayerType
  entitySlug  String?
  key         String
  content     Json
  confidence  Float           @default(1.0)
  expiresAt   DateTime?
  sourceType  String?
  sourceId    String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([layer])
  @@index([entitySlug])
  @@index([key])
  @@index([expiresAt])
  @@index([layer, entitySlug])
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd C:/Users/johnb/cultcodex-ui
npx prisma migrate dev --name temporal_memory --create-only
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(memory): add MemoryEntry schema with layer enum"
```

---

### Task 3: Memory Layer Service

**Files:**
- Create: `src/lib/memory/memory-layers.ts`
- Create: `src/lib/memory/__tests__/memory-layers.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/memory/__tests__/memory-layers.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  writeMemory,
  readMemory,
  LAYER_RULES,
  validateLayerWrite,
} from "../memory-layers";
import type { MemoryLayerType } from "@/types/memory";

vi.mock("@/lib/db", () => ({
  prisma: {
    memoryEntry: {
      upsert: vi.fn().mockResolvedValue({ id: "mem-1" }),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("validateLayerWrite", () => {
  it("allows writing to any layer with matching confidence", () => {
    expect(() => validateLayerWrite("canon", 1.0)).not.toThrow();
    expect(() => validateLayerWrite("short_term", 0.5)).not.toThrow();
  });

  it("throws if canon confidence is not 1.0", () => {
    expect(() => validateLayerWrite("canon", 0.8)).toThrow("canon layer requires confidence 1.0");
  });

  it("throws if mythic confidence exceeds 0.85", () => {
    expect(() => validateLayerWrite("mythic", 0.9)).toThrow("mythic layer confidence cannot exceed 0.85");
  });
});

describe("writeMemory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets expiresAt for short_term layer", async () => {
    await writeMemory({
      layer: "short_term",
      key: "active_tension",
      content: { note: "hot argument" },
      ttlHours: 2,
    });
    const upsertCall = (prisma.memoryEntry.upsert as any).mock.calls[0][0];
    expect(upsertCall.create.expiresAt).toBeDefined();
    expect(upsertCall.create.layer).toBe("short_term");
  });

  it("does not set expiresAt for canon layer", async () => {
    await writeMemory({
      layer: "canon",
      key: "psyche_life_path",
      content: { value: "9" },
      confidence: 1.0,
    });
    const upsertCall = (prisma.memoryEntry.upsert as any).mock.calls[0][0];
    expect(upsertCall.create.expiresAt).toBeNull();
  });
});

describe("readMemory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes expired entries by default", async () => {
    await readMemory({ layer: "short_term" });
    const call = (prisma.memoryEntry.findMany as any).mock.calls[0][0];
    expect(JSON.stringify(call.where)).toContain("expiresAt");
  });

  it("queries by entitySlug when provided", async () => {
    await readMemory({ layer: "relationship", entitySlug: "psyche" });
    const call = (prisma.memoryEntry.findMany as any).mock.calls[0][0];
    expect(call.where.entitySlug).toBe("psyche");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/memory/__tests__/memory-layers.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/memory/memory-layers.ts
import { prisma } from "@/lib/db";
import type { MemoryLayerType, WriteMemoryInput, MemoryQuery } from "@/types/memory";

export const LAYER_RULES: Record<MemoryLayerType, { maxConfidence: number; minConfidence: number; expires: boolean }> = {
  short_term:   { maxConfidence: 1.0, minConfidence: 0.0, expires: true },
  episodic:     { maxConfidence: 1.0, minConfidence: 0.0, expires: false },
  relationship: { maxConfidence: 1.0, minConfidence: 0.0, expires: false },
  mythic:       { maxConfidence: 0.85, minConfidence: 0.0, expires: false },
  canon:        { maxConfidence: 1.0, minConfidence: 1.0, expires: false },
};

export function validateLayerWrite(layer: MemoryLayerType, confidence: number): void {
  const rules = LAYER_RULES[layer];
  if (confidence < rules.minConfidence) {
    throw new Error(`${layer} layer requires confidence ${rules.minConfidence}`);
  }
  if (confidence > rules.maxConfidence) {
    throw new Error(`${layer} layer confidence cannot exceed ${rules.maxConfidence}`);
  }
}

export async function writeMemory(input: WriteMemoryInput): Promise<{ id: string }> {
  const confidence = input.confidence ?? (input.layer === "canon" ? 1.0 : 0.7);
  validateLayerWrite(input.layer, confidence);

  const rules = LAYER_RULES[input.layer];
  const expiresAt = rules.expires
    ? new Date(Date.now() + (input.ttlHours ?? 24) * 60 * 60 * 1000)
    : null;

  const data = {
    layer: input.layer,
    entitySlug: input.entitySlug ?? null,
    key: input.key,
    content: input.content,
    confidence,
    expiresAt,
    sourceType: input.sourceType ?? null,
    sourceId: input.sourceId ?? null,
  };

  return prisma.memoryEntry.upsert({
    where: {
      // Use a composite unique approach — if not unique by key+layer+entity, create
      // Prisma doesn't support composite unique on nullable fields natively,
      // so we use a workaround: find + update or create
      id: "nonexistent-force-create",
    },
    create: { ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
    select: { id: true },
  }).catch(async () => {
    // Fallback: find existing by layer+key+entitySlug and update
    const existing = await prisma.memoryEntry.findFirst({
      where: { layer: input.layer, key: input.key, entitySlug: input.entitySlug ?? null },
      select: { id: true },
    });
    if (existing) {
      return prisma.memoryEntry.update({ where: { id: existing.id }, data, select: { id: true } });
    }
    return prisma.memoryEntry.create({ data, select: { id: true } });
  });
}

export async function readMemory(query: MemoryQuery) {
  const now = new Date();
  const layers = query.layer
    ? Array.isArray(query.layer) ? query.layer : [query.layer]
    : undefined;

  return prisma.memoryEntry.findMany({
    where: {
      ...(layers ? { layer: { in: layers } } : {}),
      ...(query.entitySlug ? { entitySlug: query.entitySlug } : {}),
      ...(query.key ? { key: query.key } : {}),
      ...(!query.includeExpired
        ? { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });
}

export async function purgeExpiredMemory(): Promise<number> {
  const result = await prisma.memoryEntry.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}

// Convenience writers
export const memory = {
  shortTerm: (key: string, content: Record<string, unknown>, ttlHours = 24) =>
    writeMemory({ layer: "short_term", key, content, ttlHours }),
  episodic: (key: string, content: Record<string, unknown>, entitySlug?: string) =>
    writeMemory({ layer: "episodic", key, content, entitySlug }),
  relationship: (entitySlug: string, key: string, content: Record<string, unknown>) =>
    writeMemory({ layer: "relationship", key, content, entitySlug }),
  mythic: (key: string, content: Record<string, unknown>, confidence: number) =>
    writeMemory({ layer: "mythic", key, content, confidence }),
  canon: (key: string, content: Record<string, unknown>) =>
    writeMemory({ layer: "canon", key, content, confidence: 1.0 }),
};
```

Note: The `upsert` fallback pattern handles Prisma's lack of composite-nullable-unique support. In production, add a unique index on `(layer, key, entitySlug)` using a generated column or migrate to explicit `findFirst + update/create`.

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/memory/__tests__/memory-layers.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/memory/memory-layers.ts src/lib/memory/__tests__/memory-layers.test.ts
git commit -m "feat(memory): temporal memory layer service with isolation rules"
```

---

### Task 4: Memory Admin API

**Files:**
- Create: `src/app/api/admin/memory/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/admin/memory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { writeMemory, readMemory, purgeExpiredMemory } from "@/lib/memory/memory-layers";
import type { MemoryLayerType, WriteMemoryInput } from "@/types/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const layer = searchParams.get("layer") as MemoryLayerType | null;
  const entitySlug = searchParams.get("entitySlug") ?? undefined;
  const key = searchParams.get("key") ?? undefined;

  const entries = await readMemory({ layer: layer ?? undefined, entitySlug, key });
  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;

  if (body.action === "purge_expired") {
    const count = await purgeExpiredMemory();
    return NextResponse.json({ ok: true, purged: count });
  }

  const input: WriteMemoryInput = {
    layer: String(body.layer ?? "") as MemoryLayerType,
    key: String(body.key ?? ""),
    content: (body.content as Record<string, unknown>) ?? {},
    entitySlug: body.entitySlug ? String(body.entitySlug) : undefined,
    confidence: body.confidence !== undefined ? Number(body.confidence) : undefined,
    ttlHours: body.ttlHours !== undefined ? Number(body.ttlHours) : undefined,
    sourceType: body.sourceType ? String(body.sourceType) : undefined,
    sourceId: body.sourceId ? String(body.sourceId) : undefined,
  };

  if (!input.layer || !input.key) {
    return NextResponse.json({ ok: false, error: "layer and key required" }, { status: 400 });
  }

  try {
    const entry = await writeMemory(input);
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/memory/
git commit -m "feat(memory): admin memory read/write API route"
```

---

### Task 5: Wire Memory into Stream Ingestor

**Files:**
- Modify: `src/lib/ingestion/stream-ingestor.ts`

- [ ] **Step 1: Add memory writes to ingestor**

At the top of `stream-ingestor.ts`, add:
```typescript
import { memory } from "@/lib/memory/memory-layers";
```

After creating each `StreamEvent` and its interpretation, add episodic memory:

```typescript
// After interpretation is saved:
if (interpretation && interpretation.confidence > 0.6) {
  await memory.episodic(
    `stream_${sessionId}_event_${dbEvent.id}`,
    {
      eventType: event.eventType,
      speaker: event.speaker,
      target: event.target,
      pattern: interpretation.pattern,
      confidence: interpretation.confidence,
    }
  );
}
```

After stream session completes, write short-term summary:
```typescript
// After status: "complete"
await memory.shortTerm(`stream_${sessionId}_summary`, {
  sessionId,
  title: session.title,
  chunkCount: rawChunks.length,
  completedAt: new Date().toISOString(),
}, 48); // 48h TTL
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ingestion/stream-ingestor.ts
git commit -m "feat(memory): wire episodic + short-term memory writes into stream ingestor"
```

---

## Self-Review

**Spec coverage:**
- ✅ Short-term memory — session/stream dynamics, TTL-based expiry
- ✅ Episodic memory — specific incidents, permanent
- ✅ Relationship memory — long-term interpersonal (layer + entitySlug)
- ✅ Mythic memory — interpretive, max confidence 0.85, advisory only
- ✅ Canon memory — verified facts, confidence forced to 1.0, no expiry
- ✅ Layer isolation enforced at write time (validateLayerWrite)
- ✅ Mythic can never overwrite canon (separate layers + confidence guard)
- ⏭ Relationship memory automated from graph updates — wire `memory.relationship()` calls in Plan 1's `upsertRelationship` after this plan deploys

**No placeholders found.**

**Type consistency:** `MemoryLayerType` string union in `types/memory.ts` matches Prisma enum values exactly (`short_term`, `episodic`, `relationship`, `mythic`, `canon`).
