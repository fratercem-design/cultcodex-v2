import Link from "next/link";
import Image from "next/image";
import { getLeaderboard } from "@/lib/rankings/leaderboard";
import { RankBadge } from "@/components/rank/rank-badge";

/**
 * Homepage module: the top-ranked members by codex score. Renders nothing
 * until at least a few public members exist, so the homepage never shows
 * an empty leaderboard teaser.
 */
export async function TopAscenders() {
  const entries = await getLeaderboard(5).catch(() => []);
  if (entries.length < 3) return null;

  const medal = ["①", "②", "③", "④", "⑤"];

  return (
    <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface px-6 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">{"/// top_ascenders"}</p>
          <h2 className="font-display text-lg font-bold text-white">Highest-ranked in the cult.</h2>
        </div>
        <Link
          href="/leaderboard"
          className="shrink-0 self-start inline-flex items-center gap-1.5 rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-3 py-2 font-mono text-[11px] font-bold text-accent-gold transition-all hover:bg-accent-gold/20 whitespace-nowrap"
        >
          Full leaderboard →
        </Link>
      </div>

      <ol className="space-y-2">
        {entries.map((e, i) => {
          const Row = (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 px-3 py-2 transition-colors hover:border-accent-gold/30">
              <span className="w-6 shrink-0 text-center font-mono text-sm text-accent-gold">{medal[i]}</span>
              {e.avatarUrl ? (
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
                  <Image src={e.avatarUrl} alt={e.displayName} fill className="object-cover" sizes="32px" />
                </div>
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-mono text-xs text-text-muted">
                  {e.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="min-w-0 flex-1 truncate font-mono text-xs font-bold text-text-primary">{e.displayName}</span>
              <RankBadge rank={e.rank} size="sm" showTitle={false} />
              <span className="shrink-0 font-mono text-[10px] text-text-muted/60 w-14 text-right">{e.score.toLocaleString()} pts</span>
            </div>
          );
          return (
            <li key={e.userId}>
              {e.hasPage ? <Link href={`/members/${e.codexSlug}`} className="block">{Row}</Link> : Row}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
