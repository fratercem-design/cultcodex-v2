import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { RankBadge } from "@/components/rank/rank-badge";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getUserRank } from "@/lib/rankings/get-user-rank";
import { RANKS } from "@/lib/rankings/ranks";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Your Rank",
  description:
    "Rise through the ranks of the Cult: Initiate, Adept, Oracle, Archivist. Your rank grows as you explore the archive, contribute signals, and go deeper.",
  path: "/rank",
});

export default async function RankPage() {
  const user = await getCurrentUser();
  const isMember = user
    ? user.role === "admin" || (await isSubscribed(user.id).catch(() => false))
    : false;

  const data = user ? await getUserRank(user.id, isMember) : null;

  return (
    <>
      <PageHero
        title="THE RANKS"
        subtitle="Initiate · Adept · Oracle · Archivist"
        backgroundImage="/hero-bg.jpg"
        label="rank"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-14">

        {/* Current standing */}
        {data ? (
          <section className="rounded-2xl border border-border bg-surface p-7 space-y-5 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
              {"/// your_standing"}
            </p>
            <div className="flex flex-col items-center gap-3">
              <span
                className="text-5xl"
                style={{ color: data.progress.current.hex, textShadow: `0 0 24px ${data.progress.current.hex}66` }}
                aria-hidden="true"
              >
                {data.progress.current.glyph}
              </span>
              <RankBadge rank={data.progress.current} size="lg" />
              <p className="font-mono text-sm text-text-muted max-w-md leading-relaxed">
                {data.progress.current.blurb}
              </p>
              <p className="font-mono text-xs text-text-muted/60">
                Codex score: <span className="text-accent-gold font-bold">{data.score.toLocaleString()}</span>
              </p>
            </div>

            {/* Progress to next */}
            {data.progress.next ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-text-muted/60">
                  <span>{data.progress.current.title}</span>
                  <span>{data.progress.toNext.toLocaleString()} pts to {data.progress.next.title}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-void overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.progress.pct}%`,
                      background: `linear-gradient(90deg, ${data.progress.current.hex}, ${data.progress.next.hex})`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-accent-crimson pt-2">
                Maximum rank reached. You are the archive.
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-7 text-center space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
              {"/// claim_your_rank"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Sign in to begin your ascent.
            </h2>
            <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
              Every action in the archive — favoriting transmissions, saving signals, proposing
              investigations, going deep — raises your rank from Initiate to Archivist.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
            >
              Sign in →
            </Link>
          </section>
        )}

        {/* Score breakdown */}
        {data && (
          <section className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
              {"/// how_your_score_is_built"}
            </p>
            <div className="rounded-xl border border-border bg-surface divide-y divide-border">
              {data.lines.filter((l) => l.count > 0).length === 0 ? (
                <p className="p-5 font-mono text-xs text-text-muted italic">
                  No activity yet. Start exploring — every action counts.
                </p>
              ) : (
                data.lines
                  .filter((l) => l.count > 0)
                  .sort((a, b) => b.points - a.points)
                  .map((l) => (
                    <div key={l.label} className="flex items-center justify-between px-5 py-2.5">
                      <span className="font-mono text-xs text-text-muted">
                        {l.label} <span className="text-text-muted/40">× {l.count.toLocaleString()}</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-accent-gold">+{l.points.toLocaleString()}</span>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}

        <MysticalDivider />

        {/* The ladder */}
        <section className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60 text-center">
            {"/// the_path"}
          </p>
          <div className="space-y-3">
            {RANKS.map((r) => {
              const isCurrent = data?.progress.current.id === r.id;
              return (
                <div
                  key={r.id}
                  className={`flex items-start gap-4 rounded-xl border p-5 transition-all ${
                    isCurrent ? "border-accent-gold/50 bg-accent-gold/5" : "border-border bg-surface"
                  }`}
                >
                  <span
                    className="text-3xl shrink-0 w-10 text-center"
                    style={{ color: r.hex, textShadow: `0 0 16px ${r.hex}55` }}
                    aria-hidden="true"
                  >
                    {r.glyph}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-base font-bold text-text-primary">{r.title}</h3>
                      {isCurrent && (
                        <span className="font-mono text-[9px] uppercase tracking-widest text-accent-gold">
                          ◂ you are here
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed">{r.blurb}</p>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/40">
                      {r.minScore === 0 ? "Starting rank" : `${r.minScore.toLocaleString()} codex score`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ways to climb */}
        <section className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6 text-center space-y-4">
          <h2 className="font-display text-lg font-bold text-text-primary">Climb faster.</h2>
          <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
            Contribution is worth the most. Propose a signal for investigation, save what resonates,
            and go deep into the archive.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/signals" className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-violet/30 text-accent-violet hover:bg-accent-violet/5 transition-colors">
              Propose a signal →
            </Link>
            <Link href="/explore" className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/5 transition-colors">
              Explore the archive →
            </Link>
            {!isMember && (
              <Link href="/premium" className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-gold/30 text-accent-gold hover:bg-accent-gold/5 transition-colors">
                Become Initiate+ →
              </Link>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
