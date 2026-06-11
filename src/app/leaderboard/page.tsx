import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { RankBadge } from "@/components/rank/rank-badge";
import { getLeaderboard } from "@/lib/rankings/leaderboard";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "The Ascendant — Rank Leaderboard",
  description:
    "The highest-ranked members of the Cult, by codex score. Initiates, Adepts, Oracles, and Archivists who have gone deepest into the archive.",
  path: "/leaderboard",
});

const MEDAL = ["①", "②", "③"];

export default async function LeaderboardPage() {
  const entries = await getLeaderboard(50).catch(() => []);

  return (
    <>
      <PageHero
        title="THE ASCENDANT"
        subtitle="Who has gone deepest into the archive."
        backgroundImage="/hero-bg.jpg"
        label="leaderboard"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <section className="text-center max-w-xl mx-auto space-y-2">
          <p className="text-sm text-text-muted leading-relaxed">
            Ranked by <Link href="/rank" className="text-accent-gold hover:underline">codex score</Link> —
            earned through contribution, collection, and time in the cult. Only members who&apos;ve
            joined the Member Roll appear here.
          </p>
        </section>

        {entries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-4xl text-accent-gold/20">▲</p>
            <p className="font-mono text-sm text-text-muted">
              The leaderboard is empty. Be the first to ascend.
            </p>
            <Link href="/rank" className="inline-block font-mono text-xs text-accent-gold hover:underline">
              See your rank →
            </Link>
          </div>
        ) : (
          <ol className="space-y-2">
            {entries.map((e, i) => {
              const top3 = i < 3;
              const Row = (
                <div
                  className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    top3
                      ? "border-accent-gold/30 bg-gradient-to-r from-accent-gold/5 to-surface"
                      : "border-border bg-surface"
                  } ${e.hasPage ? "hover:border-accent-gold/40 hover:-translate-y-0.5" : ""}`}
                >
                  {/* Position */}
                  <div className="w-8 shrink-0 text-center">
                    {top3 ? (
                      <span className="text-2xl text-accent-gold" style={{ textShadow: "0 0 12px rgba(212,175,55,0.5)" }}>
                        {MEDAL[i]}
                      </span>
                    ) : (
                      <span className="font-mono text-sm text-text-muted/50">{i + 1}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  {e.avatarUrl ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border">
                      <Image src={e.avatarUrl} alt={e.displayName} fill className="object-cover" sizes="44px" />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-mono text-base text-text-muted">
                      {e.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Name + title */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-bold text-text-primary">{e.displayName}</p>
                    {e.memberTitle && (
                      <p className="truncate font-mono text-[11px] italic text-accent-gold/70">{e.memberTitle}</p>
                    )}
                  </div>

                  {/* Rank + score */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <RankBadge rank={e.rank} size="sm" />
                    <span className="font-mono text-[10px] text-text-muted/60">
                      {e.score.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              );

              return (
                <li key={e.userId}>
                  {e.hasPage ? (
                    <Link href={`/members/${e.codexSlug}`} className="block">{Row}</Link>
                  ) : (
                    Row
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <section className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6 text-center space-y-3">
          <h2 className="font-display text-lg font-bold text-text-primary">Climb the ranks.</h2>
          <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
            Your rank rises with every contribution. Check where you stand and what it takes to ascend.
          </p>
          <Link href="/rank" className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25">
            See your rank →
          </Link>
        </section>
      </main>
    </>
  );
}
