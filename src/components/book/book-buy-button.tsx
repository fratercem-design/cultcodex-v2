"use client";

import { useState } from "react";

export function BookBuyButton({
  sku,
  signedIn,
  price,
}: {
  sku: string;
  signedIn: boolean;
  price: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!signedIn) {
      window.location.href = "/auth/signin?callbackUrl=/psychenomicon/book";
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/book-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.owned) window.location.reload();
      else {
        setError(data.error || "Checkout failed");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="w-full rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-sm font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25 hover:shadow-lg disabled:opacity-50"
      >
        {loading
          ? "Redirecting to checkout…"
          : signedIn
          ? `Buy the PDF — $${price}`
          : `Sign in to buy — $${price}`}
      </button>
      {error && <p className="font-mono text-[12px] text-red-400 text-center">{error}</p>}
    </div>
  );
}
