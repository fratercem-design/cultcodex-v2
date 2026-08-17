import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Resolve a connection string we can actually dial.
 *
 * `vercel env pull` writes the literal string "[SENSITIVE]" for any env var
 * marked Sensitive in the dashboard — those are write-only and cannot be read
 * back. A .env full of "[SENSITIVE]" means DATABASE_URL is *set* but garbage,
 * which sails past a plain `if (!connectionString)` check and then fails deep
 * inside pg with an opaque parse/connect error. Validate the shape instead.
 */
function resolveConnectionString(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  if (!/^postgres(ql)?:\/\//i.test(raw)) {
    console.error(
      `[db] DATABASE_URL is set but is not a postgres:// URL (got "${raw.slice(0, 24)}"). ` +
        `If it reads "[SENSITIVE]" it is a \`vercel env pull\` placeholder for a Sensitive ` +
        `variable — put the real connection string in .env.local, which overrides .env.`
    );
    return null;
  }
  return raw;
}

function createPrismaClient(): PrismaClient {
  const connectionString = resolveConnectionString();

  if (!connectionString) {
    // Guard for local dev / CI without a usable DB.
    // Returns a two-level Proxy so that `prisma.model.findXxx().catch()` works:
    // the outer Proxy returns a model-level Proxy, which returns a function for
    // any method name; that function returns a rejected Promise so all existing
    // `.catch(() => fallback)` guards keep working during static rendering.
    const methodProxy = () =>
      Promise.reject(new Error("DATABASE_URL is not set (or is not a valid postgres:// URL)"));
    const modelProxy = new Proxy({} as object, { get: () => methodProxy });
    return new Proxy({} as PrismaClient, { get: () => modelProxy });
  }

  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  // On Vercel every serverless function instance is its own process with its
  // own pool, so the per-process ceiling has to stay low or concurrent lambdas
  // collectively exhaust the Postgres connection limit. On a long-lived Node
  // server (local `next start`, a container) one process serves everything, so
  // a larger pool is both safe and faster.
  const isServerless = Boolean(process.env.VERCEL);

  // `next build` spawns roughly one static-generation worker per CPU, each
  // importing this module and opening its own pool. max:2 keeps the total in
  // budget while still clearing each worker's internal queue (max:1 serialises
  // pages that render several queries concurrently and blows the timeout).
  const max = isBuild ? 2 : isServerless ? 3 : 5;

  // Xata branches hibernate when idle: the first query after a sleep has to
  // wait for the branch to reactivate. Allow generous time during builds (which
  // prerender thousands of pages) and a shorter, user-facing budget at runtime.
  const connectionTimeoutMillis = isBuild ? 30000 : isServerless ? 10000 : 5000;

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis,
    // Release idle connections promptly so scaled-down lambdas stop holding
    // slots against the branch's connection limit.
    idleTimeoutMillis: 10000,
    max,
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Cache the singleton on globalThis. Without this the `??` above never hits,
// so every dev hot-reload (and every module re-evaluation) built a brand new
// client and leaked its pool until the DB refused new connections.
globalForPrisma.prisma = prisma;
