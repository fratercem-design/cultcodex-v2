/**
 * Read-only diagnosis of Prisma migration state.
 *
 * A failed migration blocks every later deploy with P3009, and the error alone
 * does not say whether the migration's objects actually landed — which is the
 * only thing that decides between `migrate resolve --applied` and
 * `--rolled-back`.
 *
 * Note on detection: Prisma marks a failure by writing `logs` on the row. A
 * failed row can still carry a `finished_at`, so filtering on `finished_at IS
 * NULL` alone reports a false all-clear while `migrate deploy` keeps refusing.
 * This checks `logs` too.
 *
 * Writes nothing. Safe to run against production.
 */
import { Client } from "pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url || url.includes("SENSITIVE")) {
  console.error(
    "No usable DIRECT_URL/DATABASE_URL. `vercel env pull` writes the literal\n" +
      "[SENSITIVE] for protected vars — put the real connection string in\n" +
      ".env.local, or run this in CI where the secrets are set."
  );
  process.exit(1);
}

const client = new Client({ connectionString: url });

/** Objects the named migration is expected to have created, by prefix. */
const PREFIXES = process.argv.slice(2);

async function main() {
  await client.connect();

  const { rows: suspect } = await client.query(
    `select migration_name, started_at, finished_at, rolled_back_at,
            applied_steps_count, logs
       from "_prisma_migrations"
      where finished_at is null
         or rolled_back_at is not null
         or logs is not null
      order by started_at desc`
  );

  if (!suspect.length) {
    console.log("No migration row carries a failure marker.");
  } else {
    console.log(`MIGRATIONS WITH A FAILURE MARKER (${suspect.length}):`);
    for (const r of suspect) {
      console.log(`  name            ${r.migration_name}`);
      console.log(`  started_at      ${r.started_at}`);
      console.log(`  finished_at     ${r.finished_at}`);
      console.log(`  rolled_back_at  ${r.rolled_back_at}`);
      console.log(`  applied_steps   ${r.applied_steps_count}`);
      console.log(`  logs            ${r.logs ?? "(none)"}`);
      console.log("");
    }
  }

  if (PREFIXES.length) {
    console.log(`OBJECTS MATCHING ${PREFIXES.join(", ")}:`);
    const { rows: objs } = await client.query(
      `select c.relname as name, c.relkind as kind
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname like any ($1)
        order by c.relkind, c.relname`,
      [PREFIXES.map((p) => `${p}%`)]
    );
    const kindLabel = { r: "table", i: "index", S: "sequence", v: "view" };
    for (const o of objs) {
      console.log(`  ${(kindLabel[o.kind] ?? o.kind).padEnd(8)} ${o.name}`);
    }

    const { rows: cons } = await client.query(
      `select conname, contype from pg_constraint
        where conname like any ($1) order by contype, conname`,
      [PREFIXES.map((p) => `${p}%`)]
    );
    const conLabel = { p: "primary", f: "foreign", u: "unique", c: "check" };
    console.log(`CONSTRAINTS (${cons.length}):`);
    for (const c of cons) {
      console.log(`  ${(conLabel[c.contype] ?? c.contype).padEnd(8)} ${c.conname}`);
    }

    console.log("");
    console.log("Decision rule:");
    console.log("  every expected object present  -> resolve --applied");
    console.log("  none present                   -> resolve --rolled-back");
    console.log("  some present                   -> fix by hand, do not resolve");
  }

  await client.end();
}

main().catch((err) => {
  console.error("Diagnose failed:", err.message);
  process.exitCode = 1;
  client.end().catch(() => {});
});
