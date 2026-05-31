/**
 * /codex — The personal codex dashboard.
 *
 * The signed-in user's private map of what they're tracking:
 *   - Saved Signals        (topics pinned from /topics)
 *   - Saved Transmissions  (episodes favorited from /episodes)
 *   - Saved Quotes         (lines saved from /quotes and episode pages)
 *
 * Three collapsible blocks, each with a count, a strip of the three
 * most-recent saves, and a "View all →" link to the index page.
 * Empty states route to the relevant public surface so a brand-new
 * user always has a next action.
 */
import Link from "next/link";
import Image from "next/image";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import {
  getCodexCounts,
  getSavedSignals,
  getSavedTransmissions,
  getSavedQuotes,
} from "@/lib/queries/codex";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { formatDate } from "@/lib/format/date";
import { SavedSearchesBlock } from "@/components/codex/saved-searches-block";

export const metadata: Metadata = {
  title: "My Codex — CULT CODEX",
  description:
    "Your personal map of the Cult of Psyche — saved signals, transmissions, and moments.",
};

export default async function CodexPage() {
  const user = await getCurrentUser();
  if (!user) return <LockedCodexPreview />;

  const [counts, signals, transmissions, quotes] = await Promise.all([
    getCodexCounts(user.id),
    getSavedSignals(user.id, 3),
    getSavedTransmissions(user.id, 3),
    getSavedQuotes(user.id, 3),
  ]);

  const totalSaved = counts.signals + counts.transmissions + counts.quotes;

  return (
    <div>
      <PageHero
        title="YOUR CODEX"
        subtitle={
          totalSaved > 0
            ? `${totalSaved} signal${totalSaved === 1 ? "" : "s"} in your personal archive`
            : "Your personal archive — still a blank page."
        }
        backgroundImage="/hero-bg.jpg"
      label="my_codex"
      />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-10 space-y-12"
      >
        {/* Mythic framing */}
        <section className="text-center max-w-2xl mx-auto space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-gold">
            {"/// private · "}{user.displayName}
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            The archive is shared. The codex is yours. Save the signals
            you want to follow, the transmissions you want to return to,
            and the lines that won&rsquo;t let you go.
          </p>
        </section>

        {/* Three stacked sections */}
        <CodexSection
          accent="cyan"
          eyebrow="/// saved_signals"
          title="Signals"
          count={counts.signals}
          indexHref="/codex/signals"
          emptyBody="No signals pinned yet."
          emptyCta={{ label: "Browse signals", href: "/topics" }}
        >
          {signals.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {signals.map((row) => (
                <Link
                  key={row.id}
                  href={`/topics/${row.topic.slug}`}
                  className="group rounded-lg border border-accent-cyan/10 bg-surface p-4 transition-colors hover:border-accent-cyan/40 hover:bg-accent-cyan-dim"
                >
                  <h3 className="font-sans text-sm font-medium text-accent-cyan line-clamp-2">
                    {row.topic.title}
                  </h3>
                  {row.topic.description && (
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">
                      {row.topic.description}
                    </p>
                  )}
                  <p className="mt-3 font-mono text-[10px] text-text-muted">
                    {row.topic._count.episodes} transmission
                    {row.topic._count.episodes === 1 ? "" : "s"} · saved{" "}
                    {formatDate(row.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CodexSection>

        <MysticalDivider />

        <CodexSection
          accent="gold"
          eyebrow="/// saved_transmissions"
          title="Transmissions"
          count={counts.transmissions}
          indexHref="/codex/transmissions"
          emptyBody="No transmissions saved yet."
          emptyCta={{ label: "Browse episodes", href: "/episodes" }}
        >
          {transmissions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {transmissions.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/episodes/${fav.episode.slug}`}
                  className="group rounded-lg border border-accent-gold/10 bg-surface p-3 transition-colors hover:border-accent-gold/40 hover:bg-accent-gold-dim"
                >
                  {fav.episode.thumbnailUrl && (
                    <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md">
                      <Image
                        src={fixThumbnailUrl(fav.episode.thumbnailUrl)!}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    {fav.episode.episodeNumber != null && (
                      <span className="font-mono text-[10px] text-accent-gold font-bold">
                        EP.{String(fav.episode.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    {fav.episode.airDate && (
                      <span className="font-mono text-[10px] text-text-muted">
                        {formatDate(fav.episode.airDate)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
                    {fav.episode.title}
                  </h3>
                </Link>
              ))}
            </div>
          )}
        </CodexSection>

        <MysticalDivider />

        <CodexSection
          accent="violet"
          eyebrow="/// saved_moments"
          title="Quotes"
          count={counts.quotes}
          indexHref="/codex/quotes"
          emptyBody="No moments saved yet."
          emptyCta={{ label: "Browse quotes", href: "/quotes" }}
        >
          {quotes.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {quotes.map((row) => (
                <Link
                  key={row.id}
                  href={
                    row.quote.episode
                      ? `/episodes/${row.quote.episode.slug}#quote-${row.quote.id}`
                      : "#"
                  }
                  className="group rounded-lg border border-accent-violet/10 bg-surface p-4 transition-colors hover:border-accent-violet/40 hover:bg-accent-violet-dim"
                >
                  <p className="font-display text-sm text-text-primary leading-relaxed line-clamp-4">
                    &ldquo;{row.quote.text}&rdquo;
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {row.quote.speaker?.avatarUrl && (
                      <Image
                        src={row.quote.speaker.avatarUrl}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    )}
                    <p className="font-mono text-[10px] text-accent-violet">
                      {row.quote.speaker?.displayName ?? "Unknown speaker"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CodexSection>

        <MysticalDivider />

        <SavedSearchesBlock userId={user.id} />
      </main>
    </div>
  );
}

function LockedCodexPreview() {
  return (
    <div>
      <PageHero
        title="YOUR CODEX"
        subtitle="Your personal archive — still a blank page."
        backgroundImage="/hero-bg.jpg"
        label="my_codex"
      />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        <section className="text-center max-w-2xl mx-auto space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-gold">
            /// private · observer
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            The archive is shared. The codex is yours. Save the signals
            you want to follow, the transmissions you want to return to,
            and the lines that won&rsquo;t let you go.
          </p>
        </section>

        {/* Lock overlay wrapper */}
        <div className="relative">
          {/* Ghost sections — visual preview of what the codex contains */}
          <div className="space-y-12 pointer-events-none select-none" aria-hidden="true">
            {/* Signals preview */}
            <section className="space-y-5 opacity-40">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">/// saved_signals</p>
                  <h2 className="font-display text-xl font-bold text-accent-cyan">Signals <span className="font-mono text-sm font-normal text-text-muted">· 0</span></h2>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {["Manipulation Tactics", "Psychological Patterns", "Power Dynamics"].map((t) => (
                  <div key={t} className="rounded-lg border border-accent-cyan/10 bg-surface p-4">
                    <div className="h-3 w-3/4 rounded bg-accent-cyan/20 mb-2" />
                    <div className="h-2 w-full rounded bg-border/40 mb-1" />
                    <div className="h-2 w-2/3 rounded bg-border/40" />
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-border/20" />

            {/* Transmissions preview */}
            <section className="space-y-5 opacity-40">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold">/// saved_transmissions</p>
                <h2 className="font-display text-xl font-bold text-accent-gold">Transmissions <span className="font-mono text-sm font-normal text-text-muted">· 0</span></h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-accent-gold/10 bg-surface p-3">
                    <div className="aspect-video w-full rounded-md bg-accent-gold/10 mb-3" />
                    <div className="h-2 w-1/3 rounded bg-accent-gold/20 mb-2" />
                    <div className="h-3 w-full rounded bg-border/40 mb-1" />
                    <div className="h-3 w-4/5 rounded bg-border/40" />
                  </div>
                ))}
              </div>
            </section>

            <div className="h-px bg-border/20" />

            {/* Quotes preview */}
            <section className="space-y-5 opacity-40">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">/// saved_moments</p>
                <h2 className="font-display text-xl font-bold text-accent-violet">Quotes <span className="font-mono text-sm font-normal text-text-muted">· 0</span></h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-accent-violet/10 bg-surface p-4">
                    <div className="space-y-1 mb-3">
                      <div className="h-2.5 w-full rounded bg-border/40" />
                      <div className="h-2.5 w-5/6 rounded bg-border/40" />
                      <div className="h-2.5 w-4/6 rounded bg-border/40" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-accent-violet/20" />
                      <div className="h-2 w-24 rounded bg-border/40" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="sticky top-1/3">
              <div className="mx-4 rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-[#0d0d1a]/95 to-[#08080f]/95 backdrop-blur-sm p-8 text-center space-y-4 shadow-2xl shadow-black/50 max-w-sm">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-gold/20 bg-accent-gold/5">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-accent-gold/70">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold/60">/// vessel_sealed</p>
                  <h3 className="font-display text-lg font-bold text-white">Your codex is waiting.</h3>
                  <p className="font-mono text-xs text-text-muted leading-relaxed">
                    Sign in to start building your personal map of the archive — saved signals, transmissions, and moments.
                  </p>
                </div>
                <div className="space-y-2">
                  <Link
                    href="/auth/signin?callbackUrl=/codex"
                    className="flex items-center justify-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25 w-full"
                  >
                    Sign in to open your codex →
                  </Link>
                  <Link
                    href="/premium"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2 font-mono text-[10px] text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary w-full"
                  >
                    See what&apos;s inside →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Generic block for each of the three codex sections. Renders an
 * accent-colored header row (eyebrow + title + count + "View all"),
 * then either the children (when non-empty) or the empty-state CTA.
 */
function CodexSection({
  accent,
  eyebrow,
  title,
  count,
  indexHref,
  emptyBody,
  emptyCta,
  children,
}: {
  accent: "gold" | "cyan" | "violet";
  eyebrow: string;
  title: string;
  count: number;
  indexHref: string;
  emptyBody: string;
  emptyCta: { label: string; href: string };
  children: React.ReactNode;
}) {
  const a =
    accent === "gold"
      ? {
          eyebrow: "text-accent-gold",
          title: "text-accent-gold",
          cta: "text-accent-gold hover:text-accent-gold/80",
        }
      : accent === "cyan"
        ? {
            eyebrow: "text-accent-cyan",
            title: "text-accent-cyan",
            cta: "text-accent-cyan hover:text-accent-cyan/80",
          }
        : {
            eyebrow: "text-accent-violet",
            title: "text-accent-violet",
            cta: "text-accent-violet hover:text-accent-violet/80",
          };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}
          >
            {eyebrow}
          </p>
          <h2 className={`font-display text-xl font-bold ${a.title}`}>
            {title}{" "}
            <span className="font-mono text-sm font-normal text-text-muted">
              · {count}
            </span>
          </h2>
        </div>
        {count > 0 && (
          <Link
            href={indexHref}
            className={`font-mono text-[11px] uppercase tracking-widest inline-flex items-center gap-2 group ${a.cta}`}
          >
            View all <span aria-hidden className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        )}
      </div>

      {count === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center space-y-3">
          <p className="text-sm text-text-muted">{emptyBody}</p>
          <Link
            href={emptyCta.href}
            className={`inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-text-primary transition-colors hover:border-text-muted/50 hover:bg-surface`}
          >
            {emptyCta.label} <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
