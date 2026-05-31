import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getWeeklyDigestData } from "@/lib/queries/digest";
import { prisma } from "@/lib/db";
import { SubscribeForm } from "@/components/live/subscribe-form";
import { PageHero } from "@/components/ui/page-hero";

export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://cultcodex.me";

export const metadata: Metadata = {
  title: "This Week — CULT CODEX",
  description:
    "The weekly signal from CultCodex: top transmissions, archive highlights, most-reacted quotes, and new lore. Updated every week.",
  openGraph: {
    title: "This Week — CULT CODEX",
    description:
      "The weekly signal: top transmissions, archive highlights, and the most-reacted quote of the week.",
    type: "website",
    images: [{ url: `${SITE_URL}/social-share.jpg`, width: 1168, height: 784 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "This Week — CULT CODEX",
    description: "The weekly signal from the archive.",
    images: [`${SITE_URL}/social-share.jpg`],
  },
};

async function getRecentEpisodesFallback() {
  return prisma.episode.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      thumbnailUrl: true,
      summaryShort: true,
      airDate: true,
    },
    orderBy: { airDate: "desc" },
    take: 3,
  });
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ThisWeekPage() {
  const [digest, recentFallback] = await Promise.all([
    getWeeklyDigestData(),
    getRecentEpisodesFallback(),
  ]);

  const episodes =
    digest.newEpisodes.length > 0
      ? digest.newEpisodes.slice(0, 3)
      : recentFallback;

  const isCurrentWeek = digest.newEpisodes.length > 0;

  const weekEndFormatted = formatDate(digest.weekEnd);
  const weekStartFormatted = formatDate(digest.weekStart);

  return (
    <>
      <PageHero
        title="THE SIGNAL"
        subtitle="Weekly transmission from the archive"
        backgroundImage="/wiki-page-header.jpg"
        label="this-week"
      />

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-14">

        {/* ── Week label ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
            {weekStartFormatted} — {weekEndFormatted}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ── Recent Transmissions ───────────────────────────────────── */}
        <section className="space-y-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60 mb-1">
              /// recent_transmissions
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              {isCurrentWeek ? "New This Week" : "Latest from the Archive"}
            </h2>
            <p className="mt-1 font-mono text-xs text-text-muted">
              {isCurrentWeek
                ? `${digest.newEpisodes.length} episode${digest.newEpisodes.length === 1 ? "" : "s"} added to the archive this week.`
                : "The most recent transmissions, decoded and catalogued."}
            </p>
          </div>

          <div className="space-y-4">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.slug}`}
                className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent-violet/30 hover:shadow-md hover:shadow-accent-violet/5"
              >
                {ep.thumbnailUrl ? (
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={ep.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="128px"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border border-border bg-elevated text-2xl text-text-muted/20">
                    ◉
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {ep.episodeNumber && (
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-text-muted/50">
                      TX-{String(ep.episodeNumber).padStart(4, "0")} ·{" "}
                      {formatDate(ep.airDate)}
                    </p>
                  )}
                  <p className="font-mono text-sm font-bold text-text-primary group-hover:text-accent-violet transition-colors line-clamp-2">
                    {ep.title}
                  </p>
                  {ep.summaryShort && (
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed line-clamp-2">
                      {ep.summaryShort}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-right">
            <Link
              href="/episodes"
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted/50 hover:text-accent-violet transition-colors"
            >
              Browse the full archive →
            </Link>
          </div>
        </section>

        {/* ── Signal of the Week (top quote) ────────────────────────── */}
        {digest.topQuote && (
          <section className="space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60 mb-1">
                /// signal_of_the_week
              </p>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Most-Reacted Quote
              </h2>
              <p className="mt-1 font-mono text-xs text-text-muted">
                The quote with the most reactions across the past 30 days.
              </p>
            </div>

            <div className="relative rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-6 sm:p-8">
              <div
                className="pointer-events-none absolute -inset-px rounded-xl"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(ellipse at 30% 0%, rgba(212,175,55,0.08) 0%, transparent 60%)",
                }}
              />
              <span
                className="block font-serif text-5xl text-accent-gold/30 leading-none mb-4 select-none"
                aria-hidden="true"
              >
                ❝
              </span>
              <blockquote className="font-serif text-lg sm:text-xl leading-relaxed text-text-primary italic">
                {digest.topQuote.text}
              </blockquote>
              {digest.topQuote.speakerName && (
                <p className="mt-4 font-mono text-xs text-text-muted/70">
                  — {digest.topQuote.speakerName}
                  {digest.topQuote.episodeSlug && (
                    <>
                      {" · "}
                      <Link
                        href={`/episodes/${digest.topQuote.episodeSlug}`}
                        className="text-accent-gold/70 hover:text-accent-gold transition-colors underline underline-offset-2"
                      >
                        View episode →
                      </Link>
                    </>
                  )}
                </p>
              )}
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.25em] text-accent-gold/40">
                {digest.topQuote.reactionCount} reaction{digest.topQuote.reactionCount === 1 ? "" : "s"}
                {" · "} past 30 days
              </p>
            </div>
          </section>
        )}

        {/* ── New Lore Entries ───────────────────────────────────────── */}
        {digest.newLoreEntries.length > 0 && (
          <section className="space-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/60 mb-1">
                /// new_lore
              </p>
              <h2 className="font-display text-xl font-bold text-text-primary">
                Archive Updates
              </h2>
              <p className="mt-1 font-mono text-xs text-text-muted">
                New entries added to the lore this week.
              </p>
            </div>

            <div className="space-y-2">
              {digest.newLoreEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/lore/${entry.slug}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-all hover:border-accent-cyan/30"
                >
                  <span
                    className="mt-0.5 text-accent-cyan/40 group-hover:text-accent-cyan transition-colors"
                    aria-hidden="true"
                  >
                    ◈
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-text-primary group-hover:text-accent-cyan transition-colors">
                      {entry.title}
                    </p>
                    {entry.summary && (
                      <p className="mt-0.5 font-mono text-[11px] text-text-muted line-clamp-1">
                        {entry.summary}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted/40 mt-0.5 shrink-0">→</span>
                </Link>
              ))}
            </div>

            <div className="text-right">
              <Link
                href="/lore"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted/50 hover:text-accent-cyan transition-colors"
              >
                Browse the full grimoire →
              </Link>
            </div>
          </section>
        )}

        {/* ── Archive Pulse ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface/50 p-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted/50 mb-1">
              Members
            </p>
            <p className="font-display text-3xl font-bold text-accent-gold">
              {digest.memberCount}
            </p>
            <p className="font-mono text-[9px] text-text-muted/40 mt-0.5">initiates active</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted/50 mb-1">
              New Episodes
            </p>
            <p className="font-display text-3xl font-bold text-accent-violet">
              {digest.newEpisodes.length}
            </p>
            <p className="font-mono text-[9px] text-text-muted/40 mt-0.5">this week</p>
          </div>
          <div className="col-span-2 sm:col-span-1 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-text-muted/50 mb-1">
              New Quotes
            </p>
            <p className="font-display text-3xl font-bold text-accent-cyan">
              {digest.newQuotes.length}
            </p>
            <p className="font-mono text-[9px] text-text-muted/40 mt-0.5">indexed this week</p>
          </div>
        </section>

        {/* ── Ask the Oracle ─────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60 mb-1">
              /// oracle_signal
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Question of the Week
            </h2>
            <p className="mt-1 font-mono text-xs text-text-muted">
              Ask the Oracle anything from the archive. Three free questions, no account required.
            </p>
          </div>

          <div className="relative rounded-xl border border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-surface p-6 space-y-4">
            <div
              className="pointer-events-none absolute -inset-px rounded-xl"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(ellipse at 70% 0%, rgba(110,75,174,0.1) 0%, transparent 60%)",
              }}
            />
            <div className="relative space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent-violet/60">
                Suggested questions this week:
              </p>
              <ul className="space-y-2">
                {[
                  "What behavioral patterns appear most in recent episodes?",
                  "Who has had the most significant arc over the past year?",
                  "What recurring themes connect this month's transmissions?",
                ].map((q) => (
                  <li key={q}>
                    <Link
                      href={`/oracle?q=${encodeURIComponent(q)}`}
                      className="group flex items-start gap-2 font-mono text-xs text-text-muted hover:text-accent-violet transition-colors"
                    >
                      <span className="text-accent-violet/40 group-hover:text-accent-violet mt-0.5 shrink-0" aria-hidden="true">◉</span>
                      <span className="group-hover:underline underline-offset-2">{q}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link
                  href="/oracle"
                  className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/50 bg-accent-violet/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-violet transition-all hover:border-accent-violet/70 hover:bg-accent-violet/15"
                >
                  Open the Oracle →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── The Signal — Newsletter ────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60 mb-1">
              /// the_signal
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Never Miss a Transmission
            </h2>
            <p className="mt-1 font-mono text-xs text-text-muted">
              Get notified when new episodes drop and when the stream goes live.
            </p>
          </div>
          <Suspense>
            <SubscribeForm />
          </Suspense>
        </section>

        {/* ── Footer CTA ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Link
            href="/episodes"
            className="flex-1 text-center rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs text-text-muted hover:border-accent-violet/30 hover:text-accent-violet transition-colors"
          >
            Browse all episodes
          </Link>
          <Link
            href="/archetypes"
            className="flex-1 text-center rounded-lg border border-border bg-surface px-4 py-3 font-mono text-xs text-text-muted hover:border-accent-gold/30 hover:text-accent-gold transition-colors"
          >
            Find your archetype
          </Link>
          <Link
            href="/premium"
            className="flex-1 text-center rounded-lg border border-accent-gold/40 bg-accent-gold/5 px-4 py-3 font-mono text-xs font-bold text-accent-gold hover:border-accent-gold/70 hover:bg-accent-gold/10 transition-colors"
          >
            Become Initiate+ →
          </Link>
        </div>

      </main>
    </>
  );
}
