# Phase 3 — Plan C: Stream Memory Timeline UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a post-stream intelligence report page that surfaces the emotional arc, key conflict moments, entity interaction map, narrative patterns, and best quotes from any processed stream session.

**Architecture:** A server-rendered report page at `/admin/streams/[sessionId]/report` queries `StreamChunk` (sentiment timeline), `StreamEvent` (conflict map), `NarrativePattern` (detected arcs), `StreamEntityMention` (who appeared), and `Quote`-like top moments. A `ReportBuilder` query module assembles the data. A client-rendered sentiment chart uses Recharts (already in the codebase). No new schema needed.

**Tech Stack:** Next.js App Router, Prisma, Recharts (existing), TypeScript, Tailwind CSS

**Prerequisite:** Phase 3 Plans A and B complete. `NarrativePattern`, `StreamChunk`, `StreamEvent`, `StreamEntityMention` tables exist and contain data.

---

## File Structure

- Create: `src/lib/reports/stream-report.ts` — query module assembling all report data
- Create: `src/lib/reports/__tests__/stream-report.test.ts`
- Create: `src/app/admin/streams/[sessionId]/report/page.tsx` — server-rendered report page
- Create: `src/app/admin/streams/[sessionId]/report/sentiment-chart.tsx` — client chart component
- Create: `src/app/admin/streams/[sessionId]/report/pattern-badges.tsx` — narrative pattern display
- Create: `src/app/admin/streams/[sessionId]/report/entity-grid.tsx` — entity mention summary
- Modify: `src/app/admin/streams/page.tsx` — add "View Report" link to completed sessions

---

### Task 1: Report Query Module

**Files:**
- Create: `src/lib/reports/stream-report.ts`
- Create: `src/lib/reports/__tests__/stream-report.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/reports/__tests__/stream-report.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildStreamReport, computeSentimentArc, findPeakConflictWindow } from "../stream-report";

vi.mock("@/lib/db", () => ({
  prisma: {
    streamSession: { findUniqueOrThrow: vi.fn() },
    streamChunk:   { findMany: vi.fn() },
    streamEvent:   { findMany: vi.fn() },
    narrativePattern: { findMany: vi.fn() },
    streamEntityMention: { findMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";

const mockChunks = [
  { chunkIndex: 0, sentiment: 0.3,  sentimentLabel: "positive", text: "Hello everyone." },
  { chunkIndex: 1, sentiment: -0.1, sentimentLabel: "negative", text: "Some tension here." },
  { chunkIndex: 2, sentiment: -0.6, sentimentLabel: "negative", text: "Big argument." },
  { chunkIndex: 3, sentiment: 0.5,  sentimentLabel: "positive", text: "Calmed down." },
];

describe("computeSentimentArc", () => {
  it("returns one data point per chunk with index and score", () => {
    const arc = computeSentimentArc(mockChunks as any);
    expect(arc).toHaveLength(4);
    expect(arc[0]).toEqual({ chunkIndex: 0, sentiment: 0.3 });
    expect(arc[2]).toEqual({ chunkIndex: 2, sentiment: -0.6 });
  });

  it("handles empty chunks array", () => {
    expect(computeSentimentArc([])).toEqual([]);
  });
});

describe("findPeakConflictWindow", () => {
  it("identifies the chunk window with most negative sentiment", () => {
    const peak = findPeakConflictWindow(mockChunks as any);
    expect(peak?.chunkIndex).toBe(2);
  });

  it("returns null for empty chunks", () => {
    expect(findPeakConflictWindow([])).toBeNull();
  });
});

describe("buildStreamReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.streamSession.findUniqueOrThrow as any).mockResolvedValue({
      id: "s1", title: "Test Stream", status: "complete",
      youtubeVideoId: "abc", createdAt: new Date(), completedAt: new Date(),
      _count: { chunks: 4, events: 3 },
    });
    (prisma.streamChunk.findMany as any).mockResolvedValue(mockChunks);
    (prisma.streamEvent.findMany as any).mockResolvedValue([]);
    (prisma.narrativePattern.findMany as any).mockResolvedValue([]);
    (prisma.streamEntityMention.findMany as any).mockResolvedValue([]);
  });

  it("returns report with sentimentArc and session", async () => {
    const report = await buildStreamReport("s1");
    expect(report.session.id).toBe("s1");
    expect(report.sentimentArc).toHaveLength(4);
    expect(report.peakConflict?.chunkIndex).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/reports/__tests__/stream-report.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/reports/stream-report.ts
import { prisma } from "@/lib/db";

export interface SentimentPoint {
  chunkIndex: number;
  sentiment: number;
}

export interface EntityMentionSummary {
  entityName: string;
  entitySlug: string | null;
  occurrences: number;
}

export interface ConflictEvent {
  id: string;
  eventType: string;
  speaker: string | null;
  target: string | null;
  rawText: string | null;
  chunkIndex: number | null;
}

export interface PatternSummary {
  id: string;
  patternType: string;
  involvedEntities: string[];
  confidence: number;
  chunkStart: number | null;
  chunkEnd: number | null;
  summary: string | null;
}

export interface StreamReport {
  session: {
    id: string;
    title: string | null;
    youtubeVideoId: string | null;
    status: string;
    createdAt: Date;
    completedAt: Date | null;
    chunkCount: number;
    eventCount: number;
  };
  sentimentArc: SentimentPoint[];
  peakConflict: { chunkIndex: number; sentiment: number; text: string } | null;
  topEntities: EntityMentionSummary[];
  conflictEvents: ConflictEvent[];
  patterns: PatternSummary[];
  emotionalRange: { min: number; max: number; avgPositive: number; avgNegative: number };
}

export function computeSentimentArc(
  chunks: Array<{ chunkIndex: number; sentiment: number | null }>
): SentimentPoint[] {
  return chunks
    .filter((c) => c.sentiment !== null)
    .map((c) => ({ chunkIndex: c.chunkIndex, sentiment: c.sentiment! }));
}

export function findPeakConflictWindow(
  chunks: Array<{ chunkIndex: number; sentiment: number | null; text: string }>
): { chunkIndex: number; sentiment: number; text: string } | null {
  if (chunks.length === 0) return null;
  const withSentiment = chunks.filter((c) => c.sentiment !== null);
  if (withSentiment.length === 0) return null;

  const worst = withSentiment.reduce((min, c) =>
    c.sentiment! < min.sentiment! ? c : min
  );

  return {
    chunkIndex: worst.chunkIndex,
    sentiment: worst.sentiment!,
    text: worst.text.slice(0, 300),
  };
}

function computeEmotionalRange(arc: SentimentPoint[]): StreamReport["emotionalRange"] {
  if (arc.length === 0) return { min: 0, max: 0, avgPositive: 0, avgNegative: 0 };
  const scores = arc.map((p) => p.sentiment);
  const positive = scores.filter((s) => s > 0);
  const negative = scores.filter((s) => s < 0);
  return {
    min: Math.min(...scores),
    max: Math.max(...scores),
    avgPositive: positive.length > 0 ? positive.reduce((s, v) => s + v, 0) / positive.length : 0,
    avgNegative: negative.length > 0 ? negative.reduce((s, v) => s + v, 0) / negative.length : 0,
  };
}

export async function buildStreamReport(sessionId: string): Promise<StreamReport> {
  const [session, chunks, events, patterns, mentions] = await Promise.all([
    prisma.streamSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { _count: { select: { chunks: true, events: true } } },
    }),
    prisma.streamChunk.findMany({
      where: { sessionId },
      select: { chunkIndex: true, sentiment: true, sentimentLabel: true, text: true },
      orderBy: { chunkIndex: "asc" },
    }),
    prisma.streamEvent.findMany({
      where: { sessionId },
      select: { id: true, eventType: true, speaker: true, target: true, rawText: true, chunkIndex: true },
      orderBy: { chunkIndex: "asc" },
    }),
    prisma.narrativePattern.findMany({
      where: { sessionId },
      orderBy: { confidence: "desc" },
    }),
    prisma.streamEntityMention.findMany({
      where: { chunk: { sessionId } },
      select: { entityName: true, entitySlug: true },
    }),
  ]);

  const sentimentArc = computeSentimentArc(chunks);
  const peakConflict = findPeakConflictWindow(chunks);

  // Aggregate entity mentions
  const mentionCounts = new Map<string, { slug: string | null; count: number }>();
  for (const m of mentions) {
    const existing = mentionCounts.get(m.entityName) ?? { slug: m.entitySlug, count: 0 };
    existing.count++;
    mentionCounts.set(m.entityName, existing);
  }
  const topEntities: EntityMentionSummary[] = Array.from(mentionCounts.entries())
    .map(([name, { slug, count }]) => ({ entityName: name, entitySlug: slug, occurrences: count }))
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);

  const conflictTypes = new Set([
    "interrupted", "challenged", "accused", "dismissed", "escalated", "betrayed",
  ]);
  const conflictEvents = events
    .filter((e) => conflictTypes.has(e.eventType))
    .slice(0, 20);

  return {
    session: {
      id: session.id,
      title: session.title,
      youtubeVideoId: session.youtubeVideoId,
      status: session.status,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      chunkCount: session._count.chunks,
      eventCount: session._count.events,
    },
    sentimentArc,
    peakConflict,
    topEntities,
    conflictEvents,
    patterns: patterns.map((p) => ({
      id: p.id,
      patternType: p.patternType,
      involvedEntities: p.involvedEntities,
      confidence: p.confidence,
      chunkStart: p.chunkStart,
      chunkEnd: p.chunkEnd,
      summary: p.summary,
    })),
    emotionalRange: computeEmotionalRange(sentimentArc),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/reports/__tests__/stream-report.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/stream-report.ts src/lib/reports/__tests__/stream-report.test.ts
git commit -m "feat(report): stream report query module — sentiment arc, conflict events, patterns"
```

---

### Task 2: Sentiment Chart Component

**Files:**
- Create: `src/app/admin/streams/[sessionId]/report/sentiment-chart.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/app/admin/streams/[sessionId]/report/sentiment-chart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { SentimentPoint } from "@/lib/reports/stream-report";

interface Props {
  data: SentimentPoint[];
}

function SentimentDot(props: {
  cx?: number; cy?: number; payload?: SentimentPoint;
}) {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  const color = payload.sentiment >= 0.2 ? "#4ade80"
    : payload.sentiment <= -0.2 ? "#f87171"
    : "#a1a1aa";
  return <circle cx={cx} cy={cy} r={3} fill={color} />;
}

export function SentimentChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="font-mono text-xs text-text-muted py-4">No sentiment data.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis
          dataKey="chunkIndex"
          tick={{ fontFamily: "monospace", fontSize: 10, fill: "#71717a" }}
          label={{ value: "Chunk", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "#71717a" }}
        />
        <YAxis
          domain={[-1, 1]}
          ticks={[-1, -0.5, 0, 0.5, 1]}
          tick={{ fontFamily: "monospace", fontSize: 10, fill: "#71717a" }}
        />
        <Tooltip
          contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", fontFamily: "monospace", fontSize: 11 }}
          formatter={(v: number) => [v.toFixed(2), "sentiment"]}
          labelFormatter={(l) => `Chunk ${l}`}
        />
        <ReferenceLine y={0} stroke="#52525b" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="sentiment"
          stroke="#d4af37"
          strokeWidth={2}
          dot={<SentimentDot />}
          activeDot={{ r: 5, fill: "#d4af37" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/streams/
git commit -m "feat(report): sentiment arc chart component using Recharts"
```

---

### Task 3: Pattern Badges Component

**Files:**
- Create: `src/app/admin/streams/[sessionId]/report/pattern-badges.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/app/admin/streams/[sessionId]/report/pattern-badges.tsx
import type { PatternSummary } from "@/lib/reports/stream-report";

const PATTERN_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  betrayal_arc:        { label: "Betrayal Arc",        color: "border-red-500/40 text-red-400 bg-red-500/10",    icon: "🗡" },
  escalation_sequence: { label: "Escalation",          color: "border-orange-500/40 text-orange-400 bg-orange-500/10", icon: "📈" },
  mob_formation:       { label: "Mob Formation",       color: "border-purple-500/40 text-purple-400 bg-purple-500/10", icon: "👥" },
  dogpile:             { label: "Dogpile",             color: "border-red-600/40 text-red-300 bg-red-600/10",    icon: "🌀" },
  redemption_arc:      { label: "Redemption Arc",      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", icon: "✨" },
  alliance_forming:    { label: "Alliance Forming",    color: "border-blue-500/40 text-blue-400 bg-blue-500/10", icon: "🤝" },
  chaos_spike:         { label: "Chaos Spike",         color: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10", icon: "⚡" },
};

interface Props {
  patterns: PatternSummary[];
}

export function PatternBadges({ patterns }: Props) {
  if (patterns.length === 0) {
    return (
      <p className="font-mono text-xs text-text-muted">No narrative patterns detected.</p>
    );
  }

  return (
    <div className="space-y-3">
      {patterns.map((p) => {
        const meta = PATTERN_LABELS[p.patternType] ?? {
          label: p.patternType,
          color: "border-zinc-500/40 text-zinc-400 bg-zinc-500/10",
          icon: "◆",
        };
        return (
          <div key={p.id} className={`rounded border px-3 py-2 ${meta.color}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-base">{meta.icon}</span>
                <span className="font-mono text-xs font-bold">{meta.label}</span>
                <span className="font-mono text-xs opacity-60">
                  {Math.round(p.confidence * 100)}% confidence
                </span>
              </div>
              {p.chunkStart !== null && p.chunkEnd !== null && (
                <span className="font-mono text-xs opacity-50">
                  chunks {p.chunkStart}–{p.chunkEnd}
                </span>
              )}
            </div>
            <p className="font-mono text-xs mt-1 opacity-80">
              {p.involvedEntities.slice(0, 4).join(" · ")}
            </p>
            {p.summary && (
              <p className="font-mono text-xs mt-1 opacity-60 italic">{p.summary}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/streams/
git commit -m "feat(report): narrative pattern badges component"
```

---

### Task 4: Entity Grid Component

**Files:**
- Create: `src/app/admin/streams/[sessionId]/report/entity-grid.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/app/admin/streams/[sessionId]/report/entity-grid.tsx
import Link from "next/link";
import type { EntityMentionSummary } from "@/lib/reports/stream-report";

interface Props {
  entities: EntityMentionSummary[];
}

export function EntityGrid({ entities }: Props) {
  if (entities.length === 0) {
    return <p className="font-mono text-xs text-text-muted">No entities detected.</p>;
  }

  const maxCount = Math.max(...entities.map((e) => e.occurrences));

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {entities.map((e) => {
        const barWidth = Math.round((e.occurrences / maxCount) * 100);
        return (
          <div key={e.entityName} className="rounded border border-border bg-elevated p-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              {e.entitySlug ? (
                <Link
                  href={`/psychenomicon/entities/${e.entitySlug}`}
                  className="font-mono text-xs font-bold text-accent-gold hover:underline truncate"
                >
                  {e.entityName}
                </Link>
              ) : (
                <span className="font-mono text-xs font-bold text-text-primary truncate">
                  {e.entityName}
                </span>
              )}
              <span className="font-mono text-xs text-text-muted shrink-0">
                {e.occurrences}×
              </span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-gold/60"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/streams/
git commit -m "feat(report): entity mention grid component with mini bar charts"
```

---

### Task 5: Report Page

**Files:**
- Create: `src/app/admin/streams/[sessionId]/report/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/admin/streams/[sessionId]/report/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { buildStreamReport } from "@/lib/reports/stream-report";
import { SectionCard } from "@/components/ui/section-card";
import { SentimentChart } from "./sentiment-chart";
import { PatternBadges } from "./pattern-badges";
import { EntityGrid } from "./entity-grid";

export const dynamic = "force-dynamic";

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  interrupted:  "Interrupted",
  challenged:   "Challenged",
  accused:      "Accused",
  dismissed:    "Dismissed",
  escalated:    "Escalated",
  betrayed:     "Betrayed",
};

export default async function StreamReportPage({
  params,
}: {
  params: { sessionId: string };
}) {
  await requireAdmin();

  const report = await buildStreamReport(params.sessionId).catch(() => null);
  if (!report) notFound();

  const { session, sentimentArc, peakConflict, topEntities, conflictEvents, patterns, emotionalRange } = report;

  return (
    <main id="main-content" className="p-8 max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-xs text-text-muted mb-1 uppercase tracking-wider">
          Stream Intelligence Report
        </p>
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          {session.title ?? session.id}
        </h1>
        <div className="flex gap-4 font-mono text-xs text-text-muted mt-2">
          <span>{session.chunkCount} chunks</span>
          <span>{session.eventCount} events</span>
          <span>{patterns.length} narrative patterns</span>
          {session.youtubeVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${session.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-gold hover:underline"
            >
              YouTube ↗
            </a>
          )}
        </div>
      </div>

      {/* Emotional Range Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Peak Positive", value: emotionalRange.max.toFixed(2), color: "text-emerald-400" },
          { label: "Peak Negative", value: emotionalRange.min.toFixed(2), color: "text-red-400" },
          { label: "Avg Positive", value: emotionalRange.avgPositive.toFixed(2), color: "text-emerald-300" },
          { label: "Avg Negative", value: emotionalRange.avgNegative.toFixed(2), color: "text-red-300" },
        ].map((stat) => (
          <div key={stat.label} className="rounded border border-border bg-elevated p-3">
            <p className="font-mono text-[10px] text-text-muted uppercase mb-1">{stat.label}</p>
            <p className={`font-mono text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Sentiment Arc */}
      <SectionCard title="Emotional Arc">
        <SentimentChart data={sentimentArc} />
        {peakConflict && (
          <div className="mt-3 rounded border border-red-500/20 bg-red-500/5 p-3">
            <p className="font-mono text-[10px] text-red-400 uppercase mb-1">
              Peak Conflict — Chunk {peakConflict.chunkIndex} ({peakConflict.sentiment.toFixed(2)})
            </p>
            <p className="font-mono text-xs text-text-muted italic">
              &ldquo;{peakConflict.text}&rdquo;
            </p>
          </div>
        )}
      </SectionCard>

      {/* Narrative Patterns */}
      <SectionCard title={`Narrative Patterns (${patterns.length})`}>
        <PatternBadges patterns={patterns} />
      </SectionCard>

      {/* Entity Grid */}
      <SectionCard title={`Entity Mentions (${topEntities.length})`}>
        <EntityGrid entities={topEntities} />
      </SectionCard>

      {/* Conflict Event Log */}
      {conflictEvents.length > 0 && (
        <SectionCard title={`Conflict Events (${conflictEvents.length})`}>
          <div className="space-y-2">
            {conflictEvents.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-3 rounded border border-border bg-elevated p-2"
              >
                <span className="font-mono text-[10px] text-text-muted shrink-0 mt-0.5">
                  {ev.chunkIndex !== null ? `Ch.${ev.chunkIndex}` : "—"}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs">
                    <span className="text-accent-gold font-bold">
                      {CONFLICT_TYPE_LABELS[ev.eventType] ?? ev.eventType}
                    </span>
                    {ev.speaker && (
                      <span className="text-text-muted"> · {ev.speaker}</span>
                    )}
                    {ev.target && (
                      <span className="text-text-muted"> → {ev.target}</span>
                    )}
                  </p>
                  {ev.rawText && (
                    <p className="font-mono text-xs text-text-muted italic mt-0.5 truncate">
                      &ldquo;{ev.rawText.slice(0, 120)}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/streams/
git commit -m "feat(report): stream intelligence report page — sentiment, patterns, entities, conflicts"
```

---

### Task 6: Link Report from Streams Dashboard

**Files:**
- Modify: `src/app/admin/streams/page.tsx`

- [ ] **Step 1: Add "View Report" link to completed sessions**

In `src/app/admin/streams/page.tsx`, find the `StreamActions` component rendering and add a report link alongside it:

```tsx
import Link from "next/link";
```

In the session card, after the status/count row, add:

```tsx
{s.status === "complete" && (
  <Link
    href={`/admin/streams/${s.id}/report`}
    className="font-mono text-xs text-accent-gold hover:underline"
  >
    View Report →
  </Link>
)}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All passing.

- [ ] **Step 3: Smoke test**

Start dev server. Navigate to `/admin/streams`. Click "View Report" on a completed session. Confirm the page renders with sentiment chart, pattern badges, and entity grid.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/streams/page.tsx
git commit -m "feat(report): link 'View Report' from streams dashboard to intelligence report"
```

---

## Self-Review

**Spec coverage:**
- ✅ Emotional arc chart — `SentimentChart` renders per-chunk sentiment over time
- ✅ Peak conflict window — lowest-sentiment chunk surfaced with excerpt
- ✅ Emotional range stats — min, max, avg positive, avg negative
- ✅ Narrative pattern display — `PatternBadges` with type labels, confidence, entity names
- ✅ Entity interaction summary — `EntityGrid` with occurrence counts + graph links
- ✅ Conflict event log — filtered events with speaker→target and text excerpts
- ✅ YouTube link — direct link back to source video
- ✅ Linked from streams dashboard — "View Report" on completed sessions
- ⏭ "Best moments" / top quotes — would need a quote extraction step in the pipeline; add to Plan B follow-up
- ⏭ Archetype interactions — requires wiring `PsychenomiconEntity` archetype data into mentions; add after entity resolution is mature

**No placeholders found.**

**Type consistency:** `SentimentPoint`, `EntityMentionSummary`, `ConflictEvent`, `PatternSummary` all defined in `stream-report.ts` and imported consistently into components. `buildStreamReport` return type `StreamReport` matches destructuring in the page component.
