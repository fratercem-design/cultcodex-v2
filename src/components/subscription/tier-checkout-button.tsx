"use client";

import { useState } from "react";
import type { TierSlug, BillingInterval } from "@/lib/subscription-tiers";

interface TierCheckoutButtonProps {
  tier: TierSlug;
  /** Identity label used to build the CTA copy (e.g. "Initiate", "Oracle"). */
  role: string;
  priceMonthly: number;
  priceAnnual: number;
  accent?: "gold" | "violet";
  /** Set true if the user isn't signed in — button routes to sign-in first. */
  requireSignIn?: boolean;
  /** Override the leading verb in the CTA (defaults to "Become"). */
  verb?: string;
}

/**
 * TierCheckoutButton — billing-interval toggle + Stripe Checkout launcher.
 * Posts the chosen tier and interval to /api/stripe/checkout and follows the
 * returned hosted-checkout URL. If the user isn't signed in, hops to
 * /auth/signin first so the flow resumes on /premium afterwards.
 */
export function TierCheckoutButton({
  tier,
  role,
  priceMonthly,
  priceAnnual,
  accent = "gold",
  requireSignIn = false,
  verb = "Become",
}: TierCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");

  // Two months free framing: annual saved vs. 12× monthly.
  const annualIfMonthly = priceMonthly * 12;
  const savings = annualIfMonthly - priceAnnual;
  const displayPrice = interval === "year" ? `$${priceAnnual}/yr` : `$${priceMonthly}/mo`;

  async function handleClick() {
    if (requireSignIn) {
      const ret = encodeURIComponent("/premium");
      window.location.href = `/auth/signin?callbackUrl=${ret}`;
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, interval }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const accentClasses =
    accent === "violet"
      ? "border-accent-violet bg-accent-violet/15 text-accent-violet hover:bg-accent-violet/25 hover:shadow-accent-violet/20"
      : "border-accent-gold bg-accent-gold/15 text-accent-gold hover:bg-accent-gold/25 hover:shadow-accent-gold/20";

  const activeToggle =
    accent === "violet"
      ? "bg-accent-violet/20 text-accent-violet border-accent-violet/50"
      : "bg-accent-gold/20 text-accent-gold border-accent-gold/50";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1 rounded-lg border border-border bg-void/40 p-1">
        <button
          type="button"
          onClick={() => setInterval("month")}
          className={`flex-1 rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            interval === "month" ? activeToggle : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setInterval("year")}
          className={`flex-1 rounded-md border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            interval === "year" ? activeToggle : "border-transparent text-text-muted hover:text-text-primary"
          }`}
        >
          Annual{savings > 0 ? ` · save $${savings}` : ""}
        </button>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full rounded-lg border px-6 py-3 font-mono text-sm font-bold transition-all hover:shadow-lg disabled:opacity-50 ${accentClasses}`}
      >
        {loading
          ? "Redirecting to checkout…"
          : `${requireSignIn ? "Sign in to become" : verb} ${role} — ${displayPrice}`}
      </button>
      {error && (
        <p className="font-mono text-[10px] text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
