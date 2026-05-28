# Phase 3 — Plan 2: Live Stream Auto-Processing

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Psyche ends a live stream, automatically trigger caption ingestion and pipeline processing — no manual admin step required.

**Architecture:** Hook into the existing `toggleLiveStream` server action in `src/app/admin/actions.ts`. When going offline with a known `videoId`, create a `StreamSession` and fire the ingestor. A cron backup route retries any sessions stuck in `pending` for over 10 minutes. An admin streams page lists all sessions with their status, chunk/event counts, and a manual re-trigger button.

**Tech Stack:** Prisma, TypeScript, Next.js App Router (server actions + API routes), Vitest

**Prerequisite:** Phase 3 Plan 1 (Caption Ingestion) must be complete.

---

## File Structure

- Modify: `src/app/admin/actions.ts` — auto-create StreamSession + trigger ingestor on go-offline
- Create: `src/lib/ingestion/live-processor.ts` — thin orchestrator (keeps actions.ts clean)
- Create: `src/lib/ingestion/__tests__/live-processor.test.ts`
- Create: `src/app/api/cron/post-stream-ingest/route.ts` — retry stuck sessions
- Create: `src/app/admin/streams/page.tsx` — admin streams dashboard
- Create: `src/app/admin/streams/stream-actions.tsx` — client re-trigger button

---

### Task 1: Live Processor Orchestrator

This is a thin module that `toggleLiveStream` calls — keeps the server action readable and keeps ingestion logic testable.

**Files:**
- Create: `src/lib/ingestion/live-processor.ts`
- Create: `src/lib/ingestion/__tests__/live-processor.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ingestion/__tests__/live-processor.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldAutoIngest, buildSessionTitle } from "../live-processor";

describe("shouldAutoIngest", () => {
  it("returns true when videoId is present and status is live→offline", () => {
    expect(shouldAutoIngest({ wasLive: true, videoId: "abc123" })).toBe(true);
  });

  it("returns false when no videoId", () => {
    expect(shouldAutoIngest({ wasLive: true, videoId: null })).toBe(false);
  });

  it("returns false when stream was not live (toggle direction wrong)", () => {
    expect(shouldAutoIngest({ wasLive: false, videoId: "abc123" })).toBe(false);
  });
});

describe("buildSessionTitle", () => {
  it("includes video ID and timestamp", () => {
    const title = buildSessionTitle("abc123", new Date("2026-05-17T03:33:00Z"));
    expect(title).toContain("abc123");
    expect(title).toContain("2026-05-17");
  });

  it("uses provided stream title when available", () => {
    const title = buildSessionTitle("abc123", new Date(), "Chaos & Tarot Night");
    expect(title).toBe("Chaos & Tarot Night");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/ingestion/__tests__/live-processor.test.ts
```
Expected: FAIL

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/ingestion/live-processor.ts
import { prisma } from "@/lib/db";
import { ingestStream } from "./stream-ingestor";

export function shouldAutoIngest(opts: {
  wasLive: boolean;
  videoId: string | null | undefined;
}): boolean {
  return opts.wasLive === true && !!opts.videoId;
}

export function buildSessionTitle(
  videoId: string,
  endedAt: Date,
  streamTitle?: string | null
): string {
  if (streamTitle) return streamTitle;
  const date = endedAt.toISOString().slice(0, 10);
  return `Live Stream — ${videoId} — ${date}`;
}

export async function triggerPostStreamIngestion(opts: {
  videoId: string;
  streamTitle: string | null | undefined;
  endedAt: Date;
}): Promise<string> {
  const title = buildSessionTitle(opts.videoId, opts.endedAt, opts.streamTitle);

  const session = await prisma.streamSession.create({
    data: {
      youtubeVideoId: opts.videoId,
      title,
      status: "pending",
    },
  });

  // Fire-and-forget — same pattern as the manual ingest route
  ingestStream(session.id).catch((err) =>
    console.error(`[live-processor] ingest failed for session ${session.id}:`, err)
  );

  return session.id;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/ingestion/__tests__/live-processor.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingestion/live-processor.ts src/lib/ingestion/__tests__/live-processor.test.ts
git commit -m "feat(live): live processor orchestrator — shouldAutoIngest, triggerPostStreamIngestion"
```

---

### Task 2: Hook Auto-Ingestion into toggleLiveStream

**Files:**
- Modify: `src/app/admin/actions.ts`

- [ ] **Step 1: Add import and hook**

At the top of `src/app/admin/actions.ts`, add:

```typescript
import { shouldAutoIngest, triggerPostStreamIngestion } from "@/lib/ingestion/live-processor";
```

Find the `toggleLiveStream` function and locate the "Going offline" branch:

```typescript
if (isLive) {
  // Going offline
  await prisma.liveStatus.upsert({
    where: { id: "singleton" },
    update: { isLive: false, endedAt: new Date() },
    create: { id: "singleton", isLive: false },
  });

  // Clear chat messages when stream ends
  await prisma.chatMessage.deleteMany({});
}
```

Replace with:

```typescript
if (isLive) {
  // Going offline
  const endedAt = new Date();
  await prisma.liveStatus.upsert({
    where: { id: "singleton" },
    update: { isLive: false, endedAt },
    create: { id: "singleton", isLive: false },
  });

  // Clear chat messages when stream ends
  await prisma.chatMessage.deleteMany({});

  // Auto-trigger ingestion if this stream had a video ID
  if (shouldAutoIngest({ wasLive: true, videoId: current?.videoId })) {
    triggerPostStreamIngestion({
      videoId: current!.videoId!,
      streamTitle: current?.title,
      endedAt,
    }).catch((err) =>
      console.error("[toggleLiveStream] post-stream ingestion failed:", err)
    );
  }
}
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All passing. The mock for `@/lib/db` handles the new prisma calls.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/actions.ts
git commit -m "feat(live): auto-trigger stream ingestion when going offline"
```

---

### Task 3: Cron Backup — Retry Stuck Sessions

Sessions can get stuck in `pending` if the server restarts mid-ingest. This cron route picks them up.

**Files:**
- Create: `src/app/api/cron/post-stream-ingest/route.ts`

- [ ] **Step 1: Write the route**

```typescript
// src/app/api/cron/post-stream-ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ingestStream } from "@/lib/ingestion/stream-ingestor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STUCK_THRESHOLD_MINUTES = 10;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

  const stuckSessions = await prisma.streamSession.findMany({
    where: {
      status: { in: ["pending", "processing"] },
      createdAt: { lt: cutoff },
    },
    select: { id: true, youtubeVideoId: true, title: true },
    take: 5,
  });

  const results: { id: string; triggered: boolean }[] = [];

  for (const session of stuckSessions) {
    // Reset to pending so ingestor picks it up fresh
    await prisma.streamSession.update({
      where: { id: session.id },
      data: { status: "pending", startedAt: null },
    });

    ingestStream(session.id).catch((err) =>
      console.error(`[cron/post-stream-ingest] retry failed for ${session.id}:`, err)
    );

    results.push({ id: session.id, triggered: true });
  }

  return NextResponse.json({ ok: true, retried: results.length, sessions: results });
}
```

- [ ] **Step 2: Register cron in vercel.json**

Open `vercel.json`. Add the cron job to the `crons` array (create the array if it doesn't exist):

```json
{
  "crons": [
    {
      "path": "/api/cron/post-stream-ingest",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/cron/post-stream-ingest/route.ts vercel.json
git commit -m "feat(live): cron route retries stuck stream ingestion sessions every 15 min"
```

---

### Task 4: Admin Streams Dashboard

**Files:**
- Create: `src/app/admin/streams/page.tsx`
- Create: `src/app/admin/streams/stream-actions.tsx`

- [ ] **Step 1: Write the server actions component**

```tsx
// src/app/admin/streams/stream-actions.tsx
"use client";

import { useState, useTransition } from "react";

interface StreamActionsProps {
  sessionId: string;
  youtubeVideoId: string | null;
  currentStatus: string;
}

export function StreamActions({ sessionId, youtubeVideoId, currentStatus }: StreamActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const handleRetrigger = () => {
    startTransition(async () => {
      const body: Record<string, string> = {};
      if (youtubeVideoId) body.youtubeVideoId = youtubeVideoId;

      // Re-trigger by posting to the ingest route with the same video ID
      const res = await fetch("/api/admin/streams/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data.ok ? `New session: ${data.sessionId}` : data.error ?? "Failed");
    });
  };

  if (!youtubeVideoId || currentStatus === "processing") return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRetrigger}
        disabled={isPending}
        className="rounded border border-accent-gold/30 px-3 py-1 font-mono text-xs text-accent-gold hover:bg-accent-gold/10 disabled:opacity-50"
      >
        {isPending ? "Triggering..." : "Re-ingest"}
      </button>
      {result && <span className="font-mono text-xs text-text-muted">{result}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Write the page**

```tsx
// src/app/admin/streams/page.tsx
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { SectionCard } from "@/components/ui/section-card";
import { StreamActions } from "./stream-actions";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  pending:    "text-amber-400",
  processing: "text-blue-400 animate-pulse",
  complete:   "text-emerald-400",
  failed:     "text-red-400",
};

export default async function AdminStreamsPage() {
  await requireAdmin();

  const sessions = await prisma.streamSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      _count: { select: { chunks: true, events: true } },
    },
  });

  return (
    <main id="main-content" className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-6">
        Stream Sessions
      </h1>

      {sessions.length === 0 && (
        <p className="font-mono text-sm text-text-muted">
          No stream sessions yet. Go live and end a stream to auto-trigger ingestion.
        </p>
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <SectionCard key={s.id} title="">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-mono text-sm font-bold text-text-primary">
                  {s.title ?? s.id}
                </p>
                {s.youtubeVideoId && (
                  <p className="font-mono text-xs text-text-muted">
                    Video: {s.youtubeVideoId}
                  </p>
                )}
                <div className="flex gap-4 font-mono text-xs text-text-muted">
                  <span className={STATUS_COLOR[s.status] ?? "text-text-muted"}>
                    {s.status.toUpperCase()}
                  </span>
                  <span>{s._count.chunks} chunks</span>
                  <span>{s._count.events} events</span>
                  {s.completedAt && (
                    <span>
                      Completed: {new Date(s.completedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <StreamActions
                sessionId={s.id}
                youtubeVideoId={s.youtubeVideoId}
                currentStatus={s.status}
              />
            </div>
          </SectionCard>
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Add link to admin sidebar**

In `src/components/admin/admin-sidebar.tsx`, add a nav item for Streams. Find the array of nav items and add:

```tsx
{ label: "Streams", href: "/admin/streams" },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/streams/ src/components/admin/admin-sidebar.tsx
git commit -m "feat(live): admin streams dashboard with status, counts, and re-ingest button"
```

---

### Task 5: End-to-End Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Go live via admin**

Navigate to `http://localhost:3000/admin/live`. Enter a real or test YouTube video ID. Click **GO LIVE**.

- [ ] **Step 3: Go offline**

Click **GO OFFLINE**.

Expected: Session appears immediately in `http://localhost:3000/admin/streams` with status `processing`, then transitions to `complete` within a minute (YouTube caption fetch + pipeline).

- [ ] **Step 4: Verify chunks and events**

Confirm the session shows `N chunks` and `M events` in the streams dashboard.

- [ ] **Step 5: Final commit (if any cleanup needed)**

```bash
git add -p
git commit -m "fix(live): end-to-end smoke test cleanup"
```

---

## Self-Review

**Spec coverage:**
- ✅ Auto-trigger on stream end — hooked into `toggleLiveStream`, fires when `videoId` is present
- ✅ Fire-and-forget pattern — same as manual ingest route, no blocking the admin action
- ✅ Cron backup — retries stuck sessions every 15 minutes via Vercel cron
- ✅ Admin streams dashboard — lists all sessions, status, chunk/event counts
- ✅ Manual re-trigger — `StreamActions` client component POSTs to existing ingest route
- ✅ `shouldAutoIngest` is pure and tested — no mocking needed
- ✅ `buildSessionTitle` is pure and tested

**No placeholders found.**

**Type consistency:** `triggerPostStreamIngestion` accepts `{ videoId: string; streamTitle: string | null | undefined; endedAt: Date }` — matches the shape available from `current` (LiveStatus) in `toggleLiveStream`. `StreamActions` props match the Prisma query shape in the page.
