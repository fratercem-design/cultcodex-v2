import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { ClapPurchase } from "@/components/claps/clap-purchase";

// Live board — always render fresh so new purchases and spotlights appear
// immediately (also keeps the build from querying the DB for this page).
export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Clap Tokens — #cultofpsyche",
  description:
    "Buy a clap for the Cult of Psyche. $20 gets a 24-hour clap spotlight and a token vested forever to your nickname on the board.",
  path: "/claps",
});

const MEDAL = ["①", "②", "③"];

export default async function ClapsPage() {
  const now = new Date();
  const [holders, spotlights] = await Promise.all([
    prisma.clapHolder
      .findMany({
        where: { hidden: false, tokens: { gt: 0 } },
        orderBy: [{ tokens: "desc" }, { createdAt: "asc" }],
        take: 100,
        select: { id: true, nickname: true, tokens: true },
      })
      .catch(() => []),
    prisma.clapToken
      .findMany({
        where: { spotlightUntil: { gt: now }, holder: { hidden: false } },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          quantity: true,
          spotlightUntil: true,
          holder: { select: { nickname: true } },
        },
      })
      .catch(() => []),
  ]);

  const cashtag = process.env.NEXT_PUBLIC_CASHAPP_CASHTAG ?? "";

  return (
    <>
      <PageHero
        title="CLAP TOKENS"
        subtitle="#cultofpsyche — put your hands together, permanently."
        backgroundImage="/hero-bg.jpg"
        label="claps"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-10">
        {/* Active 24-hour claps */}
        {spotlights.length > 0 && (
          <section className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/70">
              {"/// clapping_right_now"}
            </p>
            <div className="flex flex-wrap gap-2">
              {spotlights.map((s) => (
                <span
                  key={s.id}
                  className="animate-pulse rounded-full border border-accent-gold/50 bg-accent-gold/10 px-4 py-1.5 font-display text-sm font-bold text-accent-gold-text shadow-[0_0_18px_-6px_rgba(200,169,107,0.8)]"
                  title={`Clap active until ${s.spotlightUntil?.toISOString()}`}
                >
                  👏 {s.holder.nickname}
                  {s.quantity > 1 ? ` ×${s.quantity}` : ""}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Purchase */}
        <ClapPurchase cashtag={cashtag} />

        {/* The board */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/60">
            {"/// the_clap_board · tokens vest forever"}
          </p>
          {holders.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface/50 px-4 py-8 text-center font-mono text-xs text-text-muted">
              No claps yet. Be the first name on the board.
            </p>
          ) : (
            <ol className="divide-y divide-border rounded-lg border border-border bg-surface/50">
              {holders.map((h, i) => (
                <li key={h.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="w-8 shrink-0 text-center font-mono text-sm text-accent-gold-text/70">
                    {MEDAL[i] ?? i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-display text-base font-bold text-text-primary">
                    {h.nickname}
                  </span>
                  <span className="shrink-0 font-mono text-sm text-accent-cyan">
                    👏 × {h.tokens}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
