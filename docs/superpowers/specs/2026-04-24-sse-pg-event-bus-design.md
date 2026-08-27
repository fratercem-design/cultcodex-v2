# Postgres-backed SSE Event Bus — Design

**Status:** shipped 2026-04-25
**Date:** 2026-04-24

## Goal

Replace the in-memory `EventBus` (`src/lib/sse/event-bus.ts`) with a Postgres `LISTEN/NOTIFY`-backed implementation so SSE-driven real-time updates (comments, reactions, live chat) propagate across multiple Vercel function instances. Today, two users connected to different instances do not see each other's events live; the original Phase 11 design called this out as a known limitation.

## Constraints

- **Minimum viable swap.** No tests, no structured logging beyond `console.error`, no client-side reconnect UI, no admin observability endpoint. Subsequent passes (B, C from brainstorm) can layer those on.
- **Backend: Xata Postgres.** No new infrastructure, no new env vars. Reuse `DATABASE_URL`.
- **Public API stays nearly identical.** Callers go from `eventBus.publish(...)` to `await eventBus.publish(...)`. `subscribe(channel, fn)` stays synchronous and keeps returning an unsubscribe function.
- **Drop the in-memory bus entirely.** No dual-publish, no fallback. Local dev hits the dev Postgres database, same code path as production.

## Architecture

### Replace `src/lib/sse/event-bus.ts`

```ts
type Listener = (data: unknown) => void;

class PgEventBus {
  subscribe(channel: string, listener: Listener): () => void;
  publish(channel: string, data: unknown): Promise<void>;
}

export const eventBus = new PgEventBus();
```

Internals:

- Maintains `Map<channel, Set<Listener>>` in memory for in-process fan-out (a single Node instance can have many SSE clients on the same channel)
- Lazy-initializes a single dedicated `pg.Client` (the *listener client*) on first `subscribe`. The listener client is separate from the Prisma adapter pool; it dedicates its connection to LISTEN.
- On first listener for a channel: issue `LISTEN "ch"`. On last unsubscribe: issue `UNLISTEN "ch"`.
- Single `client.on("notification", evt)` handler routes incoming NOTIFYs to the matching channel's listeners, JSON-decoding the payload before passing.
- On `client.on("error", ...)` or unexpected disconnect: backoff-reconnect (1s, 2s, 5s, 10s, capped at 30s; reset to 1s on success) and re-issue `LISTEN` for every channel that still has listeners.
- `publish` does `await listenerClient.query("SELECT pg_notify($1, $2)", [safeChannelName(ch), JSON.stringify(data)])`. We use the same listener client so we don't open a second connection. (`pg_notify` is a regular query and works fine on a client that's also LISTENing.)

### Channel naming utility

Postgres NOTIFY channel names are bare identifiers, max 63 bytes, with restricted characters. Current channels:

- `episode:${slug}` — slug can exceed 63 bytes (e.g., the EP1596 slug is 51 chars but episode slugs are unbounded)
- `live:chat` — safe

Add `safeChannelName(raw: string): string` in the same module:

- If `raw.length <= 63 && /^[A-Za-z0-9_:.\-]+$/.test(raw)`, return `raw` unchanged
- Else return `"ch_" + sha256(raw).slice(0, 16)` (uses `node:crypto`)

Apply at every `publish` and `subscribe` call site inside the bus — symmetric, so a publisher and subscriber for the same logical channel always agree.

### Caller changes (3 files)

Every change is mechanical: prepend `await` to the existing `eventBus.publish(...)` call.

- `src/app/api/episodes/[slug]/comments/route.ts` line 78
- `src/app/api/episodes/[slug]/reactions/route.ts` line 62
- `src/app/api/live/chat/route.ts` line 54

No changes to `src/app/api/sse/episodes/[slug]/route.ts` or `src/app/api/sse/live/chat/route.ts` — the `subscribe` API is unchanged.

No changes to `src/lib/sse/use-sse.ts` or any client component — they communicate with the SSE endpoints via plain `EventSource`, which is unaffected.

## Data flow (after change)

Comment-post path with two users on different Vercel instances:

1. User A (instance X) POSTs comment → handler creates row in DB
2. Handler calls `await eventBus.publish("episode:slug", { type: "new-comment", ... })`
3. Bus on instance X executes `SELECT pg_notify('episode:slug', '{"type":"new-comment",...}')`
4. Postgres broadcasts NOTIFY to every backend with an active LISTEN on that channel
5. Instance X's listener client receives `notification` event → finds local subscribers in its Map → fires each → User A's SSE response stream sees the message
6. Instance Y's listener client receives the same `notification` event → finds User B's subscriber in its Map → fires it → User B's SSE response stream sees the message
7. Both users' browsers fire EventSource `message` events at roughly the same moment

Reactions and live chat follow the same shape, just with different channel names and payload types.

## Error handling

- `publish` errors propagate to the calling route. Route handler logs via `console.error` and returns success anyway (the comment is saved; only real-time fan-out failed). Existing routes already structure their responses so a publish failure does not break the user-facing operation — they just need a `try/await/catch` around the `await`.
- Listener client `error` event triggers reconnect with exponential backoff. In-flight events during the disconnected window are lost — acceptable for a live feed; the next page load will refetch comments/reactions from the DB.
- On every successful (re)connect, the bus iterates its `Map` keys and re-issues `LISTEN "ch"` for each before resolving. Any listener registered during the reconnect window is queued and LISTENed when the client comes back.

## Out of scope (explicit)

- Tests (unit or integration) — deferred to scope B
- Structured logging beyond `console.error` — deferred to scope B
- Visible "Reconnecting…" UI in `CommentSection` / `ReactionBar` / `LiveChat` — deferred to scope C; browser EventSource auto-reconnect already handles transient disconnects transparently
- Admin `/api/admin/sse-status` debug endpoint — deferred to scope C
- Removing or simplifying `use-sse.ts` and existing client components — they are already correct
- Any change to the SSE endpoint files (`/api/sse/...`) — they only consume `subscribe`, which is unchanged

## Risks & mitigations

- **Xata connection cap.** The listener client holds one persistent connection per Node instance. Vercel Fluid Compute typically keeps a small number of warm instances per region, so this should consume well under 10 connections in practice. If Xata ever rejects the listener client connection (e.g., during a scaling spike), the reconnect backoff handles it.
- **NOTIFY payload size.** Postgres caps NOTIFY payloads at 8000 bytes. Current payloads (comment metadata + content trimmed to 2000 chars, reaction counts, live-chat messages trimmed to 500 chars) are well under. We do not add a runtime size guard; oversize would error in `pg_notify` and the catch path logs it.
- **`subscribe` race window.** Because `subscribe` is sync but `LISTEN` is async, there is a small window where events could be missed between subscribe-call and LISTEN-ack. This is fine for SSE on initial connect — subscribers don't expect historical events; they want future events. The connect-time `connected` SSE message that the SSE endpoints already send still fires immediately because it doesn't go through the bus.
- **Process restart loses in-flight events.** Same characteristic as the in-memory bus today. No regression.
