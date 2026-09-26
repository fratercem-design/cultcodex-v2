"use client";

import { useRef, useState } from "react";
import { KIT_PLANS, formatPlanPrice, type KitPlanId } from "@/lib/kit/sample-kit";

export function KitPricing() {
  const [selected, setSelected] = useState<KitPlanId | null>(null);
  const [email, setEmail] = useState("");
  const [replayUrl, setReplayUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const plan = KIT_PLANS.find((p) => p.id === selected);

  function choose(id: KitPlanId) {
    setSelected(id);
    setError(null);
    // Wait for the form to render before scrolling to it.
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kit/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, email, replayUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Could not start checkout. Try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {KIT_PLANS.map((p) => (
          <div
            key={p.id}
            className={`flex flex-col rounded-lg border p-5 ${
              p.highlight ? "border-accent-gold bg-accent-gold-dim" : "border-border bg-surface/50"
            }`}
          >
            {p.highlight && (
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-accent-gold-text">
                Most streamers pick this
              </p>
            )}
            <p className="font-display text-lg font-bold text-text-primary">{p.name}</p>
            <p className="mt-1 font-serif text-3xl font-black text-text-primary">{formatPlanPrice(p)}</p>
            <p className="mt-1 text-sm text-text-muted">{p.tagline}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-text-primary">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-accent-cyan">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => choose(p.id)}
              aria-pressed={selected === p.id}
              className={`mt-5 rounded-md px-4 py-2.5 text-center font-display font-bold transition-opacity hover:opacity-90 ${
                p.highlight || selected === p.id ? "bg-accent-gold text-white" : "border border-border text-text-primary"
              }`}
            >
              {selected === p.id ? "Selected" : `Choose ${p.name}`}
            </button>
          </div>
        ))}
      </div>

      {plan && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-accent-gold/60 bg-surface/60 p-5"
        >
          <p className="font-display font-bold text-text-primary">
            {plan.name} · {formatPlanPrice(plan)}
          </p>
          <label className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">Your email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-void px-3 py-2.5 text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold focus:outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              {plan.interval === "month" ? "Link to your first replay" : "Link to your replay"}
            </span>
            <input
              type="url"
              required
              inputMode="url"
              value={replayUrl}
              onChange={(e) => setReplayUrl(e.target.value)}
              placeholder="https://youtube.com/live/..."
              className="w-full rounded-md border border-border bg-void px-3 py-2.5 text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold focus:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-accent-crimson-text">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent-gold px-5 py-3 font-display font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Opening checkout…" : "Continue to secure checkout"}
          </button>
          <p className="text-center font-mono text-[11px] text-text-muted">
            Payment by Stripe.{plan.interval === "month" ? " Cancel anytime." : ""}
          </p>
        </form>
      )}
    </div>
  );
}
