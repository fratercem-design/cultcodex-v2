# SSE Phase 11 Polish — Design

**Status:** approved
**Date:** 2026-04-25

## Goal

Close the four deferred follow-ups from the 2026-04-24 Postgres SSE event bus spec. The bus shipped to production successfully but lacks tests, structured logs, user-visible reconnect feedback, and any way for an operator to introspect runtime state. This spec covers all four items as one cohesive observability + quality pass on the SSE subsystem.

## Scope

Four items, all bounded to the SSE subsystem:

- **A1.** Unit + integration tests for `PgEventBus` and the new logger module.
- **A2.** Structured JSON logging plus a 50-event in-memory ring buffer per Node instance.
- **A3.** Visible "Reconnecting…" indicator (small inline pulsing dot) in `CommentSection`, `ReactionBar`, and `LiveChat`, debounced to avoid flicker on normal page loads.
- **A4.** Admin-only `GET /api/admin/sse-status` endpoint that returns a JSON snapshot of the calling instance's bus state.

## Constraints

- **No public API changes** for existing bus callers. `eventBus.publish(channel, data)` and `eventBus.subscribe(channel, fn)` keep their current signatures.
- **No new runtime dependencies.** Logger is hand-rolled. Tests use `vitest` (already configured), `@electric-sql/pglite` (already in node_modules as a transitive Prisma dep), and `vi.mock` for mocked unit tests.
- **No infra changes.** No new env vars; reuses existing `DATABASE_URL` for the bus and `requireAdmin()` for the admin gate.
- **One instance, not global.** All introspection is for the Node instance that handles the request. Vercel Fluid Compute runs multiple instances; cross-instance aggregation is explicitly out of scope.

## Architecture

Four cohesive layers:

1. **Logger module** — small standalone JSON logger with an in-memory ring buffer.
2. **Bus instrumentation** — replace `console.error` calls with structured logger calls; add `getStatus()` introspection method; add an attempt counter for reconnect logging.
3. **Connection state in `useSSE`** — hook returns `{ status }` (debounced 2s on the non-open direction, instant on flip back to open).
4. **Admin endpoint + visual dot** — `/api/admin/sse-status` returns `eventBus.getStatus()`; `ConnectionDot` component renders an inline pulsing dot when status is non-open.

### Files to create (6)

| Path | Responsibility |
|---|---|
| `src/lib/sse/log.ts` | Structured JSON logger + 50-event ring buffer (HMR-safe singleton) |
| `src/lib/sse/__tests__/event-bus.test.ts` | Unit tests with mocked `pg.Client` |
| `src/lib/sse/__tests__/event-bus.integration.test.ts` | One pglite roundtrip integration test |
| `src/lib/sse/__tests__/log.test.ts` | Logger unit tests (ring buffer cap, mutation safety) |
| `src/components/sse/connection-dot.tsx` | Presentational status dot component |
| `src/app/api/admin/sse-status/route.ts` | Admin-gated JSON snapshot of bus state |

(`__tests__` directories follow the existing project convention seen in `src/lib/format/__tests__/`.)

### Files to modify (5)

- `src/lib/sse/event-bus.ts` — wire logger, ring buffer access via `sseLogger.recent()`, add `getStatus()`, add `reconnectAttempt` counter.
- `src/lib/sse/use-sse.ts` — return `{ status }`; track `EventSource` open/error events; debounce non-open transitions by 2s.
- `src/components/episodes/comment-section.tsx` — destructure `status` from `useSSE`; render `<ConnectionDot status={status} />` next to the section heading.
- `src/components/episodes/reaction-bar.tsx` — same pattern.
- `src/components/live/live-chat.tsx` — same pattern.

## Component design

### Logger module (`src/lib/sse/log.ts`)

```ts
export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  ts: string;          // ISO timestamp
  level: LogLevel;
  source: "PgEventBus";
  event: string;
  [key: string]: unknown;
}

class SseLogger {
  private buffer: LogEntry[] = [];
  private readonly MAX = 50;

  log(level: LogLevel, event: string, fields: Record<string, unknown> = {}): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      source: "PgEventBus",
      event,
      ...fields,
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX) this.buffer.shift();

    const sink =
      level === "error" ? console.error
      : level === "warn" ? console.warn
      : console.log;
    sink(JSON.stringify(entry));
  }

  recent(): readonly LogEntry[] {
    return [...this.buffer];
  }
}

const g = globalThis as unknown as { __cultcodexSseLogger?: SseLogger };
export const sseLogger = g.__cultcodexSseLogger ?? new SseLogger();
if (process.env.NODE_ENV !== "production") g.__cultcodexSseLogger = sseLogger;
```

#### Canonical event vocabulary

The bus emits these events through the logger. This is the contract that the admin endpoint surfaces.

| event | level | extra fields |
|---|---|---|
| `connect` | info | — |
| `reconnect-scheduled` | warn | `delayMs`, `attempt` |
| `reconnect-failed` | error | `error: string` |
| `client-error` | error | `error: string` |
| `client-end` | warn | — |
| `listen` | info | `channel` (safe), `rawChannel` |
| `unlisten` | info | `channel`, `rawChannel` |
| `listen-failed` | error | `channel`, `error: string` |
| `unlisten-failed` | error | `channel`, `error: string` |
| `publish` | info | `channel`, `rawChannel`, `payloadBytes` |
| `publish-timeout` | error | `channel`, `timeoutMs` |
| `publish-failed` | error | `channel`, `error: string` |
| `notify-parse-failed` | error | `channel`, `error: string` |
| `listener-threw` | error | `channel`, `error: string` |

### Bus changes (`src/lib/sse/event-bus.ts`)

**Mechanical swap:** every existing `console.error("[PgEventBus] ...")` call becomes `sseLogger.log("error", "<event>", {...})` per the table above. Existing info-level events that today log nothing (`connect`, `listen`, `unlisten`, `publish` success) become explicit `sseLogger.log("info", ...)` calls. The `[PgEventBus]` prefix is no longer needed because every log entry includes `"source": "PgEventBus"`.

**New private field** — `private reconnectAttempt = 0`. Increments inside `scheduleReconnect()`, resets to 0 on a successful (re)connect inside `getClient()`. Included as `attempt` in the `reconnect-scheduled` log fields.

**New public method:**

```ts
export interface BusStatus {
  client: {
    connected: boolean;
    pendingReconnect: boolean;
    nextReconnectDelayMs: number;
  };
  channels: Array<{
    rawChannel: string;
    safeChannel: string;
    listenerCount: number;
  }>;
  recentEvents: readonly LogEntry[];
}

class PgEventBus {
  // ...existing fields and methods...

  getStatus(): BusStatus {
    return {
      client: {
        connected: this.client !== null,
        pendingReconnect: this.reconnectTimer !== null,
        nextReconnectDelayMs: this.reconnectDelayMs,
      },
      channels: Array.from(this.listeners.entries()).map(([raw, set]) => ({
        rawChannel: raw,
        safeChannel: this.getSafeChannel(raw),
        listenerCount: set.size,
      })),
      recentEvents: sseLogger.recent(),
    };
  }
}
```

### Connection state in `useSSE` (`src/lib/sse/use-sse.ts`)

```ts
export type SSEStatus = "open" | "connecting" | "reconnecting";

export function useSSE({ url, onMessage, enabled = true }: SSEOptions): {
  status: SSEStatus;
} {
  const [rawStatus, setRawStatus] = useState<SSEStatus>("connecting");
  const [displayStatus, setDisplayStatus] = useState<SSEStatus>("open");
  // ...existing onMessageRef and reconnectTimeoutRef...

  // Inside connect(): on first onmessage → setRawStatus("open").
  // On EventSource onerror → setRawStatus("reconnecting").
  // On every fresh connect() call → setRawStatus("connecting").

  // Debounce: only flip displayStatus to a non-"open" value after 2s
  // of rawStatus being non-"open". Flip back to "open" instantly.
  useEffect(() => {
    if (rawStatus === "open") {
      setDisplayStatus("open");
      return;
    }
    const t = setTimeout(() => setDisplayStatus(rawStatus), 2000);
    return () => clearTimeout(t);
  }, [rawStatus]);

  return { status: displayStatus };
}
```

**Backward compat:** existing callers don't destructure the return value, so they continue to work unchanged. They opt in by destructuring `{ status }` when they want the dot.

### `ConnectionDot` component (`src/components/sse/connection-dot.tsx`)

```tsx
"use client";

interface ConnectionDotProps {
  status: "open" | "connecting" | "reconnecting";
}

export function ConnectionDot({ status }: ConnectionDotProps) {
  if (status === "open") return null;

  const label =
    status === "reconnecting"
      ? "Reconnecting to live updates…"
      : "Connecting to live updates…";

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-2"
    />
  );
}
```

Renders nothing when healthy (no layout shift in the common case). The absence of a dot is the "healthy" signal; no green-dot variant.

### Caller integrations

Each of the three components already calls `useSSE`. Change is mechanical:

```tsx
// before
useSSE({ url: ..., onMessage: ... });

// after
const { status } = useSSE({ url: ..., onMessage: ... });
// ...next to the existing section heading in the JSX:
<h2>Comments <ConnectionDot status={status} /></h2>
```

Same pattern for `ReactionBar` (next to its heading) and `LiveChat` (next to its heading).

### Admin endpoint (`src/app/api/admin/sse-status/route.ts`)

```ts
import { NextResponse } from "next/server";
import { eventBus } from "@/lib/sse/event-bus";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(eventBus.getStatus(), {
    headers: { "Cache-Control": "no-store" },
  });
}
```

Response is exactly `BusStatus` from above. Example:

```json
{
  "client": {
    "connected": true,
    "pendingReconnect": false,
    "nextReconnectDelayMs": 1000
  },
  "channels": [
    { "rawChannel": "live:chat", "safeChannel": "live:chat", "listenerCount": 7 },
    { "rawChannel": "episode:foo-slug", "safeChannel": "episode:foo-slug", "listenerCount": 3 }
  ],
  "recentEvents": [
    { "ts": "2026-04-25T20:30:00.000Z", "level": "info", "source": "PgEventBus", "event": "connect" },
    { "ts": "2026-04-25T20:30:01.000Z", "level": "info", "source": "PgEventBus", "event": "listen", "channel": "live:chat", "rawChannel": "live:chat" }
  ]
}
```

**Per-instance caveat (must be documented in the route file as a top-of-file comment):** Vercel Fluid Compute runs multiple Node instances per region. This endpoint reflects only the bus state of whichever instance handled the request. There is no global view. That matches the bus's actual scope (one bus per Node instance) and is the truthful answer to "is this instance's bus healthy?"

## Testing

### Unit tests (mocks)

Path: `src/lib/sse/__tests__/event-bus.test.ts`. Uses `vi.mock("pg")` to swap the `Client` class for a mock that lets the test drive `notification`/`error`/`end` events from outside. Each test imports the bus fresh via `vi.resetModules()` so the singleton starts clean.

Test groups:

| Group | What it verifies |
|---|---|
| `safeChannelName` | Short safe names pass through; long names get hashed; unsafe chars get hashed; deterministic |
| `subscribe / unsubscribe` | First listener triggers `LISTEN`; subsequent listeners on same channel don't re-issue; last unsubscribe issues `UNLISTEN`; cleanup is idempotent |
| `notification fan-out` | Incoming NOTIFY routes to correct channel's listeners; raw→safe mapping works; bad JSON payload is logged + dropped (other listeners still fire); listener that throws is isolated |
| `publish` | Calls `pg_notify` with safe channel + JSON payload; resolves on success; rejects with timeout error after 2s if client hangs (use `vi.useFakeTimers`) |
| `reconnect backoff` | Delay progression 1000 → 2000 → 4000 → 8000 → 16000 → 30000 (capped); resets to 1000 on successful (re)connect; re-LISTENs all active channels after reconnect; `reconnectAttempt` increments and resets correctly |
| `getStatus()` | Returns expected shape — client connected/disconnected, channel list with correct listener counts, recent events from logger |

### Logger unit tests

Path: `src/lib/sse/__tests__/log.test.ts`. ~3 tests:

- Ring buffer caps at 50 entries; oldest entries drop first.
- Log entries include all canonical fields (`ts`, `level`, `source`, `event`, plus extras).
- `recent()` returns a copy — mutating the returned array does not affect the internal buffer.

### Integration test (pglite)

Path: `src/lib/sse/__tests__/event-bus.integration.test.ts`. Uses `@electric-sql/pglite` (already in node_modules) plus `@electric-sql/pglite-socket` to expose pglite over a socket the `pg` Client can connect to. One round-trip test:

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PGlite } from "@electric-sql/pglite";
// (pglite-socket adapter to expose a connection string)

it("publish → NOTIFY → listener fires (real Postgres)", async () => {
  // start pglite + socket adapter, set DATABASE_URL to its connection string
  // import bus fresh
  const { eventBus } = await import("@/lib/sse/event-bus");

  const received: unknown[] = [];
  eventBus.subscribe("test:channel", (data) => received.push(data));
  await new Promise((r) => setTimeout(r, 50)); // let LISTEN settle

  await eventBus.publish("test:channel", { hello: "world" });
  await new Promise((r) => setTimeout(r, 50)); // let NOTIFY round-trip

  expect(received).toEqual([{ hello: "world" }]);
});
```

**Fallback:** if pglite-socket setup proves too fiddly during implementation (test of round-trip works locally but flakes in vitest, or pglite-socket has incompatibility with the `pg` Client API), the implementer may fall back to running the integration test against `process.env.DATABASE_URL` (real Neon dev DB). This must be:

- Skipped automatically if `DATABASE_URL` is unset or points to a production-looking connection string.
- Documented in the test file with a comment explaining why the fallback was chosen.

The pglite path is preferred because it removes the network and DB-credentials dependency; the real-Postgres fallback is acceptable but second-best.

### Test execution

`npm test` (existing `vitest run` script) picks up everything via the existing `src/**/*.test.{ts,tsx}` include pattern in `vitest.config.ts`. No config changes required.

## Data flow (after change)

1. User A's browser holds an `EventSource` connection to `/api/sse/episodes/foo-slug`. The SSE route subscribes to `episode:foo-slug` on the bus.
2. Comment-post path same as before: row saved → `await eventBus.publish("episode:foo-slug", {...})`.
3. **New:** the bus's logger emits `{level:"info", event:"publish", channel:"episode:foo-slug", rawChannel:"episode:foo-slug", payloadBytes:127}` to stdout (Vercel ingests as JSON) and pushes it onto the ring buffer.
4. Bus performs `SELECT pg_notify(...)`, NOTIFY broadcasts, listener clients on every instance receive it, fan out to local subscribers.
5. **New:** if instance Y's listener client temporarily disconnects, the bus emits `{level:"warn", event:"reconnect-scheduled", delayMs:1000, attempt:1}`, schedules reconnect, and on success emits `{level:"info", event:"connect"}` (with implicit `attempt:0` reset).
6. **New:** an admin (signed in with role `admin`) `curl`s `/api/admin/sse-status` with cookies and sees the calling instance's snapshot.
7. **New:** if a user's `EventSource` errors and our setTimeout-based reconnect kicks in, `useSSE` flips `rawStatus` to `"reconnecting"` and after 2s `displayStatus` flips, causing `<ConnectionDot>` to render an amber pulsing dot next to the section heading. On successful reconnect (next `onmessage`) the dot disappears instantly.

## Error handling

- **Logger** has no failure modes worth handling. `JSON.stringify` of the entry is safe given the canonical field shapes; if a future caller passes a circular field it throws synchronously and the calling site sees the error in the same call frame, which is loud and findable.
- **Bus** error paths are unchanged in semantics — the only change is that errors now go through `sseLogger.log("error", ...)` instead of `console.error`. The exponential-backoff reconnect, listener throw isolation, and publish timeout all behave exactly as today.
- **`useSSE`** unchanged in connection semantics. The new state tracking is additive; if the state setters somehow fail (impossible in practice), the `EventSource` and reconnect logic still proceed normally.
- **Admin endpoint** returns 403 on `requireAdmin()` failure (unauthenticated or non-admin user). Any unexpected error bubbles to the Next.js error boundary and returns a 500.

## Risks & mitigations

- **pglite integration test flakes.** Mitigation: the spec explicitly allows fallback to a real-Postgres-against-`DATABASE_URL` integration test if the pglite-socket adapter proves problematic. Documented in the test file with a comment.
- **Ring buffer is per-instance.** A high-traffic instance can churn through 50 events fast. Acceptable: the buffer is for "what just happened on this instance," not a durable history. If a future scope needs cross-instance event history, that's a different system (durable queue, log aggregator).
- **`getStatus()` is non-atomic.** A NOTIFY arriving mid-call could log between the channel snapshot and the recent-events read. Acceptable: this endpoint is for human introspection, not real-time monitoring.
- **Log volume.** Adding info-level logs for every publish/listen/unlisten increases stdout volume. Vercel's log retention and pricing accommodate this comfortably for the current traffic level. If logs become noisy, future scope can add a `level: "info" | "warn" | "error"` env-var gate to the logger.

## Out of scope (explicit)

- No global rate limiting on `/api/admin/sse-status` (`requireAdmin()` gates it; admins are trusted).
- No multi-instance aggregation. One request returns one instance's bus state.
- No log forwarding to a third-party aggregator (Datadog, Sentry, etc.). JSON to stdout is the contract; Vercel ingests it; that's enough.
- No live updates of the admin endpoint (no SSE-on-SSE; just refresh the page).
- No admin UI page yet (only the JSON endpoint). A future scope-D session can add one.
- No structured logging beyond the SSE bus. Other modules continue using `console.error` until/unless the logger module proves useful elsewhere — left as a possible future adoption.
- No green-dot "healthy" state in `ConnectionDot`. Absence of a dot is the healthy signal.
- No changes to the existing 5s `useSSE` reconnect interval, the bus's reconnect backoff curve, or the 2s publish timeout. Those are settled.
