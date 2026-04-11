"use client";

import { useState } from "react";

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
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
        className="inline-flex items-center gap-2 rounded border border-accent-gold bg-accent-gold/10 px-4 py-2 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Unlock Transcripts \u2014 $10/mo"}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/10">
        <span className="text-xl">🔐</span>
      </div>
      <h3 className="font-display text-lg font-bold text-accent-gold">
        Unlock Full Transcripts
      </h3>
      <p className="mt-2 font-mono text-xs text-text-muted">
        Searchable, timestamped transcripts for every episode.
        <br />
        Copy quotes, search keywords, jump to timestamps.
      </p>
      <div className="mt-4">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/10 disabled:opacity-50"
        >
          {loading ? "Redirecting to checkout..." : "Subscribe \u2014 $10/month"}
        </button>
      </div>
      {error && (
        <p className="mt-2 font-mono text-[10px] text-red-400">{error}</p>
      )}
      <p className="mt-3 font-mono text-[10px] text-text-muted/60">
        Cancel anytime. Manage your subscription in settings.
      </p>
    </div>
  );
}
