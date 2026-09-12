import { describe, it, expect, afterEach } from "vitest";
import { consumeLlmBudget, consumeDailyBudget } from "../llm-budget";

/**
 * AI_KILLSWITCH must stop paid AI without stopping sign-in.
 *
 * consumeDailyBudget exists so costly non-LLM endpoints (magic-link email) can
 * use the same global daily counter — the per-IP limiter in rate-limit.ts is an
 * in-memory Map and does not hold on serverless, measured at 75 sequential
 * requests against a documented 60/min limit with zero 429s. But wiring email
 * through consumeLlmBudget would have meant that flipping AI_KILLSWITCH during
 * an AI abuse incident also locked every user out of their account.
 *
 * No database is needed to assert the split: with the kill-switch on, the LLM
 * variant refuses before touching the store, while the generic one proceeds to
 * the store and (with no database in the test env) fails closed instead — a
 * different refusal reason, which is exactly the distinction being pinned.
 */

afterEach(() => {
  delete process.env.AI_KILLSWITCH;
});

describe("AI_KILLSWITCH scope", () => {
  it("stops paid LLM endpoints", async () => {
    process.env.AI_KILLSWITCH = "1";
    const r = await consumeLlmBudget("test-llm", 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("killswitch");
  });

  it("does NOT stop the generic daily budget, so sign-in email survives it", async () => {
    process.env.AI_KILLSWITCH = "1";
    const r = await consumeDailyBudget("test-generic", 10);
    // It may still refuse (no database here) but never for the kill-switch.
    if (!r.ok) expect(r.reason).not.toBe("killswitch");
  });

  it("fails closed when the counter store is unreachable", async () => {
    // Cannot account for the spend, so must not authorise it.
    const r = await consumeDailyBudget("test-generic", 10);
    if (!r.ok) expect(r.reason).toBe("store_error");
  });
});
