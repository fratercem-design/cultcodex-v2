import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { grantClapTokens, renameClapHolder, toggleClapHolderHidden } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clap Tokens — Admin",
};

export default async function AdminClapsPage() {
  const now = new Date();
  const holders = await prisma.clapHolder.findMany({
    orderBy: [{ tokens: "desc" }, { createdAt: "asc" }],
    take: 300,
    select: {
      id: true,
      nickname: true,
      tokens: true,
      hidden: true,
      createdAt: true,
      claps: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          quantity: true,
          source: true,
          amountCents: true,
          couponCode: true,
          note: true,
          spotlightUntil: true,
          createdAt: true,
        },
      },
    },
  });

  return (
    <main id="main-content" className="p-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-2">Clap Tokens</h1>
      <p className="font-mono text-xs text-text-muted mb-8">
        {holders.length} holders · {holders.reduce((s, h) => s + h.tokens, 0)} tokens vested ·
        board: <a href="/claps" className="text-accent-cyan hover:underline">/claps</a>
      </p>

      {/* Grant / adjust */}
      <form
        action={grantClapTokens}
        className="mb-10 grid gap-3 rounded-xl border border-accent-gold/30 bg-surface p-5 sm:grid-cols-[1fr_100px_1fr_auto]"
      >
        <label className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Nickname</span>
          <input
            name="nickname"
            required
            maxLength={32}
            placeholder="new or existing"
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary focus:border-accent-gold focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">± Tokens</span>
          <input
            name="amount"
            type="number"
            required
            defaultValue={1}
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary focus:border-accent-gold focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">Note</span>
          <input
            name="note"
            placeholder='e.g. "cashapp $20 07-22"'
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary focus:border-accent-gold focus:outline-none"
          />
        </label>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-1.5 pb-2 font-mono text-[10px] text-text-muted">
            <input type="checkbox" name="spotlight" defaultChecked /> 24h clap
          </label>
          <button
            type="submit"
            className="rounded-lg border border-accent-gold/60 bg-accent-gold/15 px-5 py-2 font-display text-sm font-bold text-accent-gold-text hover:bg-accent-gold/25"
          >
            Grant
          </button>
        </div>
      </form>

      {/* Holder list */}
      <div className="space-y-3">
        {holders.map((h) => (
          <div key={h.id} className={`rounded-xl border border-border bg-surface p-4 ${h.hidden ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-lg font-bold text-text-primary">{h.nickname}</span>
              <span className="font-mono text-sm text-accent-cyan">👏 × {h.tokens}</span>
              {h.hidden && <span className="font-mono text-[10px] uppercase text-red-400/70">hidden</span>}
              {h.claps.some((c) => c.spotlightUntil && c.spotlightUntil > now) && (
                <span className="font-mono text-[10px] uppercase text-accent-gold-text">clapping now</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <form action={renameClapHolder} className="flex items-center gap-1.5">
                  <input type="hidden" name="id" value={h.id} />
                  <input
                    name="nickname"
                    defaultValue={h.nickname}
                    maxLength={32}
                    className="w-36 rounded border border-border bg-elevated px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-gold focus:outline-none"
                  />
                  <button type="submit" className="font-mono text-[10px] text-text-muted hover:text-accent-gold-text">
                    rename
                  </button>
                </form>
                <form action={toggleClapHolderHidden}>
                  <input type="hidden" name="id" value={h.id} />
                  <button type="submit" className="font-mono text-[10px] text-text-muted hover:text-red-400">
                    {h.hidden ? "unhide" : "hide"}
                  </button>
                </form>
              </div>
            </div>
            {h.claps.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {h.claps.map((c) => (
                  <li key={c.id} className="font-mono text-[10px] text-text-muted/70">
                    {c.createdAt.toISOString().slice(0, 10)} · {c.source} · {c.quantity > 0 ? "+" : ""}
                    {c.quantity}
                    {c.amountCents != null ? ` · $${(c.amountCents / 100).toFixed(0)}` : ""}
                    {c.couponCode ? ` · coupon:${c.couponCode}` : ""}
                    {c.note ? ` · ${c.note}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
