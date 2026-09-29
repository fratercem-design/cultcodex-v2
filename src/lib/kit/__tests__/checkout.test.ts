import { describe, it, expect } from "vitest";
import { parseKitOrder, buildKitSessionParams } from "../checkout";

const valid = { plan: "single", email: " Reader@Example.com ", replayUrl: " https://youtube.com/live/abc123 " };

describe("parseKitOrder", () => {
  it("accepts a valid order and normalizes email and link", () => {
    const r = parseKitOrder(valid);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.order.plan.id).toBe("single");
    expect(r.order.email).toBe("reader@example.com");
    expect(r.order.replayUrl).toBe("https://youtube.com/live/abc123");
  });

  it.each([
    [{ ...valid, plan: "lifetime" }, "Pick a plan."],
    [{ ...valid, email: "not-an-email" }, "Enter a valid email so we can send your kit."],
    [{ ...valid, replayUrl: "javascript:alert(1)" }, "Paste the full link to your replay (starting with https://)."],
    [{ ...valid, replayUrl: `https://x.com/${"a".repeat(500)}` }, "Paste the full link to your replay (starting with https://)."],
  ])("rejects %j", (body, error) => {
    expect(parseKitOrder(body)).toEqual({ ok: false, error });
  });

  it("rejects a missing body", () => {
    expect(parseKitOrder(null).ok).toBe(false);
  });
});

describe("buildKitSessionParams", () => {
  const order = (plan: string) => {
    const r = parseKitOrder({ ...valid, plan });
    if (!r.ok) throw new Error(r.error);
    return r.order;
  };

  it("builds a one-time payment for the single kit", () => {
    const p = buildKitSessionParams(order("single"), "https://cultcodex.me");
    expect(p.mode).toBe("payment");
    expect(p.line_items?.[0].price_data?.unit_amount).toBe(2900);
    expect(p.line_items?.[0].price_data?.recurring).toBeUndefined();
    expect(p.subscription_data).toBeUndefined();
    expect(p.metadata).toEqual({ kind: "kit", kitPlan: "single", replayUrl: "https://youtube.com/live/abc123" });
    expect(p.success_url).toBe("https://cultcodex.me/kit/thanks?session_id={CHECKOUT_SESSION_ID}");
  });

  it.each([
    ["monthly", 7900],
    ["premium", 24900],
  ])("builds a monthly subscription for %s", (plan, cents) => {
    const p = buildKitSessionParams(order(plan), "https://cultcodex.me");
    expect(p.mode).toBe("subscription");
    expect(p.line_items?.[0].price_data?.unit_amount).toBe(cents);
    expect(p.line_items?.[0].price_data?.recurring).toEqual({ interval: "month" });
    expect(p.subscription_data?.metadata).toEqual(p.metadata);
  });

  it("never attaches an existing customer (keeps kit subs off member tiers)", () => {
    for (const plan of ["single", "monthly", "premium"]) {
      const p = buildKitSessionParams(order(plan), "https://cultcodex.me");
      expect(p.customer).toBeUndefined();
      expect(p.customer_email).toBe("reader@example.com");
      expect(p.allow_promotion_codes).toBe(true);
    }
  });
});
