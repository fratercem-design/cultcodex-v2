"use client";

import { useState } from "react";
import Link from "next/link";

interface SubscriptionCTAProps {
  variant?: "inline" | "card";
}

export function SubscriptionCTA({ variant = "card" }: SubscriptionCTAProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "access" }),
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

  if (variant === "inline") {
    return (
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/10 disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Become Initiate+ — $10/month"}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-6 text-center space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
        {"/// observer_mode"}
      </p>
      <h3 className="font-display text-xl font-bold text-accent-gold">
        Observers see the surface.
      </h3>
      <p className="font-mono text-xs text-text-muted leading-relaxed max-w-sm mx-auto">
        Initiates see everything underneath — full transcripts, click-to-seek,
        Decode Mode, and the intelligence layer. $10/month.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-1">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/10 disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Become Initiate+ — $10/mo →"}
        </button>
        <Link
          href="/premium"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-mono text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-colors"
        >
          Compare tiers
        </Link>
      </div>
      {error && <p className="font-mono text-[10px] text-red-400">{error}</p>}
      <p className="font-mono text-[10px] text-text-muted/50">
        Cancel anytime · Instant access
      </p>
    </div>
  );
}
