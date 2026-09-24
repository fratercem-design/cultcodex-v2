"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREDIT_BUNDLES, formatBundlePrice, type CreditBundleSlug } from "@/lib/credit-bundles";

/**
 * The paid entry to the card economy: three Signal Credit bundles, one click
 * each to Stripe Checkout. Renders on the Pack Store under the wallet. The
 * server decides the credit amount from the bundle slug — nothing about the
 * grant is trusted from this component.
 */
export function CreditBundlesStrip() {
  const router = useRouter();
  const [busy, setBusy] = useState<CreditBundleSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(slug: CreditBundleSlug) {
    if (busy) return;
    setBusy(slug);
    setError(null);
    try {
      const res = await fetch("/api/stripe/credits-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundle: slug }),
      });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/cards/packs")}`);
        return;
      }
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string; requestId?: string };
      if (!res.ok || !json.url) {
        setError(
          json.requestId
            ? `${json.error ?? "Checkout failed"} (ref ${json.requestId.slice(0, 8)})`
            : json.error ?? "Checkout failed"
        );
        setBusy(null);
        return;
      }
      // External (Stripe) destination — a full navigation, not a router push.
      window.location.assign(json.url);
    } catch {
      setError("Checkout failed");
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="credit-bundles-heading" style={{ marginBottom: 28 }}>
      <h2
        id="credit-bundles-heading"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--term-fg-dim)",
          letterSpacing: "0.1em",
          margin: "0 0 10px",
          fontWeight: 400,
        }}
      >
        {"// NEED MORE SIGNAL?"}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        {CREDIT_BUNDLES.map((b) => (
          <button
            key={b.slug}
            type="button"
            onClick={() => buy(b.slug)}
            disabled={busy !== null}
            aria-busy={busy === b.slug}
            style={{
              textAlign: "left",
              border: "1px solid var(--term-line)",
              borderRadius: 6,
              padding: "12px 16px",
              backgroundColor: "var(--term-bg-1)",
              cursor: busy ? "wait" : "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              color: "inherit",
              font: "inherit",
            }}
          >
            <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--term-fg)", letterSpacing: "0.08em" }}>
                {b.name.toUpperCase()}
              </span>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--term-fg-dim)" }}>
                {formatBundlePrice(b.priceCents)}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-crt, var(--font-mono)), monospace",
                fontSize: 22,
                color: "var(--neon-4)",
                textShadow: "var(--glow-amber)",
                lineHeight: 1,
              }}
            >
              {b.credits.toLocaleString("en-US")}
              <span style={{ fontSize: 10, color: "var(--term-fg-faint)", marginLeft: 6, textShadow: "none" }}>
                CREDITS
              </span>
            </span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--term-fg-faint)" }}>
              {busy === b.slug ? "// Opening checkout…" : b.blurb}
            </span>
          </button>
        ))}
      </div>
      <p
        role={error ? "alert" : undefined}
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: error ? "var(--neon-5)" : "var(--term-fg-faint)",
          marginTop: 8,
        }}
      >
        {error ?? "// Credits are for opening packs. No cash value, no refunds, no transfers. Card handled by Stripe."}
      </p>
    </section>
  );
}
