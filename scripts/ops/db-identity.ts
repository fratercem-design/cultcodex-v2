/**
 * Read-only: which database DATABASE_URL reaches, and what schema it has.
 * Compare with the "Datasource" line the Run DB Migrations log prints for
 * DIRECT_URL — if the hosts or migration lists differ, migrations are landing
 * somewhere the app does not read.
 */
import { Client } from "pg";

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const url = new URL(raw);
  console.log(`DATABASE_URL host: ${url.hostname} · database: ${url.pathname.slice(1)} · port: ${url.port || "default"}`);
  const client = new Client({ connectionString: raw });
  await client.connect();
  const q = async (sql: string) => (await client.query(sql)).rows;
  console.log("server:", await q(`select current_database() as db, inet_server_addr()::text as addr, pg_is_in_recovery() as replica`));
  console.log("Episode.rumbleEmbedId:", (await q(`select 1 from information_schema.columns where table_name='Episode' and column_name='rumbleEmbedId'`)).length ? "present" : "MISSING");
  console.log("latest migrations:", (await q(`select migration_name, finished_at from "_prisma_migrations" order by started_at desc limit 3`)).map((r) => `${r.migration_name} @ ${r.finished_at?.toISOString?.() ?? r.finished_at}`));
  await client.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
