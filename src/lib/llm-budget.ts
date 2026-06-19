import { prisma } from "@/lib/db";

// Global daily circuit-breaker for paid-LLM endpoints. A per-IP rate limit
// can't stop an attacker who rotates IPs; a GLOBAL daily cap can — it bounds
// total spend no matter who calls or how. Backed by a tiny Postgres counter
// (created on first use, so no Prisma migration). Plus an instant kill-switch
// (AI_KILLSWITCH=1) to shut all paid-LLM endpoints off during an active attack
// without a deploy-time code change.

let ensured = false;
async function ensureTable(): Promise<void> {
  if (ensured) return;
  await prisma.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "LlmBudget" (bucket_day text PRIMARY KEY, count integer NOT NULL DEFAULT 0)`
  );
  ensured = true;
}

export type BudgetResult =
  | { ok: true; used: number; cap: number }
  | { ok: false; reason: "killswitch" | "daily_cap"; used: number; cap: number };

/**
 * Atomically consume `units` from a named daily budget bucket. Returns ok=false
 * when the kill-switch is on or the bucket's daily cap is exceeded. Fails OPEN
 * on store errors (never breaks the site over a DB blip) — the per-endpoint
 * rate limits and Cloudflare edge rules still apply, and the kill-switch is the
 * hard manual stop.
 */
export async function consumeLlmBudget(bucket: string, cap: number, units = 1): Promise<BudgetResult> {
  if (process.env.AI_KILLSWITCH === "1") return { ok: false, reason: "killswitch", used: 0, cap };
  try {
    await ensureTable();
    const day = new Date().toISOString().slice(0, 10);
    const key = `${bucket}:${day}`;
    const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `INSERT INTO "LlmBudget"(bucket_day, count) VALUES($1, $2)
       ON CONFLICT(bucket_day) DO UPDATE SET count = "LlmBudget".count + $2
       RETURNING count`,
      key,
      units
    );
    const used = Number(rows[0]?.count ?? 0);
    if (used > cap) return { ok: false, reason: "daily_cap", used, cap };
    return { ok: true, used, cap };
  } catch {
    return { ok: true, used: 0, cap };
  }
}
