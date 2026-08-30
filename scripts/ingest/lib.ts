import { config as loadEnv } from "dotenv";
import * as path from "path";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Next.js precedence: .env.local wins over .env. dotenv never overwrites a
// variable that is already set, so loading .env.local first gives it priority.
// This matters because `vercel env pull` writes the literal "[SENSITIVE]" for
// protected vars into .env — the real DATABASE_URL only ever lives in
// .env.local, which a bare `import "dotenv/config"` would never read.
const REPO_ROOT = path.resolve(__dirname, "../..");
loadEnv({ path: path.join(REPO_ROOT, ".env.local") });
loadEnv({ path: path.join(REPO_ROOT, ".env") });

/**
 * Guards against the two ways DATABASE_URL is wrong in practice: absent, or
 * present but holding the "[SENSITIVE]" placeholder, which otherwise fails far
 * downstream with a baffling `host: base` connection error.
 */
export function assertUsableDatabaseUrl(
  value: string | undefined
): asserts value is string {
  if (!value) {
    throw new Error(
      "DATABASE_URL environment variable is not set. Put the real Xata connection string in .env.local (not .env)."
    );
  }
  if (value.includes("[SENSITIVE]")) {
    throw new Error(
      'DATABASE_URL is the literal "[SENSITIVE]" placeholder that `vercel env pull` writes for protected vars. Copy the real connection string from the Vercel or Xata dashboard into .env.local.'
    );
  }
}

// ─── Prisma client for scripts ──────────────────────
let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  const connectionString = process.env.DATABASE_URL;
  assertUsableDatabaseUrl(connectionString);
  // Xata branches hibernate when idle, and these are batch scripts that are
  // often the first thing to touch a sleeping branch. Give the initial connect
  // room to wake it instead of failing on the first query and succeeding on a
  // manual retry.
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
    max: 5,
  });
  _prisma = new PrismaClient({ adapter });
  return _prisma;
}

export async function disconnect(): Promise<void> {
  if (_prisma) {
    await _prisma.$disconnect();
    _prisma = null;
  }
}

// ─── Slug generation ────────────────────────────────
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Search text builder ────────────────────────────
export function buildSearchText(
  ...parts: (string | null | undefined)[]
): string {
  return parts
    .filter((p): p is string => typeof p === "string" && p.length > 0)
    .map((p) => p.toLowerCase())
    .join(" ");
}
