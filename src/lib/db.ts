import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // In production DATABASE_URL is always set; using a placeholder at
  // build time is safe — no DB connection is opened until first query.
  const connectionString = process.env.DATABASE_URL ?? "postgresql://localhost/placeholder";
  // connectionTimeoutMillis prevents generateStaticParams from hanging the
  // Railway build if Neon is slow or the connection pool is exhausted.
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 5,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
