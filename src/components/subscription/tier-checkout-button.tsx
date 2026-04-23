"use client";

import { useState } from "react";
import type { TierSlug } from "@/lib/subscription-tiers";

interface TierCheckoutButtonProps {
  tier: TierSlug;
  label: string;
  accent?: "gold" | "violet";
  /** Set true if the user isn't signed in — button routes to sign-in first. */
  requireSignIn?: boolean;
}

/**
 * TierCheckoutButton — Kicks off a Stripe Checkout session for a specific
 * tier by POSTing the tier slug to /api/stripe/checkout and following
 * the returned URL. If the user isn't signed in, hops to /auth/signin
 * with a return URL so the flow resumes on /premium afterwards.
 */
export function TierCheckoutButton({
  tier,
  label,
  accent = "gold",
  requireSignIn = false,
}: TierCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({ tier }),
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

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`w-full rounded-lg border px-6 py-3 font-mono text-sm font-bold transition-all hover:shadow-lg disabled:opacity-50 ${accentClasses}`}
      >
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && (
        <p className="font-mono text-[10px] text-red-400 text-center">
          {error}
        </p>
      )}
    </div>
  );
}
