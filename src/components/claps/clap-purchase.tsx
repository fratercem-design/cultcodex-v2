"use client";

import { useState } from "react";

/**
 * Purchase widget for clap tokens: nickname + quantity + optional coupon,
 * then Stripe checkout — or a CashApp deep link (manual credit by admin).
 */
export function ClapPurchase({ cashtag }: { cashtag: string }) {
  const [nickname, setNickname] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const couponApplied = coupon.trim().toLowerCase() === "panel";
  const unit = couponApplied ? 10 : 20;
  const total = unit * quantity;

  async function buyWithStripe() {
    setError(null);
    if (nickname.trim().length < 2) {
      setError("Pick a nickname first — that's where your tokens live.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/claps/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim(), quantity, coupon: coupon.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-accent-gold/30 bg-surface/60 p-5">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/80">
          {"/// buy_a_clap"}
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          <span className="text-accent-gold-text font-bold">$20</span> buys a{" "}
          <span className="text-text-primary">24-hour clap spotlight</span> and a token{" "}
          <span className="text-text-primary">vested forever</span> to your nickname on the board.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Nickname</span>
          <input
            type="text"
            value={nickname}
            maxLength={32}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="How the board remembers you"
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Tokens</span>
            <input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Math.max(parseInt(e.target.value, 10) || 1, 1), 20))}
              className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary focus:border-accent-gold focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Coupon</span>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="optional"
              className={`w-full rounded border px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none ${
                couponApplied
                  ? "border-accent-cyan/60 bg-accent-cyan/5 text-accent-cyan"
                  : "border-border bg-elevated focus:border-accent-gold"
              }`}
            />
          </label>
        </div>
      </div>

      {couponApplied && (
        <p className="font-mono text-[11px] text-accent-cyan">✓ Coupon applied — $10 per token</p>
      )}
      {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={buyWithStripe}
          disabled={busy}
          className="rounded-lg border border-accent-gold/60 bg-accent-gold/15 px-6 py-2.5 font-display text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Opening checkout…" : `👏 Clap with card — $${total}`}
        </button>
        {cashtag && (
          <a
            href={`https://cash.app/${encodeURIComponent(cashtag)}/${total}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-6 py-2.5 font-display text-sm font-bold text-accent-cyan transition-all hover:bg-accent-cyan/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            💵 CashApp {cashtag} — ${total}
          </a>
        )}
      </div>
      {cashtag && (
        <p className="font-mono text-[10px] text-text-muted/70">
          Paying by CashApp? Put your <span className="text-text-primary">nickname in the payment note</span> —
          tokens are credited by the Cult within a day.
        </p>
      )}
    </section>
  );
}
