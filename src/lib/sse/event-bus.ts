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
      // On reconnect this restores all subscriptions before publish/dispatch resumes.
      // On initial connect it also covers any subscribe() that registered while
      // getClient() was pending — its own background LISTEN may not have fired yet.
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

    // Bound publish latency so a stalled connect/reconnect can't make a
    // user-facing POST appear hung. Callers wrap publish in try/catch and
    // continue; the dropped fan-out is logged via the thrown error.
    const PUBLISH_TIMEOUT_MS = 2000;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () =>
          reject(
            new Error(
              `[PgEventBus] publish timed out after ${PUBLISH_TIMEOUT_MS}ms`,
            ),
          ),
        PUBLISH_TIMEOUT_MS,
      );
    });
    // Avoid an unhandled rejection if the racers settle first.
    timeoutPromise.catch(() => {});

    try {
      const client = await Promise.race([this.getClient(), timeoutPromise]);
      await Promise.race([
        client.query("SELECT pg_notify($1, $2)", [
          safe,
          JSON.stringify(data),
        ]),
        timeoutPromise,
      ]);
    } finally {
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    }
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
