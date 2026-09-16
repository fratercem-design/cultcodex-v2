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
export function resolveConnectionString(): string | null {
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
  // pg currently treats these modes as verify-full but will change their
  // semantics in its next major release. Make the existing strict behavior
  // explicit now and silence the runtime deprecation warning.
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    console.error("[db] DATABASE_URL is not a parseable PostgreSQL connection URL.");
    return null;
  }
  const sslMode = parsed.searchParams.get("sslmode")?.toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";

  // Production must authenticate both the server certificate and hostname.
  // An absent mode is not a secure default in node-postgres, and explicitly
  // weak/disabled modes must never be accepted silently.
  if (isProduction) {
    if (sslMode === "disable" || sslMode === "allow") {
      throw new Error("[db] Refusing an insecure PostgreSQL TLS mode in production.");
    }
    parsed.searchParams.set("sslmode", "verify-full");
  } else if (sslMode && ["prefer", "require", "verify-ca"].includes(sslMode)) {
    parsed.searchParams.set("sslmode", "verify-full");
  }
  return parsed.toString();
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
  // Fly runs one long-lived Node process per Machine, so this pool is
  // shared by all requests handled by that replica.

  // `next build` spawns roughly one static-generation worker per CPU, each
  // importing this module and opening its own pool. max:2 keeps the total in
  // budget while still clearing each worker's internal queue (max:1 serialises
  // pages that render several queries concurrently and blows the timeout).
  const max = isBuild ? 2 : 5;

  // Xata branches hibernate when idle: the first query after a sleep has to
  // wait for the branch to reactivate. Allow generous time during builds (which
  // prerender thousands of pages) and a shorter, user-facing budget at runtime.
  const connectionTimeoutMillis = isBuild ? 30000 : 5000;

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis,
    // Release idle connections promptly when Fly replaces or stops a Machine.
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
