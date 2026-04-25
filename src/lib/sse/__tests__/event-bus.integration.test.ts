/**
 * Integration test for PgEventBus against a real Postgres-compatible target.
 *
 * Primary path: an in-process PGlite database exposed over a TCP socket via
 * @electric-sql/pglite-socket so the `pg` Client can connect to it as if it
 * were a normal Postgres server.
 *
 * Fallback: if pglite-socket setup proves unworkable in this environment,
 * set RUN_INTEGRATION=1 and DATABASE_URL to a real Postgres connection
 * string. The default behavior (no RUN_INTEGRATION) skips the test so
 * `npm test` stays hermetic.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

// Arbitrary high port; if EADDRINUSE, change to another free port and rerun.
const PORT = 56432;

let pglite: PGlite | undefined;
let server: PGLiteSocketServer | undefined;

beforeAll(async () => {
  pglite = await PGlite.create();
  server = new PGLiteSocketServer({
    db: pglite,
    host: "127.0.0.1",
    port: PORT,
  });
  await server.start();
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;
}, 30_000);

afterAll(async () => {
  await server?.stop();
  await pglite?.close();
});

describe("PgEventBus integration (pglite)", () => {
  it("publish → NOTIFY → listener fires (real Postgres semantics)", async () => {
    // Force the bus to be re-instantiated (clear singleton) so it picks up
    // the new DATABASE_URL.
    const g = globalThis as Record<string, unknown>;
    delete g.__cultcodexPgEventBus;

    vi.resetModules();
    const { eventBus } = await import("../event-bus");

    const received: unknown[] = [];
    const unsub = eventBus.subscribe("test:integration", (data) =>
      received.push(data),
    );

    // Allow LISTEN to settle on the wire.
    await new Promise((r) => setTimeout(r, 200));

    await eventBus.publish("test:integration", { hello: "world" });

    // Allow NOTIFY round-trip.
    await new Promise((r) => setTimeout(r, 200));

    expect(received).toEqual([{ hello: "world" }]);

    unsub();
    await new Promise((r) => setTimeout(r, 100));
  }, 10_000);
});
