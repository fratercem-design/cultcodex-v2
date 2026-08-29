# Postgres-backed SSE Event Bus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory `EventBus` (`src/lib/sse/event-bus.ts`) with a Postgres `LISTEN/NOTIFY`-backed implementation so SSE-driven real-time updates propagate across multiple Vercel function instances.

**Architecture:** A single dedicated `pg.Client` per Node instance, lazy-started on first `subscribe`, holds a long-lived connection and `LISTEN`s to every active channel. `publish` becomes async and runs `SELECT pg_notify($1, $2)` on the same client. Auto-reconnect with exponential backoff handles dropped connections; on reconnect, re-`LISTEN`s to every channel that still has subscribers. Three caller sites (`comments`, `reactions`, `live/chat` POSTs) gain `await` on the publish call, wrapped in try/catch so a publish failure doesn't break the user-facing operation.

**Tech Stack:** TypeScript, `pg` v8 (already in `package.json`), Next.js 15 App Router (`runtime = "nodejs"` for SSE endpoints), Xata Postgres.

**Spec:** [`docs/superpowers/specs/2026-04-24-sse-pg-event-bus-design.md`](../specs/2026-04-24-sse-pg-event-bus-design.md)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/sse/event-bus.ts` | Rewrite | New `PgEventBus` class + `safeChannelName` utility + HMR-safe singleton export |
| `src/app/api/episodes/[slug]/comments/route.ts` | Modify | Add `await` + try/catch around `eventBus.publish` (line 78) |
| `src/app/api/episodes/[slug]/reactions/route.ts` | Modify | Add `await` + try/catch around `eventBus.publish` (line 62) |
| `src/app/api/live/chat/route.ts` | Modify | Add `await` + try/catch around `eventBus.publish` (line 54) |

No test files (per spec scope: minimum viable — tests deferred to scope B).
No changes to SSE endpoint files, `use-sse.ts`, or any client component.

---

## Task 1: Rewrite event-bus.ts as Postgres-backed PgEventBus

**Files:**
- Modify: `src/lib/sse/event-bus.ts` (full replacement)

- [ ] **Step 1: Confirm `pg` is available**

Run: `node -e "console.log(require('pg').Client.name)"` from `C:\Users\John Bates\Projects\cultcodex-v2`
Expected: `Client`

(`pg` is already a direct dep — `package.json` has `"pg": "^8.20.0"` and `"@types/pg": "^8.18.0"`. This step just confirms the install resolved.)

- [ ] **Step 2: Replace the file contents**

Open `src/lib/sse/event-bus.ts` and replace the entire file with:

```ts
import { Client as PgClient } from "pg";
import { createHash } from "node:crypto";

type Listener = (data: unknown) => void;

const SAFE_CHANNEL_RE = /^[A-Za-z0-9_:.\-]+$/;

/**
 * Postgres NOTIFY channel names are bare identifiers, max 63 bytes,
 * with a restricted character set. Long or unsafe raw channel names
 * are deterministically hashed to a fixed-length safe name. The same
 * raw input always produces the same safe output, so publishers and
 * subscribers stay in agreement.
 */
export function safeChannelName(raw: string): string {
  if (raw.length <= 63 && SAFE_CHANNEL_RE.test(raw)) {
    return raw;
  }
  return "ch_" + createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

class PgEventBus {
  // raw channel -> set of in-process listeners
  private listeners = new Map<string, Set<Listener>>();
  // raw channel -> safe channel (cached so we don't hash on every dispatch)
  private safeByRaw = new Map<string, string>();
  // safe channel -> raw channel (reverse lookup for incoming NOTIFY dispatch)
  private rawBySafe = new Map<string, string>();

  private client: PgClient | null = null;
  private clientReady: Promise<PgClient> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 1000;
  private readonly MAX_RECONNECT_DELAY_MS = 30_000;

  private getSafeChannel(raw: string): string {
    let safe = this.safeByRaw.get(raw);
    if (!safe) {
      safe = safeChannelName(raw);
      this.safeByRaw.set(raw, safe);
      this.rawBySafe.set(safe, raw);
    }
    return safe;
  }

  private async getClient(): Promise<PgClient> {
    if (this.client) return this.client;
    if (this.clientReady) return this.clientReady;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    this.clientReady = (async () => {
      const client = new PgClient({ connectionString });

      client.on("notification", (msg) => {
        if (!msg.channel) return;
        const raw = this.rawBySafe.get(msg.channel) ?? msg.channel;
        const set = this.listeners.get(raw);
        if (!set) return;
        let data: unknown;
        try {
          data = msg.payload ? JSON.parse(msg.payload) : null;
        } catch (err) {
          console.error("[PgEventBus] Failed to parse NOTIFY payload:", err);
          return;
        }
        for (const fn of set) {
          try {
            fn(data);
          } catch (err) {
            console.error("[PgEventBus] Listener threw:", err);
          }
        }
      });

      client.on("error", (err) => {
        console.error("[PgEventBus] Client error:", err);
        this.scheduleReconnect();
      });

      client.on("end", () => {
        console.error("[PgEventBus] Client ended unexpectedly");
        this.scheduleReconnect();
      });

      await client.connect();

      // Re-LISTEN to every channel that currently has subscribers.
      // (After a reconnect, this restores all subscriptions before publish/dispatch resumes.)
      for (const raw of this.listeners.keys()) {
        const safe = this.getSafeChannel(raw);
        await client.query(`LISTEN "${safe}"`);
      }

      this.reconnectDelayMs = 1000; // reset backoff on successful connect
      this.client = client;
      return client;
    })();

    try {
      return await this.clientReady;
    } catch (err) {
      this.clientReady = null;
      this.scheduleReconnect();
      throw err;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return; // already scheduled

    if (this.client) {
      try {
        this.client.removeAllListeners();
      } catch {
        // ignore
      }
      try {
        this.client.end().catch(() => {
          // ignore
        });
      } catch {
        // ignore
      }
    }
    this.client = null;
    this.clientReady = null;

    const delay = this.reconnectDelayMs;
    this.reconnectDelayMs = Math.min(
      this.reconnectDelayMs * 2,
      this.MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.getClient().catch((err) => {
        console.error("[PgEventBus] Reconnect failed:", err);
      });
    }, delay);
  }

  subscribe(channel: string, listener: Listener): () => void {
    const safe = this.getSafeChannel(channel);
    let set = this.listeners.get(channel);
    const isFirst = !set;
    if (!set) {
      set = new Set();
      this.listeners.set(channel, set);
    }
    set.add(listener);

    if (isFirst) {
      // Issue LISTEN in the background. The small race window between
      // subscribe() returning and LISTEN being acked is acceptable for
      // SSE — subscribers expect future events, not historical ones.
      this.getClient()
        .then((c) => c.query(`LISTEN "${safe}"`))
        .catch((err) =>
          console.error(`[PgEventBus] LISTEN failed for ${safe}:`, err),
        );
    }

    return () => {
      const s = this.listeners.get(channel);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) {
        this.listeners.delete(channel);
        if (this.client) {
          this.client.query(`UNLISTEN "${safe}"`).catch((err) => {
            console.error(`[PgEventBus] UNLISTEN failed for ${safe}:`, err);
          });
        }
      }
    };
  }

  async publish(channel: string, data: unknown): Promise<void> {
    const safe = this.getSafeChannel(channel);
    const client = await this.getClient();
    await client.query("SELECT pg_notify($1, $2)", [
      safe,
      JSON.stringify(data),
    ]);
  }
}

// Cache across HMR in dev (same pattern as src/lib/db.ts uses for prisma)
const globalForBus = globalThis as unknown as {
  __cultcodexPgEventBus?: PgEventBus;
};

export const eventBus =
  globalForBus.__cultcodexPgEventBus ?? new PgEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForBus.__cultcodexPgEventBus = eventBus;
}
```

- [ ] **Step 3: Verify the file typechecks**

Run: `npx tsc --noEmit`
Expected: zero errors. (If errors point to the rewritten file, re-read the code; it should be self-contained.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/sse/event-bus.ts
git commit -m "feat(sse): replace in-memory EventBus with Postgres LISTEN/NOTIFY-backed PgEventBus"
```

---

## Task 2: Update comments POST to await publish

**Files:**
- Modify: `src/app/api/episodes/[slug]/comments/route.ts` (block at lines 77–90)

- [ ] **Step 1: Replace the publish block**

Open `src/app/api/episodes/[slug]/comments/route.ts`. Find this block (around lines 77–90):

```ts
    // Publish to SSE for real-time updates (only unflagged comments)
    eventBus.publish(`episode:${slug}`, {
      type: "new-comment",
      data: {
        id: comment.id,
        content: comment.content,
        userId: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: comment.createdAt,
        parentId: comment.parentId ?? null,
        flagged: comment.flagged,
      },
    });
```

Replace it with:

```ts
    // Publish to SSE for real-time updates (only unflagged comments).
    // Wrapped because PgEventBus.publish is now async and a Postgres
    // hiccup must not break comment creation — the row is already saved.
    try {
      await eventBus.publish(`episode:${slug}`, {
        type: "new-comment",
        data: {
          id: comment.id,
          content: comment.content,
          userId: user.id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          createdAt: comment.createdAt,
          parentId: comment.parentId ?? null,
          flagged: comment.flagged,
        },
      });
    } catch (err) {
      console.error("[comments] eventBus.publish failed:", err);
    }
```

- [ ] **Step 2: Verify the file typechecks**

Run: `npx tsc --noEmit`
Expected: zero errors. (The enclosing `POST` handler is already `async`, so `await` is legal here.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/episodes/[slug]/comments/route.ts
git commit -m "feat(sse): await PgEventBus.publish in comments POST"
```

---

## Task 3: Update reactions POST to await publish

**Files:**
- Modify: `src/app/api/episodes/[slug]/reactions/route.ts` (block at lines 61–65)

- [ ] **Step 1: Replace the publish block**

Open `src/app/api/episodes/[slug]/reactions/route.ts`. Find this block (around lines 61–65):

```ts
  // Publish to SSE for real-time updates
  eventBus.publish(`episode:${slug}`, {
    type: "reaction-update",
    data: counts,
  });
```

Replace it with:

```ts
  // Publish to SSE for real-time updates.
  // Wrapped because PgEventBus.publish is now async and a Postgres
  // hiccup must not break the reaction toggle — the change is already saved.
  try {
    await eventBus.publish(`episode:${slug}`, {
      type: "reaction-update",
      data: counts,
    });
  } catch (err) {
    console.error("[reactions] eventBus.publish failed:", err);
  }
```

- [ ] **Step 2: Verify the file typechecks**

Run: `npx tsc --noEmit`
Expected: zero errors. (The enclosing `POST` handler is already `async`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/episodes/[slug]/reactions/route.ts
git commit -m "feat(sse): await PgEventBus.publish in reactions POST"
```

---

## Task 4: Update live chat POST to await publish

**Files:**
- Modify: `src/app/api/live/chat/route.ts` (block at lines 54–64)

- [ ] **Step 1: Replace the publish block**

Open `src/app/api/live/chat/route.ts`. Find this block (around lines 54–64):

```ts
  eventBus.publish("live:chat", {
    type: "new-chat-message",
    data: {
      id: message.id,
      userId: message.userId,
      displayName: message.displayName,
      avatarUrl: message.avatarUrl,
      content: message.content,
      createdAt: message.createdAt,
    },
  });
```

Replace it with:

```ts
  // Wrapped because PgEventBus.publish is now async and a Postgres
  // hiccup must not break the chat message — the row is already saved.
  try {
    await eventBus.publish("live:chat", {
      type: "new-chat-message",
      data: {
        id: message.id,
        userId: message.userId,
        displayName: message.displayName,
        avatarUrl: message.avatarUrl,
        content: message.content,
        createdAt: message.createdAt,
      },
    });
  } catch (err) {
    console.error("[live/chat] eventBus.publish failed:", err);
  }
```

- [ ] **Step 2: Verify the file typechecks**

Run: `npx tsc --noEmit`
Expected: zero errors. (The enclosing `POST` handler is already `async`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/live/chat/route.ts
git commit -m "feat(sse): await PgEventBus.publish in live chat POST"
```

---

## Task 5: Local single-instance smoke verification

This task verifies the rewrite didn't break anything in single-instance mode. Cross-instance behavior cannot be tested locally (Next.js dev server runs in one process); that's verified in production in Task 6.

**Files:** none

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server boots without errors. Note the URL (typically `http://localhost:3000`).

- [ ] **Step 2: Open two browser tabs to the same episode**

Pick any published episode URL (e.g., `http://localhost:3000/episodes/<some-slug>`). Open it in two tabs in the same browser. Sign in if you're not already.

- [ ] **Step 3: Verify comments propagate**

In Tab A, open the browser devtools Network panel and confirm the SSE connection to `/api/sse/episodes/<slug>` is established (status `200`, type `eventsource`, payload starts with `data: {"type":"connected",...}`).

In Tab B, post a comment.

Expected: Tab A's comment list updates with the new comment within ~1 second, without a page refresh. The SSE Network entry shows a new `data: {"type":"new-comment",...}` frame.

If Tab A doesn't update, check the dev server console for `[PgEventBus]` errors and the browser console for client-side errors.

- [ ] **Step 4: Verify reactions propagate**

In Tab B, click any reaction (🔥 / 👁 / 🌙 / 💀 / ✦).

Expected: Tab A's reaction count for that emoji increments within ~1 second. The SSE Network entry shows a new `data: {"type":"reaction-update",...}` frame.

- [ ] **Step 5: Verify live chat propagates (optional — requires admin)**

If you have admin access:
1. In a third tab, navigate to `/admin/live` and toggle the stream live
2. Open `/live` in two tabs
3. Post a chat message in one tab
4. Expected: the other tab shows the message within ~1 second

If you don't have a live admin path set up, skip this step — the chat publish path is structurally identical to comments and reactions, so if those work, this works.

- [ ] **Step 6: Verify clean disconnect**

Close one of the tabs. In the dev server console, confirm there's no error spam. (The bus's UNLISTEN should fire silently when the SSE connection's last subscriber unsubscribes.)

Stop the dev server (Ctrl+C). The Postgres client should disconnect cleanly; you may see one `[PgEventBus] Client ended unexpectedly` log on shutdown — that's expected and harmless.

- [ ] **Step 7: No commit (verification only)**

---

## Task 6: Push to production and verify cross-instance behavior

This task verifies the actual Phase-11-hardening goal: events propagate across multiple Vercel function instances.

**Files:** none

- [ ] **Step 1: Push the branch**

Run: `git push origin master`
Expected: push succeeds. Vercel auto-deploys on push (deploy hook is `prj_C1RLKpM6xWz72ACBIuTgLvK0Ey90`).

- [ ] **Step 2: Wait for deploy**

Watch the deploy at https://vercel.com/johns-projects-b2d4258b/cultcodex-final or run:

```bash
npx vercel@latest list --yes 2>/dev/null | head -5
```

Expected: the latest deploy moves to `Ready` status (~50s typical). If it fails, run `npx vercel@latest inspect <deployment-id> --logs` and address.

- [ ] **Step 3: Smoke single-instance in production**

Visit any episode URL on https://cultcodex.me, e.g., `https://cultcodex.me/episodes/<slug>`. In two tabs, repeat Task 5 Steps 3–4. Expected: same real-time behavior as local.

If this fails, check Vercel runtime logs for `[PgEventBus]` errors:

```bash
npx vercel@latest logs --yes 2>&1 | grep -i pgeventbus
```

A common failure mode is Xata refusing the listener client connection. The reconnect loop will surface as repeated `Reconnect failed` log entries.

- [ ] **Step 4: Smoke cross-instance in production**

This is the actual goal of the change. Two strategies — pick one:

**Strategy A (preferred — different devices):** Open the same episode URL on a phone and a laptop (or two different physical devices on different networks). Vercel's edge routing will likely route them to different function instances. Post a comment from one device — confirm it appears on the other within ~1 second.

**Strategy B (one device, force different instances):** Open the episode in two different browsers (e.g., Chrome and Firefox), each in incognito mode. Vercel may still route both to the same instance, so this is less reliable than Strategy A. If Strategy A worked, skip B.

Expected: the comment posted in instance X appears in instance Y's SSE stream within ~1 second. The fact that this works *at all* is the goal — pre-change, this would silently fail because the in-memory bus didn't cross instances.

- [ ] **Step 5: Sanity-check Xata connection count**

Visit the Xata dashboard for the project (https://app.xata.io). Look at active connections.
Expected: a small number (typically 1–3 listener client connections in addition to whatever Prisma's pool holds). If you see dozens, the bus is leaking — file a follow-up to investigate.

- [ ] **Step 6: Update MEMORY**

Append to `C:\Users\John Bates\.claude\projects\C--Users-John-Bates\memory\MEMORY.md` under the CultCodex v2 section:

```markdown
- **SSE event bus (2026-04-24)**: Replaced in-memory bus with Postgres LISTEN/NOTIFY (`src/lib/sse/event-bus.ts`). Comments, reactions, and live chat now propagate across Vercel instances. Deferred follow-ups (scope B/C from spec): tests, structured logging, visible reconnect UI, admin sse-status endpoint.
```

- [ ] **Step 7: Mark spec as shipped**

Update `docs/superpowers/specs/2026-04-24-sse-pg-event-bus-design.md` line 3:

```markdown
**Status:** shipped 2026-04-24
```

Commit:
```bash
git add docs/superpowers/specs/2026-04-24-sse-pg-event-bus-design.md
git commit -m "docs(sse): mark Postgres event bus spec as shipped"
git push origin master
```

---

## Out of Scope

Per the spec's "Out of scope (explicit)" section, the following are intentionally NOT in this plan:

- Unit or integration tests for `PgEventBus` — deferred to scope B
- Structured logging / metrics beyond `console.error` — deferred to scope B
- Visible "Reconnecting…" UI in `CommentSection` / `ReactionBar` / `LiveChat` — deferred to scope C
- Admin `/api/admin/sse-status` debug endpoint — deferred to scope C
- Any change to `src/app/api/sse/...` route files (they only consume `subscribe`, which is unchanged)
- Any change to `src/lib/sse/use-sse.ts` or client components (they're unaffected)
