export const dynamic = "force-dynamic";

/**
 * /codex/quotes — full list of the user's saved quotes.
 *
 * Ordered most-recent-first. Each quote links back to the episode
 * anchor where it was saved.
 */
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSavedQuotes } from "@/lib/queries/codex";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  alternates: { canonical: "/codex/quotes" },
  title: "Saved Quotes — CULT CODEX",
  description: "The lines that stayed with you.",
};

export default async function CodexQuotesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/codex/quotes");

  const rows = await getSavedQuotes(user.id);

  return (
    <div>
      <PageHero
        title="SAVED QUOTES"
        subtitle={
          rows.length === 0
            ? "No moments saved yet."
            : `${rows.length} moment${rows.length === 1 ? "" : "s"} in your codex`
        }
        backgroundImage="/hero-bg.jpg"
      label="saved_quotes"
      />

      <main
        id="main-content"
        className="mx-auto max-w-4xl px-4 py-10 space-y-6"
      >
        <nav className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          <Link href="/codex" className="hover:text-accent-gold-text transition-colors">
            ← Back to your codex
          </Link>
        </nav>

        {rows.length === 0 ? (
          <>
            <EmptyState
              message="No moments saved yet"
              suggestion="Browse /quotes and tap the star to start collecting lines that land."
            />
            <div className="text-center">
              <Link
                href="/quotes"
                className="inline-flex items-center gap-2 rounded border border-accent-violet/40 bg-accent-violet/10 px-5 py-2 font-mono text-xs font-bold text-accent-violet-text transition-all hover:bg-accent-violet/20"
              >
                Browse quotes <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => (
              <li
                key={row.id}
                className="rounded-lg border border-accent-violet/10 bg-surface p-6 hover:border-accent-violet/40 transition-colors"
              >
                <blockquote className="font-display text-base leading-relaxed text-text-primary">
                  &ldquo;{row.quote.text}&rdquo;
                </blockquote>
                {row.quote.context && (
                  <p className="mt-2 text-xs text-text-muted italic">
                    {row.quote.context}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {row.quote.speaker?.avatarUrl && (
                      <Image
                        src={row.quote.speaker.avatarUrl}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    )}
                    {row.quote.speaker ? (
                      <Link
                        href={`/people/${row.quote.speaker.slug}`}
                        className="font-mono text-[11px] uppercase tracking-widest text-accent-violet-text hover:underline"
                      >
                        {row.quote.speaker.displayName}
                      </Link>
                    ) : (
                      <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
                        Unknown speaker
                      </span>
                    )}
                    {row.quote.episode && (
                      <>
                        <span className="text-text-muted text-xs" aria-hidden>
                          ·
                        </span>
                        <Link
                          href={`/episodes/${row.quote.episode.slug}#quote-${row.quote.id}`}
                          className="font-mono text-[10px] text-text-muted hover:text-accent-gold-text transition-colors"
                        >
                          {row.quote.episode.episodeNumber != null && (
                            <>
                              EP.
                              {String(row.quote.episode.episodeNumber).padStart(3, "0")}{" "}
                            </>
                          )}
                          {row.quote.episode.title}
                        </Link>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted">
                    saved {formatDate(row.createdAt)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
