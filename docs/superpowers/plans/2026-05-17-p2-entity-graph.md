# Phase 2 — Plan 1: Entity Graph System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a temporal, stateful relationship graph to PsychenomiconEntity so Hermes can track how relationships between people evolve across episodes.

**Architecture:** Extend the existing Prisma schema with `EntityRelationship` and `EntityInteraction` models. A state-machine service enforces valid transitions (forming → stable → decaying → broken → reforming). A graph query service exposes relationship data to the Oracle and UI. Factual interactions are stored separately from interpretations.

**Tech Stack:** Prisma (PostgreSQL/Xata), TypeScript, Next.js App Router API routes, Vitest

---

## File Structure

- Create: `src/types/graph.ts` — shared TS types for graph models
- Create: `src/lib/graph/relationship-state.ts` — state machine (transitions, validation)
- Create: `src/lib/graph/entity-graph.ts` — query service (neighbors, relationship list, risk summary)
- Create: `src/lib/graph/__tests__/relationship-state.test.ts`
- Create: `src/lib/graph/__tests__/entity-graph.test.ts`
- Create: `src/app/api/graph/[entityId]/route.ts` — GET /api/graph/:entityId
- Create: `src/app/api/admin/graph/relationship/route.ts` — POST (create/update relationship)
- Modify: `prisma/schema.prisma` — add EntityRelationship, EntityInteraction, RelationshipState enum
- Create: `prisma/migrations/20260517000000_entity_graph/migration.sql`

---

### Task 1: Shared Graph Types

**Files:**
- Create: `src/types/graph.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/graph.ts

export type RelationshipState =
  | "forming"
  | "stable"
  | "decaying"
  | "broken"
  | "reforming";

export interface RiskProfile {
  escalationRisk: number;   // 0–1
  stabilityScore: number;   // 0–1
  manipulationIndex: number; // 0–1
  loyaltyVolatility: number; // 0–1
}

export interface RelationshipStateChange {
  from: RelationshipState;
  to: RelationshipState;
  at: string; // ISO timestamp
  reason?: string;
}

export interface EntityRelationship {
  id: string;
  entityAId: string;
  entityBId: string;
  state: RelationshipState;
  riskProfile: RiskProfile;
  stateHistory: RelationshipStateChange[];
  lastInteractionAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntityInteraction {
  id: string;
  relationshipId: string;
  episodeId: string | null;
  chapterNumber: number | null;
  eventType: string;
  speaker: string | null;
  target: string | null;
  rawText: string | null;
  timestampSeconds: number | null;
  stateBefore: RelationshipState;
  stateAfter: RelationshipState;
  createdAt: string;
}

export interface EntityGraphNode {
  entityId: string;
  entityName: string;
  entitySlug: string;
  relationships: EntityRelationship[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/graph.ts
git commit -m "feat(graph): add shared graph TypeScript types"
```

---

### Task 2: Relationship State Machine

**Files:**
- Create: `src/lib/graph/relationship-state.ts`
- Create: `src/lib/graph/__tests__/relationship-state.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/graph/__tests__/relationship-state.test.ts
import { describe, it, expect } from "vitest";
import {
  isValidTransition,
  applyTransition,
  ALLOWED_TRANSITIONS,
} from "../relationship-state";
import type { RelationshipState, RelationshipStateChange } from "@/types/graph";

describe("isValidTransition", () => {
  it("allows forming → stable", () => {
    expect(isValidTransition("forming", "stable")).toBe(true);
  });

  it("allows stable → decaying", () => {
    expect(isValidTransition("stable", "decaying")).toBe(true);
  });

  it("allows decaying → broken", () => {
    expect(isValidTransition("decaying", "broken")).toBe(true);
  });

  it("allows broken → reforming", () => {
    expect(isValidTransition("broken", "reforming")).toBe(true);
  });

  it("allows reforming → stable", () => {
    expect(isValidTransition("reforming", "stable")).toBe(true);
  });

  it("allows stable → broken (rapid collapse)", () => {
    expect(isValidTransition("stable", "broken")).toBe(true);
  });

  it("rejects stable → forming (cannot go back to forming)", () => {
    expect(isValidTransition("stable", "forming")).toBe(false);
  });

  it("rejects same-state transition", () => {
    expect(isValidTransition("stable", "stable")).toBe(false);
  });
});

describe("applyTransition", () => {
  it("returns updated history with new entry", () => {
    const history: RelationshipStateChange[] = [];
    const result = applyTransition("forming", "stable", history, "alliance formed");
    expect(result.newHistory).toHaveLength(1);
    expect(result.newHistory[0].from).toBe("forming");
    expect(result.newHistory[0].to).toBe("stable");
    expect(result.newHistory[0].reason).toBe("alliance formed");
  });

  it("throws on invalid transition", () => {
    expect(() =>
      applyTransition("stable", "forming", [], undefined)
    ).toThrow("Invalid transition");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/graph/__tests__/relationship-state.test.ts
```
Expected: FAIL — "Cannot find module '../relationship-state'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/graph/relationship-state.ts
import type { RelationshipState, RelationshipStateChange } from "@/types/graph";

export const ALLOWED_TRANSITIONS: Record<RelationshipState, RelationshipState[]> = {
  forming:   ["stable", "decaying", "broken"],
  stable:    ["decaying", "broken"],
  decaying:  ["broken", "stable"],
  broken:    ["reforming"],
  reforming: ["stable", "broken"],
};

export function isValidTransition(
  from: RelationshipState,
  to: RelationshipState
): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function applyTransition(
  from: RelationshipState,
  to: RelationshipState,
  history: RelationshipStateChange[],
  reason: string | undefined
): { newState: RelationshipState; newHistory: RelationshipStateChange[] } {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
  const entry: RelationshipStateChange = {
    from,
    to,
    at: new Date().toISOString(),
    ...(reason ? { reason } : {}),
  };
  return { newState: to, newHistory: [...history, entry] };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/graph/__tests__/relationship-state.test.ts
```
Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph/relationship-state.ts src/lib/graph/__tests__/relationship-state.test.ts
git commit -m "feat(graph): relationship state machine with transition validation"
```

---

### Task 3: Prisma Schema — EntityRelationship + EntityInteraction

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260517000000_entity_graph/migration.sql`

- [ ] **Step 1: Add models to schema**

Add after the `PsychenomiconThreadChapter` model in `prisma/schema.prisma`:

```prisma
// ─── Entity Graph ──────────────────────────────────────────────────────────

enum RelationshipState {
  forming
  stable
  decaying
  broken
  reforming
}

model EntityRelationship {
  id                String              @id @default(cuid())
  entityAId         String
  entityA           PsychenomiconEntity @relation("RelationshipA", fields: [entityAId], references: [id], onDelete: Cascade)
  entityBId         String
  entityB           PsychenomiconEntity @relation("RelationshipB", fields: [entityBId], references: [id], onDelete: Cascade)
  state             RelationshipState   @default(forming)
  escalationRisk    Float               @default(0.5)
  stabilityScore    Float               @default(0.5)
  manipulationIndex Float               @default(0.0)
  loyaltyVolatility Float               @default(0.5)
  stateHistory      Json                @default("[]")
  lastInteractionAt DateTime?
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  interactions EntityInteraction[]

  @@unique([entityAId, entityBId])
  @@index([entityAId])
  @@index([entityBId])
  @@index([state])
}

model EntityInteraction {
  id               String             @id @default(cuid())
  relationshipId   String
  relationship     EntityRelationship @relation(fields: [relationshipId], references: [id], onDelete: Cascade)
  episodeId        String?
  chapterNumber    Int?
  eventType        String
  speaker          String?
  target           String?
  rawText          String?            @db.Text
  timestampSeconds Int?
  stateBefore      RelationshipState
  stateAfter       RelationshipState
  createdAt        DateTime           @default(now())

  @@index([relationshipId])
  @@index([episodeId])
  @@index([chapterNumber])
}
```

Also add the back-relations on `PsychenomiconEntity` (find the model and add):
```prisma
  relationshipsAsA EntityRelationship[] @relation("RelationshipA")
  relationshipsAsB EntityRelationship[] @relation("RelationshipB")
```

- [ ] **Step 2: Generate migration SQL**

```bash
cd C:/Users/johnb/cultcodex-ui
npx prisma migrate dev --name entity_graph --create-only
```

Expected: Creates `prisma/migrations/20260517000000_entity_graph/migration.sql` (timestamp may differ)

- [ ] **Step 3: Apply migration**

```bash
npx prisma migrate deploy
```
Expected: Migration applied successfully.

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(graph): add EntityRelationship and EntityInteraction schema"
```

---

### Task 4: Entity Graph Query Service

**Files:**
- Create: `src/lib/graph/entity-graph.ts`
- Create: `src/lib/graph/__tests__/entity-graph.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/graph/__tests__/entity-graph.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEntityRelationships, computeRiskSummary } from "../entity-graph";
import type { RelationshipState } from "@/types/graph";

// Mock prisma
vi.mock("@/lib/db", () => ({
  prisma: {
    entityRelationship: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("computeRiskSummary", () => {
  it("returns highest escalation risk from relationships", () => {
    const rels = [
      { escalationRisk: 0.3, stabilityScore: 0.8, manipulationIndex: 0.1, loyaltyVolatility: 0.2 },
      { escalationRisk: 0.9, stabilityScore: 0.2, manipulationIndex: 0.7, loyaltyVolatility: 0.8 },
    ];
    const summary = computeRiskSummary(rels as any);
    expect(summary.maxEscalationRisk).toBe(0.9);
    expect(summary.avgStabilityScore).toBeCloseTo(0.5);
  });

  it("returns safe defaults for empty array", () => {
    const summary = computeRiskSummary([]);
    expect(summary.maxEscalationRisk).toBe(0);
    expect(summary.avgStabilityScore).toBe(1);
  });
});

describe("getEntityRelationships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries relationships for both directions", async () => {
    (prisma.entityRelationship.findMany as any).mockResolvedValue([]);
    await getEntityRelationships("entity-123");
    expect(prisma.entityRelationship.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { entityAId: "entity-123" },
            { entityBId: "entity-123" },
          ]),
        }),
      })
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/graph/__tests__/entity-graph.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/graph/entity-graph.ts
import { prisma } from "@/lib/db";
import type { RiskProfile } from "@/types/graph";

export interface RiskSummary {
  maxEscalationRisk: number;
  avgStabilityScore: number;
  maxManipulationIndex: number;
  avgLoyaltyVolatility: number;
}

export function computeRiskSummary(
  rels: Array<Pick<RiskProfile, "escalationRisk" | "stabilityScore" | "manipulationIndex" | "loyaltyVolatility">>
): RiskSummary {
  if (rels.length === 0) {
    return { maxEscalationRisk: 0, avgStabilityScore: 1, maxManipulationIndex: 0, avgLoyaltyVolatility: 0 };
  }
  return {
    maxEscalationRisk: Math.max(...rels.map((r) => r.escalationRisk)),
    avgStabilityScore: rels.reduce((s, r) => s + r.stabilityScore, 0) / rels.length,
    maxManipulationIndex: Math.max(...rels.map((r) => r.manipulationIndex)),
    avgLoyaltyVolatility: rels.reduce((s, r) => s + r.loyaltyVolatility, 0) / rels.length,
  };
}

export async function getEntityRelationships(entityId: string) {
  return prisma.entityRelationship.findMany({
    where: {
      OR: [{ entityAId: entityId }, { entityBId: entityId }],
    },
    include: {
      entityA: { select: { id: true, name: true, slug: true } },
      entityB: { select: { id: true, name: true, slug: true } },
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEntityGraph(entityId: string) {
  const relationships = await getEntityRelationships(entityId);
  const riskSummary = computeRiskSummary(relationships);
  return { relationships, riskSummary };
}

export async function upsertRelationship(
  entityAId: string,
  entityBId: string,
  data: Partial<{
    state: string;
    escalationRisk: number;
    stabilityScore: number;
    manipulationIndex: number;
    loyaltyVolatility: number;
    stateHistory: unknown[];
    lastInteractionAt: Date;
  }>
) {
  // Always store with lower ID first to avoid duplicates
  const [aId, bId] = [entityAId, entityBId].sort();
  return prisma.entityRelationship.upsert({
    where: { entityAId_entityBId: { entityAId: aId, entityBId: bId } },
    create: { entityAId: aId, entityBId: bId, ...data } as any,
    update: data as any,
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/graph/__tests__/entity-graph.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph/entity-graph.ts src/lib/graph/__tests__/entity-graph.test.ts
git commit -m "feat(graph): entity graph query service with risk summary"
```

---

### Task 5: Graph Read API Route

**Files:**
- Create: `src/app/api/graph/[entityId]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/graph/[entityId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getEntityGraph } from "@/lib/graph/entity-graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  const { entityId } = params;
  if (!entityId) {
    return NextResponse.json({ ok: false, error: "entityId required" }, { status: 400 });
  }
  const graph = await getEntityGraph(entityId);
  return NextResponse.json({ ok: true, ...graph });
}
```

- [ ] **Step 2: Manual smoke test**

Start the dev server: `npm run dev`

```bash
curl http://localhost:3000/api/graph/SOME_ENTITY_ID
```
Expected: `{ "ok": true, "relationships": [], "riskSummary": { ... } }`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/graph/
git commit -m "feat(graph): GET /api/graph/[entityId] route"
```

---

### Task 6: Admin Route — Create/Update Relationship

**Files:**
- Create: `src/app/api/admin/graph/relationship/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/admin/graph/relationship/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyTransition } from "@/lib/graph/relationship-state";
import { upsertRelationship } from "@/lib/graph/entity-graph";
import type { RelationshipState } from "@/types/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const {
    entityAId,
    entityBId,
    targetState,
    eventType,
    speaker,
    target,
    rawText,
    episodeId,
    chapterNumber,
    reason,
    escalationRisk,
    stabilityScore,
    manipulationIndex,
    loyaltyVolatility,
  } = body as {
    entityAId: string;
    entityBId: string;
    targetState?: RelationshipState;
    eventType?: string;
    speaker?: string;
    target?: string;
    rawText?: string;
    episodeId?: string;
    chapterNumber?: number;
    reason?: string;
    escalationRisk?: number;
    stabilityScore?: number;
    manipulationIndex?: number;
    loyaltyVolatility?: number;
  };

  if (!entityAId || !entityBId) {
    return NextResponse.json({ ok: false, error: "entityAId and entityBId required" }, { status: 400 });
  }

  const [aId, bId] = [entityAId, entityBId].sort();

  const existing = await prisma.entityRelationship.findUnique({
    where: { entityAId_entityBId: { entityAId: aId, entityBId: bId } },
  });

  let newState: RelationshipState = existing?.state as RelationshipState ?? "forming";
  let newHistory = (existing?.stateHistory as any[]) ?? [];

  if (targetState && targetState !== newState) {
    try {
      const result = applyTransition(newState, targetState, newHistory, reason);
      newState = result.newState;
      newHistory = result.newHistory;
    } catch (err: any) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 422 });
    }
  }

  const rel = await upsertRelationship(aId, bId, {
    state: newState,
    stateHistory: newHistory,
    lastInteractionAt: new Date(),
    ...(escalationRisk !== undefined && { escalationRisk }),
    ...(stabilityScore !== undefined && { stabilityScore }),
    ...(manipulationIndex !== undefined && { manipulationIndex }),
    ...(loyaltyVolatility !== undefined && { loyaltyVolatility }),
  });

  if (eventType) {
    const stateBefore: RelationshipState = (existing?.state as RelationshipState) ?? "forming";
    await prisma.entityInteraction.create({
      data: {
        relationshipId: rel.id,
        episodeId: episodeId ?? null,
        chapterNumber: chapterNumber ?? null,
        eventType,
        speaker: speaker ?? null,
        target: target ?? null,
        rawText: rawText ?? null,
        stateBefore,
        stateAfter: newState,
      },
    });
  }

  return NextResponse.json({ ok: true, relationship: rel });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/graph/
git commit -m "feat(graph): admin POST route to create/transition entity relationships"
```

---

### Task 7: Wire Entity Graph into Oracle Context

**Files:**
- Modify: `src/app/api/oracle/ask/route.ts`

- [ ] **Step 1: Add graph context to Oracle search**

In `src/app/api/oracle/ask/route.ts`, update `searchArchive` to include relationship data when a person query is detected:

```typescript
// Add after existing imports:
import { getEntityRelationships } from "@/lib/graph/entity-graph";
```

Add this function after `searchArchive`:

```typescript
async function searchEntityGraph(question: string, people: { id: string; displayName: string; slug: string; shortBio: string | null; loreSummary: string | null }[]) {
  if (people.length === 0) return [];

  // Find entity by person slug
  const entities = await prisma.psychenomiconEntity.findMany({
    where: {
      OR: people.map((p) => ({ personSlug: p.slug })),
    },
    select: { id: true, name: true, personSlug: true },
  });

  if (entities.length === 0) return [];

  const allRels = await Promise.all(
    entities.map((e) => getEntityRelationships(e.id))
  );

  return allRels.flat();
}
```

In `buildContext`, add graph context section after people section:

```typescript
// Add graph relationships if present
if (graphRels && graphRels.length > 0) {
  parts.push("\n=== ENTITY RELATIONSHIPS (graph) ===");
  for (const rel of graphRels.slice(0, 4)) {
    const nameA = (rel as any).entityA?.name ?? rel.entityAId;
    const nameB = (rel as any).entityB?.name ?? rel.entityBId;
    parts.push(`${nameA} ↔ ${nameB}: ${rel.state} (escalation risk: ${rel.escalationRisk.toFixed(2)})`);
  }
}
```

Update the `POST` handler to call `searchEntityGraph` and pass the result to `buildContext`.

- [ ] **Step 2: Update `buildContext` signature**

```typescript
function buildContext(
  data: Awaited<ReturnType<typeof searchArchive>>,
  graphRels?: Awaited<ReturnType<typeof import("@/lib/graph/entity-graph").getEntityRelationships>>
): { contextText: string; citations: OracleCitation[] }
```

- [ ] **Step 3: Run smoke test via Oracle UI**

Ask the Oracle: "What is the relationship between [PersonA] and [PersonB]?"
Expected: Oracle response should reference relationship state if graph data exists.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/oracle/ask/route.ts
git commit -m "feat(graph): pipe entity relationship graph into Oracle context"
```

---

## Self-Review

**Spec coverage:**
- ✅ Entity + Relationship + Interaction models
- ✅ Relationship state machine (forming → stable → decaying → broken → reforming)
- ✅ Risk profiles (escalationRisk, stabilityScore, manipulationIndex, loyaltyVolatility)
- ✅ Relationships are temporal and evolving (stateHistory)
- ✅ Oracle integration
- ⏭ Alliance strengthening / betrayal trajectory queries — addressed in Plan 4 (Confidence layer)
- ⏭ UI graph visualization — not in scope for this plan (existing `entity-network-graph.tsx` can be extended separately)

**No placeholders found.**

**Type consistency:** `RelationshipState` used consistently as string union in types and Prisma enum. `upsertRelationship` uses `[aId, bId].sort()` convention throughout.
