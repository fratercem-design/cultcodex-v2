import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // During `next build` the module is imported for static analysis but
    // no queries are executed. Return a proxy that throws only if a query
    // is actually attempted, so the build succeeds without DATABASE_URL.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        throw new Error(
          `DATABASE_URL is not set — cannot call prisma.${String(prop)}()`
        );
      },
    });
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
