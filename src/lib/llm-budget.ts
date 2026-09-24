import { prisma } from "@/lib/db";

// Global daily circuit-breaker for paid-LLM endpoints. A per-IP rate limit
// can't stop an attacker who rotates IPs; a GLOBAL daily cap can — it bounds
// total spend no matter who calls or how. Backed by the `LlmBudget` Postgres
// table (created by migration, see prisma/schema.prisma). Plus an instant
// kill-switch (AI_KILLSWITCH=1) to shut all paid-LLM endpoints off during an
// active attack without a deploy-time code change.

export type BudgetResult =
  | { ok: true; used: number; cap: number }
  | { ok: false; reason: "killswitch" | "daily_cap" | "store_error"; used: number; cap: number };

// Fire a one-time email the moment a bucket crosses its cap (likely an attack
// on low traffic). Fire-and-forget via Resend REST so it never blocks or breaks
// the request path. Sends to ALERT_EMAIL (default the owner's inbox).
function alertCapHit(bucket: string, cap: number): void {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const to = process.env.ALERT_EMAIL || "psychetarotchannel@gmail.com";
  const text =
    `The "${bucket}" daily AI budget just hit its cap of ${cap}. Further ${bucket} ` +
    `requests are blocked until 00:00 UTC — so cost is already contained.\n\n` +
    `On low traffic this usually means abuse / an attack. Options:\n` +
    `- Do nothing: the cap already bounds the spend.\n` +
    `- Kill ALL paid AI instantly: "fly secrets set AI_KILLSWITCH=1" (Fly restarts the Machines with the new value).\n` +
    `- If it's legit demand, "fly secrets set ${bucket.toUpperCase()}_DAILY_CAP=<n>".`;
  fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    // cultcodex.me isn't verified on Resend, so default to the sandbox sender
    // (delivers to the account owner). Override with ALERT_FROM once the domain
    // is verified.
    body: JSON.stringify({
      from: process.env.ALERT_FROM || "CultCodex Alerts <onboarding@resend.dev>",
      to,
      subject: `⚠️ CultCodex: "${bucket}" daily AI cap hit (possible attack)`,
      text,
    }),
  }).catch(() => {});
}

/**
 * Atomically consume `units` from a named daily budget bucket. Returns ok=false
 * when the kill-switch is on, the bucket's daily cap is exceeded, or the counter
 * store is unavailable. Fails CLOSED on store errors: the entire point of the cap
 * is to bound spend during an abuse spike, so if we cannot account for the spend
 * we must not authorize it. Callers should surface this as a transient 503.
 * (Xata is always-on, so store-error false-positives are rare; the kill-switch
 * remains the hard manual stop.)
 */
export async function consumeLlmBudget(bucket: string, cap: number, units = 1): Promise<BudgetResult> {
  if (process.env.AI_KILLSWITCH === "1") return { ok: false, reason: "killswitch", used: 0, cap };
  return consumeDailyBudget(bucket, cap, units);
}

/**
 * The same global daily circuit-breaker, without the AI kill-switch.
 *
 * Costly endpoints that are not LLM calls need the same protection — the
 * per-IP limiter in rate-limit.ts is an in-memory Map, so on serverless it is
 * per-instance and does not actually cap anything (measured: 75 sequential
 * requests against a documented 60/min limit produced zero 429s). A global
 * daily counter is the control that genuinely bounds spend, because it holds
 * however many instances are running and whoever is calling.
 *
 * Kept separate from consumeLlmBudget so AI_KILLSWITCH cannot take out sign-in
 * email: shutting off paid AI during an attack should not lock people out of
 * their accounts.
 */
export async function consumeDailyBudget(bucket: string, cap: number, units = 1): Promise<BudgetResult> {
  try {
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
    // Alert exactly once, on the request that crosses the cap.
    if (used > cap && used - units <= cap) alertCapHit(bucket, cap);
    if (used > cap) return { ok: false, reason: "daily_cap", used, cap };
    return { ok: true, used, cap };
  } catch {
    // Fail closed — cannot account for spend, so do not authorize it.
    return { ok: false, reason: "store_error", used: 0, cap };
  }
}

/**
 * Monthly variant of consumeLlmBudget — same LlmBudget table, keyed on
 * `bucket:YYYY-MM` instead of `bucket:YYYY-MM-DD`. Used for per-user tier
 * meters (e.g. Initiate+ ~100 Oracle questions/month), where the window is
 * the billing month, not the abuse-control day. No cap-hit alert email:
 * a user hitting their tier meter is an upgrade prompt, not an attack.
 *
 * Fails OPEN on store errors, unlike the daily breaker: the daily global cap
 * (checked separately) already bounds total spend, so denying a PAYING user
 * their metered access over a transient counter error is the worse failure.
 */
export async function consumeMonthlyMeter(
  bucket: string,
  cap: number,
  units = 1
): Promise<{ ok: boolean; used: number; cap: number; persisted: boolean }> {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const key = `${bucket}:${month}`;
    const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `INSERT INTO "LlmBudget"(bucket_day, count) VALUES($1, $2)
       ON CONFLICT(bucket_day) DO UPDATE SET count = "LlmBudget".count + $2
       RETURNING count`,
      key,
      units
    );
    const used = Number(rows[0]?.count ?? 0);
    return { ok: used <= cap, used, cap, persisted: true };
  } catch {
    return { ok: true, used: 0, cap, persisted: false };
  }
}

/** Return a monthly unit when the downstream provider failed to produce an answer. */
export async function refundMonthlyMeter(bucket: string, units = 1): Promise<void> {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const key = `${bucket}:${month}`;
    await prisma.$executeRawUnsafe(
      `UPDATE "LlmBudget"
       SET count = GREATEST(count - $2, 0)
       WHERE bucket_day = $1`,
      key,
      units
    );
  } catch {
    // Best effort: provider errors must still return promptly even if accounting is unavailable.
  }
}
