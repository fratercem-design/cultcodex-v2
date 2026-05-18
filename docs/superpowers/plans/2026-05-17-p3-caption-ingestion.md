# Phase 3 — Plan 1: YouTube Caption Ingestion

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the transcription stub — when a stream session has a YouTube video ID, automatically fetch captions via the existing Innertube scraper and feed them into the Phase 2 stream ingestor pipeline.

**Architecture:** Extract the `fetchTranscriptInnertube` function from `src/app/api/admin/sync-transcripts/route.ts` into a shared `src/lib/ingestion/youtube-captions.ts`. Update the stream ingestor to call it when `rawTranscript` is absent but `youtubeVideoId` is present. Update the ingest API route to accept `youtubeVideoId` alone — no manual transcript required.

**Tech Stack:** TypeScript, Next.js App Router, Vitest (no new dependencies — Innertube scraper uses native `fetch`)

**Prerequisite:** Phase 2 Plans 1–4 complete. `StreamSession`, `StreamChunk`, `StreamEvent` tables and `stream-ingestor.ts` exist.

---

## File Structure

- Create: `src/lib/ingestion/youtube-captions.ts` — extracted caption fetcher (shared utility)
- Create: `src/lib/ingestion/__tests__/youtube-captions.test.ts`
- Modify: `src/lib/ingestion/stream-ingestor.ts` — call caption fetcher when transcript absent
- Modify: `src/app/api/admin/streams/ingest/route.ts` — accept `youtubeVideoId` without `transcript`

---

### Task 1: Extract Caption Fetcher into Shared Utility

The `fetchTranscriptInnertube` function currently lives inside the route handler for `sync-transcripts`. Extract it verbatim into a shared module so both the transcript sync and the stream ingestor can call it.

**Files:**
- Create: `src/lib/ingestion/youtube-captions.ts`
- Create: `src/lib/ingestion/__tests__/youtube-captions.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/ingestion/__tests__/youtube-captions.test.ts
import { describe, it, expect } from "vitest";
import { formatSegmentsAsTranscript, parseTimedEvents } from "../youtube-captions";

describe("formatSegmentsAsTranscript", () => {
  it("joins segments into speaker-labeled lines", () => {
    const segments = [
      { text: "Hello everyone.", start: 0, duration: 2 },
      { text: "Welcome back.", start: 2, duration: 2 },
    ];
    const result = formatSegmentsAsTranscript(segments);
    expect(result).toContain("Hello everyone.");
    expect(result).toContain("Welcome back.");
  });

  it("strips bracketed noise like [Music] and [Applause]", () => {
    const segments = [{ text: "[Music] Let's go.", start: 0, duration: 2 }];
    const result = formatSegmentsAsTranscript(segments);
    expect(result).not.toContain("[Music]");
    expect(result).toContain("Let's go.");
  });

  it("returns empty string for empty array", () => {
    expect(formatSegmentsAsTranscript([])).toBe("");
  });
});

describe("parseTimedEvents", () => {
  it("extracts text from timed event segs", () => {
    const timedData = {
      events: [
        { segs: [{ utf8: "Hello " }, { utf8: "world" }], tStartMs: 1000, dDurationMs: 3000 },
        { segs: [{ utf8: " " }], tStartMs: 4000, dDurationMs: 1000 },
      ],
    };
    const segments = parseTimedEvents(timedData);
    expect(segments).toHaveLength(1); // " " only segment filtered out
    expect(segments[0].text).toBe("Hello world");
    expect(segments[0].start).toBeCloseTo(1.0);
    expect(segments[0].duration).toBeCloseTo(3.0);
  });

  it("returns empty array for missing events", () => {
    expect(parseTimedEvents({})).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/ingestion/__tests__/youtube-captions.test.ts
```
Expected: FAIL — "Cannot find module '../youtube-captions'"

- [ ] **Step 3: Write the implementation**

This is an extraction of the existing code in `src/app/api/admin/sync-transcripts/route.ts`. Copy the relevant functions verbatim, then add `formatSegmentsAsTranscript`.

```typescript
// src/lib/ingestion/youtube-captions.ts

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

const CHROME_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export function parseTimedEvents(timedData: {
  events?: Array<{
    segs?: Array<{ utf8: string }>;
    tStartMs?: number;
    dDurationMs?: number;
  }>;
}): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  for (const event of timedData.events ?? []) {
    if (!event.segs) continue;
    const text = event.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .replace(/\n/g, " ")
      .trim();
    if (!text || text === " ") continue;
    segments.push({
      text,
      start: (event.tStartMs ?? 0) / 1000,
      duration: (event.dDurationMs ?? 5000) / 1000,
    });
  }
  return segments;
}

async function tryDirectTimedtext(
  videoId: string,
  _html: string
): Promise<{ segments: TranscriptSegment[] | null; reason: string }> {
  const url = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`;
  try {
    const res = await fetch(url, { headers: CHROME_HEADERS });
    if (!res.ok) return { segments: null, reason: `timedtext_${res.status}` };
    const data = await res.json();
    const segments = parseTimedEvents(data);
    if (segments.length === 0) return { segments: null, reason: "timedtext_empty" };
    return { segments, reason: "timedtext_ok" };
  } catch {
    return { segments: null, reason: "timedtext_error" };
  }
}

export async function fetchYouTubeCaptions(
  videoId: string
): Promise<{ segments: TranscriptSegment[] | null; reason: string }> {
  const pageRes = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
    { headers: CHROME_HEADERS }
  );

  if (!pageRes.ok) return { segments: null, reason: `page_${pageRes.status}` };
  const html = await pageRes.text();

  const match = html.match(/"captionTracks":(\[[\s\S]*?\](?=[,}]))/);
  if (!match) return tryDirectTimedtext(videoId, html);

  let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
  try {
    tracks = JSON.parse(match[1]);
  } catch {
    return tryDirectTimedtext(videoId, html);
  }

  if (!tracks || tracks.length === 0) return tryDirectTimedtext(videoId, html);

  const track =
    tracks.find((t) => t.languageCode === "en" && t.kind === "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.languageCode?.startsWith("en")) ||
    tracks[0];

  if (!track?.baseUrl) return { segments: null, reason: "no_baseUrl" };

  const fmt3Url = track.baseUrl.includes("fmt=")
    ? track.baseUrl.replace(/fmt=[^&]+/, "fmt=json3")
    : `${track.baseUrl}&fmt=json3`;

  const captionRes = await fetch(fmt3Url, { headers: CHROME_HEADERS });
  if (!captionRes.ok) return { segments: null, reason: `caption_${captionRes.status}` };

  const data = await captionRes.json();
  const segments = parseTimedEvents(data);
  if (segments.length === 0) return tryDirectTimedtext(videoId, html);
  return { segments, reason: "ok" };
}

export function formatSegmentsAsTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => s.text.replace(/\[.*?\]/g, "").trim())
    .filter(Boolean)
    .join(" ");
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/ingestion/__tests__/youtube-captions.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/ingestion/youtube-captions.ts src/lib/ingestion/__tests__/youtube-captions.test.ts
git commit -m "feat(captions): extract YouTube Innertube caption fetcher into shared utility"
```

---

### Task 2: Update sync-transcripts to Use Shared Utility

Remove the duplicate `fetchTranscriptInnertube` and `parseTimedEvents` from the route handler and import from the shared module instead. This is a refactor — behavior must not change.

**Files:**
- Modify: `src/app/api/admin/sync-transcripts/route.ts`

- [ ] **Step 1: Replace internal function with import**

At the top of `src/app/api/admin/sync-transcripts/route.ts`, add:

```typescript
import {
  fetchYouTubeCaptions,
  formatSegmentsAsTranscript,
} from "@/lib/ingestion/youtube-captions";
```

Remove the `CHROME_HEADERS` constant, `parseTimedEvents` function, `tryDirectTimedtext` function, and `fetchTranscriptInnertube` function from the file (they are now in the shared module).

Find all calls to `fetchTranscriptInnertube(videoId)` and replace with `fetchYouTubeCaptions(videoId)`.

Find the raw text assembly line:
```typescript
const rawText = rawSegments.map((s) => s.text).join(" ");
```
Replace with:
```typescript
const rawText = formatSegmentsAsTranscript(rawSegments);
```

- [ ] **Step 2: Run the full test suite to confirm no regression**

```bash
npx vitest run
```
Expected: All previously passing tests still pass.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/sync-transcripts/route.ts
git commit -m "refactor(captions): sync-transcripts now uses shared youtube-captions utility"
```

---

### Task 3: Wire Caption Fetch into Stream Ingestor

**Files:**
- Modify: `src/lib/ingestion/stream-ingestor.ts`

- [ ] **Step 1: Add caption fetch before pipeline**

In `src/lib/ingestion/stream-ingestor.ts`, add the import at the top:

```typescript
import { fetchYouTubeCaptions, formatSegmentsAsTranscript } from "./youtube-captions";
```

At the start of `ingestStream`, replace the early-exit block:

```typescript
// BEFORE:
if (!session.rawTranscript) {
  await prisma.streamSession.update({
    where: { id: sessionId },
    data: { status: "failed" },
  });
  return;
}
```

With:

```typescript
// AFTER:
let transcript = session.rawTranscript;

if (!transcript && session.youtubeVideoId) {
  const { segments, reason } = await fetchYouTubeCaptions(session.youtubeVideoId);
  if (!segments || segments.length === 0) {
    await prisma.streamSession.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });
    console.error(`[ingest] Caption fetch failed for ${session.youtubeVideoId}: ${reason}`);
    return;
  }
  transcript = formatSegmentsAsTranscript(segments);
  // Persist fetched transcript so we don't re-fetch on retry
  await prisma.streamSession.update({
    where: { id: sessionId },
    data: { rawTranscript: transcript },
  });
}

if (!transcript) {
  await prisma.streamSession.update({
    where: { id: sessionId },
    data: { status: "failed" },
  });
  return;
}
```

Replace all subsequent references to `session.rawTranscript` in the function with `transcript`.

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```
Expected: All passing. No regressions.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ingestion/stream-ingestor.ts
git commit -m "feat(ingestion): auto-fetch YouTube captions when rawTranscript is absent"
```

---

### Task 4: Update Ingest Route — Accept videoId Alone

**Files:**
- Modify: `src/app/api/admin/streams/ingest/route.ts`

- [ ] **Step 1: Relax transcript requirement**

In `src/app/api/admin/streams/ingest/route.ts`, find the validation block:

```typescript
if (!transcript) {
  return NextResponse.json({ ok: false, error: "transcript required" }, { status: 400 });
}
```

Replace with:

```typescript
if (!transcript && !youtubeVideoId) {
  return NextResponse.json(
    { ok: false, error: "transcript or youtubeVideoId required" },
    { status: 400 }
  );
}
```

Update the `StreamSession.create` call so `rawTranscript` is optional:

```typescript
const session = await prisma.streamSession.create({
  data: {
    rawTranscript: transcript || null,
    youtubeVideoId: youtubeVideoId || null,
    title: title || null,
    status: "pending",
  },
});
```

- [ ] **Step 2: Manual smoke test**

```bash
curl -X POST http://localhost:3000/api/admin/streams/ingest \
  -H "Content-Type: application/json" \
  -H "Cookie: <admin-session>" \
  -d '{"youtubeVideoId": "dQw4w9WgXcQ", "title": "Test caption fetch"}'
```
Expected: `{"ok":true,"sessionId":"..."}` — then poll `GET /api/admin/streams/:sessionId` until `status: "complete"` or `"failed"`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/streams/ingest/route.ts
git commit -m "feat(ingestion): ingest route accepts youtubeVideoId without pre-fetched transcript"
```

---

## Self-Review

**Spec coverage:**
- ✅ Transcription stub closed — `ingestStream` auto-fetches captions via Innertube
- ✅ No new external services or API keys — reuses existing scraper
- ✅ Shared utility eliminates duplicate code in sync-transcripts route
- ✅ Transcript persisted to DB after fetch — retries don't re-hit YouTube
- ✅ Ingest route accepts videoId alone — manual transcript still works

**No placeholders found.**

**Type consistency:** `TranscriptSegment` matches the shape used in sync-transcripts. `fetchYouTubeCaptions` returns `{ segments: TranscriptSegment[] | null; reason: string }` — same shape as the original `fetchTranscriptInnertube`. `formatSegmentsAsTranscript` replaces the inline `.map((s) => s.text).join(" ")` pattern consistently.
