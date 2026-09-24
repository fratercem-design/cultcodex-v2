/**
 * Read-only report on `_prisma_migrations`, used as the diagnosis step of the
 * `Run DB Migrations` workflow and runnable on its own via `Run DB Script`:
 *
 *     script: _diagnose-migrations.ts
 *
 * A failed migration row blocks every subsequent deploy with P3009, and the
 * error alone does not say whether the migration's changes actually landed.
 * This prints both halves of that question so the resolve choice rests on
 * evidence rather than a guess.
 *
 * Issues no writes.
 */
import { Client } from "pg";

interface MigrationRow {
  migration_name: string;
  started_at: Date | null;
  finished_at: Date | null;
  rolled_back_at: Date | null;
  applied_steps_count: number;
  has_logs: boolean;
}

const iso = (value: Date | null): string => value?.toISOString() ?? "null";

// P3009 fires only on an UNRESOLVED failure: started, never finished, and never
// marked rolled back. A `rolled_back_at` timestamp is the resolution, not the
// problem — it is what `prisma migrate resolve --rolled-back` writes to clear
// the block — so those rows are history, and deploy steps over them.
const isBlocking = (row: MigrationRow): boolean =>
  row.finished_at === null && row.rolled_back_at === null;

const label = (row: MigrationRow): string => {
  if (isBlocking(row)) return "FAILED — blocks deploy";
  if (row.rolled_back_at !== null) return "resolved: rolled back";
  return "ok";
};

// The `logs is not null` arm also matches rows that finished cleanly but
// recorded output. They are noise, not blockers — hence the per-row label.
async function reportMigrations(client: Client): Promise<void> {
  const { rows } = await client.query<MigrationRow>(
    `select migration_name,
            started_at,
            finished_at,
            rolled_back_at,
            applied_steps_count,
            logs is not null as has_logs
       from "_prisma_migrations"
      where finished_at is null
         or rolled_back_at is not null
         or logs is not null
      order by started_at desc`,
  );

  if (rows.length === 0) {
    console.log("No migration row carries a marker.");
    return;
  }

  console.log(`MIGRATION ROWS CARRYING MARKERS (${rows.length}):\n`);
  for (const row of rows) {
    console.log(
      `  [${label(row)}] ${row.migration_name}\n` +
        `      started=${iso(row.started_at)}\n` +
        `      finished=${iso(row.finished_at)}\n` +
        `      rolled_back=${iso(row.rolled_back_at)}\n` +
        `      steps_applied=${row.applied_steps_count}  has_logs=${row.has_logs}\n`,
    );
  }

  const blockers = rows.filter(isBlocking);
  console.log(
    blockers.length === 0
      ? "0 unresolved failures. `migrate deploy` is clear of P3009."
      : `${blockers.length} unresolved failure(s) will fail \`migrate deploy\` with P3009: ` +
          blockers.map((r) => r.migration_name).join(", "),
  );
}

async function reportTables(client: Client): Promise<void> {
  const { rows } = await client.query<{ table_name: string }>(
    `select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`,
  );
  const names = rows.map((r) => r.table_name);

  console.log(`\nPUBLIC TABLES (${names.length}):`);
  console.log("  " + names.join(", "));
  console.log(
    "\nDecision rule: if the tables a failed migration was meant to create are" +
      "\nALREADY in that list, resolve it as `applied`. If none of them are there," +
      "\nresolve it as `rolled-back` so it runs again. If only SOME are there, the" +
      "\nmigration half-applied — do not resolve automatically, fix it by hand.",
  );
}

async function main(): Promise<void> {
  // Mirror prisma.config.ts: prefer the non-pooled URL, and treat an unset
  // GitHub secret (which arrives as "") as absent rather than as a value.
  const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL;
  if (!url) throw new Error("Neither DIRECT_URL nor DATABASE_URL is set");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await reportMigrations(client);
    await reportTables(client);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Diagnose failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
