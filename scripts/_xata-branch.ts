/**
 * READ-ONLY: print the Xata branch host behind DATABASE_URL / DIRECT_URL, plus
 * migration and row-count facts, so a Fly app's database can be matched against
 * production. Prints hostnames only, never credentials.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const prisma = getPrisma();

function host(name: string) {
  const raw = process.env[name];
  if (!raw) return "(unset)";
  try {
    const u = new URL(raw);
    const schema = u.searchParams.get("schema") ?? "(default)";
    return `${u.hostname} db=${u.pathname} user=${u.username} schema=${schema}`;
  } catch {
    return "(unparseable)";
  }
}

async function main() {
  console.log(`DATABASE_URL host: ${host("DATABASE_URL")}`);
  console.log(`DIRECT_URL host:   ${host("DIRECT_URL")}`);

  const [who] = await prisma.$queryRawUnsafe<Record<string, string>[]>(
    `SELECT current_database() AS db, current_user AS usr, current_schema() AS schema,
            current_setting('search_path') AS search_path`
  );
  console.log(`session: ${JSON.stringify(who)}`);

  const [m] = await prisma.$queryRawUnsafe<{ applied: number; latest: string }[]>(
    `SELECT count(*)::int AS applied, max(migration_name) AS latest
       FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
  );
  console.log(`migrations applied: ${m.applied} | latest: ${m.latest}`);

  const [episodes, users] = await Promise.all([prisma.episode.count(), prisma.codexUser.count()]);
  console.log(`episodes: ${episodes} | codex users: ${users}`);
}

main().finally(() => disconnect());
