/**
 * READ-ONLY: identify which database DATABASE_URL points at, without printing
 * the URL. Prints row counts + presence of recently-added tables/columns so
 * the output can be compared against known prod facts.
 */
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const prisma = getPrisma();

async function main() {
  const [db] = await prisma.$queryRawUnsafe<{ name: string; host: string }[]>(
    `SELECT current_database() AS name, inet_server_addr()::text AS host`
  ).catch(() => [{ name: "?", host: "?" }]);
  console.log(`database: ${db?.name} (server addr: ${db?.host})`);

  const episodes = await prisma.episode.count();
  const chapters = await prisma.psychenomiconChapter.count();
  console.log(`episodes: ${episodes} | psychenomicon chapters: ${chapters}`);

  for (const t of ["CardGift", "Spread", "Reading", "CardSet"]) {
    const [r] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${t}') AS exists`
    );
    console.log(`table ${t}: ${r.exists ? "EXISTS" : "MISSING"}`);
  }
  const [col] = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Episode' AND column_name = 'enrichmentQueued') AS exists`
  );
  console.log(`column Episode.enrichmentQueued: ${col.exists ? "EXISTS" : "MISSING"}`);
}

main().finally(() => disconnect());
