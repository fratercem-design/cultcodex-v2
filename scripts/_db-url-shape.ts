/**
 * Read-only: identifies WHICH database DATABASE_URL points at, without
 * printing credentials. Prints host, port, database name, parameter names,
 * server version and a row count that tells production from an empty branch.
 *
 * Runs via the `Run DB Script` workflow:  script: _db-url-shape.ts
 */
import { Client } from "pg";

async function main(): Promise<void> {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error("DATABASE_URL is not set");
  const u = new URL(raw);

  console.log(`host=${u.hostname}`);
  console.log(`port=${u.port || "5432"} db=${u.pathname.slice(1)} params=${[...u.searchParams.keys()].join(",")}`);
  console.log(`user=<${u.username.length} chars> password=<${u.password.length} chars>`);

  const client = new Client({ connectionString: raw });
  await client.connect();
  try {
    const version = (await client.query("show server_version")).rows[0].server_version;
    const episodes = (await client.query(`select count(*)::int as n from "Episode"`)).rows[0].n;
    console.log(`server_version=${version} episodes=${episodes}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
