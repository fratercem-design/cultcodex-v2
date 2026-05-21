# Phase 3 — Plan A: Entity Resolution + Aliasing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve raw entity names extracted from stream transcripts ("Alex", "@alex_tv", "Alexander") to canonical `PsychenomiconEntity` slugs so the graph stays accurate across shows.

**Architecture:** An `EntityAlias` table stores alternate names/handles per entity. A resolver service runs exact → alias → fuzzy matching in sequence, returning a slug + confidence. The stream ingestor calls the resolver after entity extraction to populate `StreamEntityMention.entitySlug`. An admin UI manages aliases and shows unresolved mentions for manual triage.

**Tech Stack:** Prisma, TypeScript, Next.js App Router, Vitest. No new dependencies — fuzzy matching uses edit-distance, not a library.

**Prerequisite:** Phase 2 complete. `PsychenomiconEntity`, `StreamEntityMention`, and `stream-ingestor.ts` exist.

---

## File Structure

- Create: `src/types/resolution.ts` — ResolvedEntity, ResolutionMatch types
- Create: `src/lib/graph/entity-resolver.ts` — resolve raw name → slug
- Create: `src/lib/graph/__tests__/entity-resolver.test.ts`
- Create: `src/app/api/admin/graph/aliases/route.ts` — GET list + POST create alias
- Create: `src/app/api/admin/graph/unresolved/route.ts` — GET unresolved mentions
- Create: `src/app/admin/graph/aliases/page.tsx` — alias management UI
- Modify: `src/lib/ingestion/stream-ingestor.ts` — call resolver after entity extraction
- Modify: `prisma/schema.prisma` — add EntityAlias model
- Create: `prisma/migrations/20260520000000_entity_alias/migration.sql`

---

### Task 1: Resolution Types

**Files:**
- Create: `src/types/resolution.ts`

- [ ] **Step 1: Write the type file**

```typescript
// src/types/resolution.ts

export type ResolutionMethod = "exact" | "alias" | "fuzzy" | "unresolved";

export interface ResolutionMatch {
  entitySlug: string;
  entityName: string;
  method: ResolutionMethod;
  confidence: number; // 0–1
}

export interface ResolvedEntity {
  rawName: string;
  match: ResolutionMatch | null;
}

export interface AliasRecord {
  id: string;
  entitySlug: string;
  alias: string;
  source: "manual" | "auto" | "stream";
  confidence: number;
  createdAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/resolution.ts
git commit -m "feat(resolution): add entity resolution TypeScript types"
```

---

### Task 2: EntityAlias Schema

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260520000000_entity_alias/migration.sql`

- [ ] **Step 1: Add EntityAlias model**

Add after the Entity Graph models in `prisma/schema.prisma`:

```prisma
// ─── Entity Aliases ────────────────────────────────────────────────────────

model EntityAlias {
  id         String   @id @default(cuid())
  entitySlug String
  alias      String
  aliasLower String
  source     String   @default("manual")
  confidence Float    @default(1.0)
  createdAt  DateTime @default(now())

  @@unique([aliasLower, entitySlug])
  @@index([aliasLower])
  @@index([entitySlug])
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
cd C:/Users/johnb/cultcodex-ui
npx prisma migrate dev --name entity_alias --create-only
npx prisma migrate deploy
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(resolution): add EntityAlias schema"
```

---

### Task 3: Edit-Distance Utility

**Files:**
- Create: `src/lib/graph/edit-distance.ts`
- Create: `src/lib/graph/__tests__/edit-distance.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/graph/__tests__/edit-distance.test.ts
import { describe, it, expect } from "vitest";
import { levenshtein, similarityScore, isFuzzyMatch } from "../edit-distance";

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("psyche", "psyche")).toBe(0);
  });

  it("returns correct distance for transposition", () => {
    expect(levenshtein("alex", "aelx")).toBe(2);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("is case sensitive (caller normalizes)", () => {
    expect(levenshtein("Alex", "alex")).toBe(1);
  });
});

describe("similarityScore", () => {
  it("returns 1.0 for identical strings", () => {
    expect(similarityScore("alex", "alex")).toBe(1.0);
  });

  it("returns lower score for more different strings", () => {
    const close = similarityScore("alex", "alek");
    const far = similarityScore("alex", "zzzzz");
    expect(close).toBeGreaterThan(far);
  });

  it("returns 0 for empty vs non-empty", () => {
    expect(similarityScore("", "abc")).toBe(0);
  });
});

describe("isFuzzyMatch", () => {
  it("matches with high similarity above threshold", () => {
    expect(isFuzzyMatch("alexander", "alexandre", 0.8)).toBe(true);
  });

  it("rejects low similarity below threshold", () => {
    expect(isFuzzyMatch("alex", "zachary", 0.8)).toBe(false);
  });

  it("matches case-insensitively", () => {
    expect(isFuzzyMatch("Alex", "alex", 0.95)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/graph/__tests__/edit-distance.test.ts
```
Expected: FAIL — "Cannot find module '../edit-distance'"

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/graph/edit-distance.ts

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export function similarityScore(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1.0;
  if (a.length === 0 || b.length === 0) return 0;
  const maxLen = Math.max(a.length, b.length);
  return (maxLen - levenshtein(a, b)) / maxLen;
}

export function isFuzzyMatch(a: string, b: string, threshold = 0.8): boolean {
  return similarityScore(a.toLowerCase(), b.toLowerCase()) >= threshold;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/graph/__tests__/edit-distance.test.ts
```
Expected: PASS — 9 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph/edit-distance.ts src/lib/graph/__tests__/edit-distance.test.ts
git commit -m "feat(resolution): levenshtein edit-distance and similarity scoring"
```

---

### Task 4: Entity Resolver Service

**Files:**
- Create: `src/lib/graph/entity-resolver.ts`
- Create: `src/lib/graph/__tests__/entity-resolver.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/graph/__tests__/entity-resolver.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveEntityName, normalizeForMatching } from "../entity-resolver";

vi.mock("@/lib/db", () => ({
  prisma: {
    psychenomiconEntity: {
      findMany: vi.fn(),
    },
    entityAlias: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

describe("normalizeForMatching", () => {
  it("lowercases and strips @handles", () => {
    expect(normalizeForMatching("@Alex_TV")).toBe("alex tv");
  });

  it("strips punctuation", () => {
    expect(normalizeForMatching("Dr. Alexander")).toBe("dr alexander");
  });

  it("collapses whitespace", () => {
    expect(normalizeForMatching("  Alex   Smith  ")).toBe("alex smith");
  });
});

describe("resolveEntityName", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns exact match with confidence 1.0", async () => {
    (prisma.psychenomiconEntity.findMany as any).mockResolvedValue([
      { slug: "psyche", name: "Psyche" },
    ]);
    (prisma.entityAlias.findMany as any).mockResolvedValue([]);

    const result = await resolveEntityName("Psyche");
    expect(result?.match?.method).toBe("exact");
    expect(result?.match?.confidence).toBe(1.0);
    expect(result?.match?.entitySlug).toBe("psyche");
  });

  it("returns alias match with confidence 0.95", async () => {
    (prisma.psychenomiconEntity.findMany as any).mockResolvedValue([
      { slug: "alex-smith", name: "Alexander Smith" },
    ]);
    (prisma.entityAlias.findMany as any).mockResolvedValue([
      { entitySlug: "alex-smith", aliasLower: "alex", confidence: 0.95 },
    ]);

    const result = await resolveEntityName("Alex");
    expect(result?.match?.method).toBe("alias");
    expect(result?.match?.entitySlug).toBe("alex-smith");
  });

  it("returns null match for unknown name with low similarity", async () => {
    (prisma.psychenomiconEntity.findMany as any).mockResolvedValue([
      { slug: "psyche", name: "Psyche" },
    ]);
    (prisma.entityAlias.findMany as any).mockResolvedValue([]);

    const result = await resolveEntityName("Zyx Qqq");
    expect(result?.match).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/graph/__tests__/entity-resolver.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/graph/entity-resolver.ts
import { prisma } from "@/lib/db";
import { similarityScore } from "./edit-distance";
import type { ResolvedEntity, ResolutionMatch } from "@/types/resolution";

export function normalizeForMatching(raw: string): string {
  return raw
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const FUZZY_THRESHOLD = 0.82;

export async function resolveEntityName(rawName: string): Promise<ResolvedEntity> {
  const normalized = normalizeForMatching(rawName);

  const [entities, aliases] = await Promise.all([
    prisma.psychenomiconEntity.findMany({
      select: { slug: true, name: true },
    }),
    prisma.entityAlias.findMany({
      select: { entitySlug: true, aliasLower: true, confidence: true },
    }),
  ]);

  // 1. Exact name match (case-insensitive)
  const exactEntity = entities.find(
    (e) => e.name.toLowerCase() === normalized
  );
  if (exactEntity) {
    return {
      rawName,
      match: {
        entitySlug: exactEntity.slug,
        entityName: exactEntity.name,
        method: "exact",
        confidence: 1.0,
      },
    };
  }

  // 2. Alias match
  const aliasMatch = aliases.find((a) => a.aliasLower === normalized);
  if (aliasMatch) {
    const entity = entities.find((e) => e.slug === aliasMatch.entitySlug);
    if (entity) {
      return {
        rawName,
        match: {
          entitySlug: entity.slug,
          entityName: entity.name,
          method: "alias",
          confidence: aliasMatch.confidence,
        },
      };
    }
  }

  // 3. Fuzzy match against entity names
  let bestMatch: ResolutionMatch | null = null;
  let bestScore = 0;

  for (const entity of entities) {
    const entityNorm = normalizeForMatching(entity.name);
    const score = similarityScore(normalized, entityNorm);
    if (score >= FUZZY_THRESHOLD && score > bestScore) {
      bestScore = score;
      bestMatch = {
        entitySlug: entity.slug,
        entityName: entity.name,
        method: "fuzzy",
        confidence: Math.round(score * 100) / 100,
      };
    }
  }

  // 4. Fuzzy match against alias strings
  if (!bestMatch) {
    for (const alias of aliases) {
      const score = similarityScore(normalized, alias.aliasLower);
      if (score >= FUZZY_THRESHOLD && score > bestScore) {
        const entity = entities.find((e) => e.slug === alias.entitySlug);
        if (entity) {
          bestScore = score;
          bestMatch = {
            entitySlug: entity.slug,
            entityName: entity.name,
            method: "fuzzy",
            confidence: Math.round(score * 100) / 100,
          };
        }
      }
    }
  }

  return { rawName, match: bestMatch };
}

export async function resolveEntityNames(
  rawNames: string[]
): Promise<ResolvedEntity[]> {
  // Fetch DB data once, resolve all names against same snapshot
  const [entities, aliases] = await Promise.all([
    prisma.psychenomiconEntity.findMany({ select: { slug: true, name: true } }),
    prisma.entityAlias.findMany({
      select: { entitySlug: true, aliasLower: true, confidence: true },
    }),
  ]);

  return rawNames.map((rawName) => {
    const normalized = normalizeForMatching(rawName);

    const exactEntity = entities.find((e) => e.name.toLowerCase() === normalized);
    if (exactEntity) {
      return {
        rawName,
        match: { entitySlug: exactEntity.slug, entityName: exactEntity.name, method: "exact" as const, confidence: 1.0 },
      };
    }

    const aliasMatch = aliases.find((a) => a.aliasLower === normalized);
    if (aliasMatch) {
      const entity = entities.find((e) => e.slug === aliasMatch.entitySlug);
      if (entity) {
        return {
          rawName,
          match: { entitySlug: entity.slug, entityName: entity.name, method: "alias" as const, confidence: aliasMatch.confidence },
        };
      }
    }

    let bestMatch: ResolutionMatch | null = null;
    let bestScore = 0;

    for (const entity of entities) {
      const score = similarityScore(normalized, normalizeForMatching(entity.name));
      if (score >= FUZZY_THRESHOLD && score > bestScore) {
        bestScore = score;
        bestMatch = { entitySlug: entity.slug, entityName: entity.name, method: "fuzzy" as const, confidence: Math.round(score * 100) / 100 };
      }
    }

    for (const alias of aliases) {
      const score = similarityScore(normalized, alias.aliasLower);
      if (score >= FUZZY_THRESHOLD && score > bestScore) {
        const entity = entities.find((e) => e.slug === alias.entitySlug);
        if (entity) {
          bestScore = score;
          bestMatch = { entitySlug: entity.slug, entityName: entity.name, method: "fuzzy" as const, confidence: Math.round(score * 100) / 100 };
        }
      }
    }

    return { rawName, match: bestMatch };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/graph/__tests__/entity-resolver.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/graph/entity-resolver.ts src/lib/graph/__tests__/entity-resolver.test.ts
git commit -m "feat(resolution): entity resolver — exact, alias, fuzzy matching pipeline"
```

---

### Task 5: Wire Resolver into Stream Ingestor

**Files:**
- Modify: `src/lib/ingestion/stream-ingestor.ts`

- [ ] **Step 1: Add resolver call after entity extraction**

At the top of `src/lib/ingestion/stream-ingestor.ts`, add:

```typescript
import { resolveEntityNames } from "@/lib/graph/entity-resolver";
```

Find the block where `StreamEntityMention` records are created. Currently it looks like:

```typescript
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
```

Replace with:

```typescript
if (mentions.length > 0) {
  const rawNames = mentions.map((m) => m.entityName);
  const resolved = await resolveEntityNames(rawNames);

  await prisma.streamEntityMention.createMany({
    data: mentions.map((m, i) => ({
      chunkId: chunk.id,
      entitySlug: resolved[i]?.match?.entitySlug ?? null,
      entityName: m.entityName,
      confidence: Math.min(
        m.confidence,
        resolved[i]?.match?.confidence ?? m.confidence
      ),
    })),
    skipDuplicates: true,
  });
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All passing.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ingestion/stream-ingestor.ts
git commit -m "feat(resolution): wire entity resolver into stream ingestor mention persistence"
```

---

### Task 6: Alias Management API

**Files:**
- Create: `src/app/api/admin/graph/aliases/route.ts`
- Create: `src/app/api/admin/graph/unresolved/route.ts`

- [ ] **Step 1: Write the aliases route**

```typescript
// src/app/api/admin/graph/aliases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeForMatching } from "@/lib/graph/entity-resolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const aliases = await prisma.entityAlias.findMany({
    orderBy: { entitySlug: "asc" },
  });
  return NextResponse.json({ ok: true, aliases });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const entitySlug = String(body.entitySlug ?? "").trim();
  const alias = String(body.alias ?? "").trim();
  const source = String(body.source ?? "manual") as "manual" | "auto" | "stream";

  if (!entitySlug || !alias) {
    return NextResponse.json(
      { ok: false, error: "entitySlug and alias required" },
      { status: 400 }
    );
  }

  const aliasLower = normalizeForMatching(alias);

  const record = await prisma.entityAlias.upsert({
    where: { aliasLower_entitySlug: { aliasLower, entitySlug } },
    create: { entitySlug, alias, aliasLower, source, confidence: 1.0 },
    update: { alias, source },
  });

  return NextResponse.json({ ok: true, alias: record });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  }

  await prisma.entityAlias.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write the unresolved mentions route**

```typescript
// src/app/api/admin/graph/unresolved/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Distinct entity names that never resolved to a slug
  const unresolved = await prisma.streamEntityMention.groupBy({
    by: ["entityName"],
    where: { entitySlug: null },
    _count: { entityName: true },
    orderBy: { _count: { entityName: "desc" } },
    take: 50,
  });

  return NextResponse.json({
    ok: true,
    unresolved: unresolved.map((u) => ({
      entityName: u.entityName,
      occurrences: u._count.entityName,
    })),
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/graph/aliases/ src/app/api/admin/graph/unresolved/
git commit -m "feat(resolution): alias management API and unresolved mentions report"
```

---

### Task 7: Alias Admin UI

**Files:**
- Create: `src/app/admin/graph/aliases/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/admin/graph/aliases/page.tsx
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { AliasForm } from "./alias-form";

export const dynamic = "force-dynamic";

export default async function AliasesPage() {
  await requireAdmin();

  const [aliases, unresolved, entities] = await Promise.all([
    prisma.entityAlias.findMany({ orderBy: { entitySlug: "asc" } }),
    prisma.streamEntityMention.groupBy({
      by: ["entityName"],
      where: { entitySlug: null },
      _count: { entityName: true },
      orderBy: { _count: { entityName: "desc" } },
      take: 20,
    }),
    prisma.psychenomiconEntity.findMany({
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <main id="main-content" className="p-8 max-w-4xl space-y-8">
      <h1 className="font-display text-2xl font-bold text-accent-gold">
        Entity Aliases
      </h1>

      {unresolved.length > 0 && (
        <SectionCard title="Unresolved Mentions">
          <p className="font-mono text-xs text-text-muted mb-4">
            These names appeared in streams but didn&apos;t match any entity. Add aliases to resolve them.
          </p>
          <div className="space-y-2">
            {unresolved.map((u) => (
              <div key={u.entityName} className="flex items-center justify-between gap-4 rounded border border-border bg-elevated p-2">
                <span className="font-mono text-sm text-text-primary">{u.entityName}</span>
                <span className="font-mono text-xs text-text-muted">{u._count.entityName}×</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Add Alias">
        <AliasForm entities={entities} />
      </SectionCard>

      <SectionCard title={`${aliases.length} Aliases`}>
        <div className="space-y-2">
          {aliases.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-4 rounded border border-border bg-elevated p-2">
              <div className="font-mono text-sm">
                <span className="text-accent-gold">{a.alias}</span>
                <span className="text-text-muted mx-2">→</span>
                <span className="text-text-primary">{a.entitySlug}</span>
              </div>
              <span className="font-mono text-xs text-text-muted capitalize">{a.source}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </main>
  );
}
```

- [ ] **Step 2: Write the alias form client component**

```tsx
// src/app/admin/graph/aliases/alias-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props {
  entities: { slug: string; name: string }[];
}

export function AliasForm({ entities }: Props) {
  const [alias, setAlias] = useState("");
  const [entitySlug, setEntitySlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/graph/aliases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, entitySlug, source: "manual" }),
      });
      const data = await res.json();
      if (data.ok) {
        setAlias("");
        setEntitySlug("");
        router.refresh();
      } else {
        setError(data.error ?? "Failed");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[10px] text-text-muted uppercase mb-1">
            Alias (e.g. &quot;Alex&quot;, &quot;@alex_tv&quot;)
          </label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="Alternate name or handle"
            required
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] text-text-muted uppercase mb-1">
            Maps To Entity
          </label>
          <select
            value={entitySlug}
            onChange={(e) => setEntitySlug(e.target.value)}
            required
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary focus:border-accent-gold focus:outline-none"
          >
            <option value="">— select entity —</option>
            {entities.map((e) => (
              <option key={e.slug} value={e.slug}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="font-mono text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-accent-gold px-4 py-2 font-mono text-sm font-bold text-void hover:bg-accent-gold/80 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Add Alias"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Add to admin sidebar**

In `src/components/admin/admin-sidebar.tsx`, add under the graph section (or create one):

```tsx
{ label: "Entity Aliases", href: "/admin/graph/aliases" },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/graph/ src/components/admin/admin-sidebar.tsx
git commit -m "feat(resolution): alias admin UI with unresolved mentions triage"
```

---

## Self-Review

**Spec coverage:**
- ✅ Fuzzy matching — levenshtein similarity, 0.82 threshold
- ✅ "Alex" / "Alexander" / "@alex_tv" all resolve via alias or fuzzy
- ✅ Alias table for manual + auto + stream-derived mappings
- ✅ Resolver wired into stream ingestor — `StreamEntityMention.entitySlug` populated
- ✅ Unresolved mentions surfaced in admin for triage
- ✅ `resolveEntityNames` batches DB calls — one query per ingestor chunk, not N+1

**No placeholders found.**

**Type consistency:** `ResolutionMethod` union (`"exact" | "alias" | "fuzzy" | "unresolved"`) used consistently in resolver output and types. `normalizeForMatching` used identically in resolver and alias creation route to ensure consistent key storage.
