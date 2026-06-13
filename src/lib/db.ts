import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // DATABASE_URL is always set on Railway. At build time the module is
  // imported for static analysis but no queries are executed, so no actual
  // connection is opened until the first query at runtime.
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Guard for local dev / CI without a DB — throw only if a query is
    // actually attempted, so the build succeeds without DATABASE_URL.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        throw new Error(
          `DATABASE_URL is not set — cannot call prisma.${String(prop)}()`
        );
      },
    });
  }
  // `next build` spawns ~one static-generation worker per CPU (≈31 on Railway),
  // each importing this module and opening its own pool. At max:5 that's ~155
  // connections — past Postgres' max_connections (100) → "too many clients".
  // But max:1 is too tight: each worker renders several pages concurrently that
  // then queue on a single connection and blow the connect timeout. max:2 keeps
  // total connections in budget (≈31×2=62 < 100) while clearing the per-worker
  // queue, and a long connect timeout absorbs burst latency through the public
  // DB proxy. Runtime keeps a normal pool.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  // connectionTimeoutMillis prevents generateStaticParams from hanging the
  // Railway build if the DB is slow or the connection pool is exhausted.
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: isBuild ? 30000 : 5000,
    idleTimeoutMillis: 10000,
    max: isBuild ? 2 : 5,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
