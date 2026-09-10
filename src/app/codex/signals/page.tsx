export const dynamic = "force-dynamic";

/**
 * /codex/signals — full list of the user's saved topics.
 *
 * Unlike the dashboard strip, this is the complete saved-signals view
 * ordered most-recent-first with save-date metadata. Clicking a row
 * routes to the canonical /topics/[slug] page.
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSavedSignals } from "@/lib/queries/codex";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Saved Signals — CULT CODEX",
  description: "The themes and concepts you're tracking.",
};

export default async function CodexSignalsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/codex/signals");

  const rows = await getSavedSignals(user.id);

  return (
    <div>
      <PageHero
        title="SAVED SIGNALS"
        subtitle={
          rows.length === 0
            ? "No signals pinned yet."
            : `${rows.length} signal${rows.length === 1 ? "" : "s"} in your codex`
        }
        backgroundImage="/hero-bg.jpg"
      label="saved_signals"
      />

      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-10 space-y-6"
      >
        <nav className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          <Link href="/codex" className="hover:text-accent-gold-text transition-colors">
            ← Back to your codex
          </Link>
        </nav>

        {rows.length === 0 ? (
          <>
            <EmptyState
              message="No signals pinned yet"
              suggestion="Browse /topics and tap the diamond to start tracking a theme."
            />
            <div className="text-center">
              <Link
                href="/topics"
                className="inline-flex items-center gap-2 rounded border border-accent-cyan/40 bg-accent-cyan/10 px-5 py-2 font-mono text-xs font-bold text-accent-cyan transition-all hover:bg-accent-cyan/20"
              >
                Browse signals <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <Link
                key={row.id}
                href={`/topics/${row.topic.slug}`}
                className="group rounded-lg border border-accent-cyan/10 bg-surface p-5 transition-colors hover:border-accent-cyan/40 hover:bg-accent-cyan-dim"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-accent-cyan group-hover:text-accent-cyan line-clamp-2">
                    {row.topic.title}
                  </h2>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </span>
                </div>
                {row.topic.description && (
                  <p className="mt-2 text-sm text-text-muted line-clamp-2">
                    {row.topic.description}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] text-text-muted">
                  <span>
                    <span className="text-accent-cyan font-bold">
                      {row.topic._count.episodes}
                    </span>{" "}
                    episodes
                  </span>
                  {row.topic._count.people > 0 && (
                    <span>
                      <span className="text-accent-cyan font-bold">
                        {row.topic._count.people}
                      </span>{" "}
                      people
                    </span>
                  )}
                  {row.topic._count.lore > 0 && (
                    <span>
                      <span className="text-accent-cyan font-bold">
                        {row.topic._count.lore}
                      </span>{" "}
                      lore
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
