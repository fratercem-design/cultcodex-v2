/**
 * APPLY: set one CodexUser that got admin from the old "Grant Oracle Access"
 * button back to role = "user". Their Oracle tier (lifetime system) is kept.
 *
 * The target id comes from ops/admin-roles.ts output and was confirmed by the
 * owner on 2026-09-30. Only a row that is still role = admin is changed, and
 * the script refuses to run against staging or any database but /postgres.
 */
import { Client } from "pg";

const TARGET_ID = "cmq179ae7000015o59mcg2db7";
const STAGING_BRANCH = "duthqmsm1t7o7495r8vnb635n0";

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const url = new URL(raw);
  const db = url.pathname.slice(1);
  console.log(`database: ${url.hostname} / ${db}`);
  if (url.hostname.includes(STAGING_BRANCH) || db !== "postgres") {
    throw new Error("Refusing to run: not the production /postgres database.");
  }

  const client = new Client({ connectionString: raw });
  await client.connect();
  try {
    const { rows } = await client.query<{ id: string; role: string; subscriptionTier: string | null; isLifetimeMember: boolean }>(
      `UPDATE "CodexUser" SET role = 'user', "updatedAt" = now()
        WHERE id = $1 AND role = 'admin'
        RETURNING id, role, "subscriptionTier", "isLifetimeMember"`,
      [TARGET_ID]
    );
    if (rows.length === 0) {
      console.log(`No change: ${TARGET_ID} is not an admin (or does not exist).`);
    } else {
      const r = rows[0];
      console.log(`Updated ${r.id}: role=${r.role} tier=${r.subscriptionTier ?? "-"} lifetime=${r.isLifetimeMember}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
