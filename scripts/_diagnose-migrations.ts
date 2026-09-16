/**
 * Read-only report on `_prisma_migrations`.
 *
 * `migrate.yml`'s inline diagnosis flags any row where `logs is not null`, but
 * only prints `started_at` and `applied_steps_count`. A migration that finished
 * cleanly while recording output is therefore indistinguishable from one that
 * died — yet only the latter raises P3009 and blocks every later deploy.
 *
 * This prints `finished_at` / `rolled_back_at` too, and labels each row, so the
 * resolve decision rests on evidence. Runs via the `Run DB Script` workflow:
 *
 *     script: _diagnose-migrations.ts
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

// A row blocks `migrate deploy` only if it never finished or was rolled back.
const isBlocking = (row: MigrationRow): boolean =>
  row.finished_at === null || row.rolled_back_at !== null;

async function main(): Promise<void> {
  const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL;
  if (!url) throw new Error("Neither DIRECT_URL nor DATABASE_URL is set");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
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
      console.log("No migration row carries a marker. Nothing blocks deploy.");
      return;
    }

    console.log(`MIGRATION ROWS CARRYING MARKERS (${rows.length}):\n`);
    for (const row of rows) {
      console.log(
        `  [${isBlocking(row) ? "BLOCKING" : "ok"}] ${row.migration_name}\n` +
          `      started=${iso(row.started_at)}\n` +
          `      finished=${iso(row.finished_at)}\n` +
          `      rolled_back=${iso(row.rolled_back_at)}\n` +
          `      steps_applied=${row.applied_steps_count}  has_logs=${row.has_logs}\n`,
      );
    }

    const blockers = rows.filter(isBlocking);
    console.log(
      blockers.length === 0
        ? "0 blocking rows. Every row above finished cleanly and merely recorded logs."
        : `${blockers.length} row(s) would fail \`migrate deploy\` with P3009: ` +
            blockers.map((r) => r.migration_name).join(", "),
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Diagnose failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
