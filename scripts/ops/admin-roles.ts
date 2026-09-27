/**
 * Read-only: list every CodexUser whose stored role is "admin".
 *
 * requireAdmin() trusts the stored role, and until the 2026-09-24 audit fix the
 * "Grant Oracle Access" button wrote role = "admin". This finds accounts that
 * got admin that way. An account that is not in ADMIN_EMAILS should have its
 * role reset by hand.
 *
 * Emails are masked because Actions logs are not a private place. When the job
 * passes ADMIN_EMAILS, each row also says whether that address is on the list.
 */
import { Client } from "pg";

const STAGING_BRANCH = "duthqmsm1t7o7495r8vnb635n0";

function mask(email: string): string {
  const [local, domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const url = new URL(raw);
  const db = url.pathname.slice(1);
  console.log(`database: ${url.hostname} / ${db}`);
  if (url.hostname.includes(STAGING_BRANCH)) console.log("WARNING: this is the staging branch, not production.");
  if (db !== "postgres") console.log(`WARNING: database is "${db}"; production data lives in "postgres".`);

  const envAdmins = new Set(
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );

  const client = new Client({ connectionString: raw });
  await client.connect();
  const { rows } = await client.query<{
    id: string;
    email: string;
    createdAt: Date;
    isLifetimeMember: boolean;
    subscriptionTier: string | null;
  }>(
    `SELECT id, email, "createdAt", "isLifetimeMember", "subscriptionTier"
       FROM "CodexUser" WHERE role = 'admin' ORDER BY "createdAt"`
  );
  await client.end();

  console.log(`\n${rows.length} account(s) with role = admin:`);
  for (const r of rows) {
    const listed = envAdmins.size === 0 ? "?" : envAdmins.has(r.email.toLowerCase()) ? "yes" : "NO";
    console.log(
      `  ${mask(r.email).padEnd(32)} id=${r.id}  in ADMIN_EMAILS=${listed}  ` +
        `tier=${r.subscriptionTier ?? "-"} lifetime=${r.isLifetimeMember} created=${r.createdAt.toISOString().slice(0, 10)}`
    );
  }
  if (envAdmins.size === 0) {
    console.log("\nADMIN_EMAILS was not available to this job; compare the list by hand.");
  } else {
    const unlisted = rows.filter((r) => !envAdmins.has(r.email.toLowerCase())).length;
    console.log(`\n${unlisted} admin account(s) not in ADMIN_EMAILS.`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
