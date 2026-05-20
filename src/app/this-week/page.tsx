import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { formatDate } from "@/lib/format/date";
import { QuoteShareButton } from "@/components/quotes/share-button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const digest = await getLatestDigest();
  return {
    title: digest ? `${digest.title} — CULT CODEX` : "This Week in the Archive — CULT CODEX",
    description:
      digest?.blurb ??
      "Five moments from the Cult of Psyche archive — curated weekly.",
  };
}

async function getLatestDigest() {
  return prisma.weeklyDigest.findFirst({
    where: { published: true },
    orderBy: { weekOf: "desc" },
  });
}

export default async function ThisWeekPage() {
  const digest = await getLatestDigest();

  if (!digest) {
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 text-center space-y-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
          /// this_week
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          This Week in the Archive
        </h1>
        <p className="font-mono text-xs text-text-muted">
          The first digest is being assembled. Check back soon.
        </p>
        <Link
          href="/episodes"
          className="inline-block font-mono text-xs uppercase tracking-widest text-accent-gold hover:opacity-80 transition-opacity"
        >
          Browse the full archive →
        </Link>
      </main>
    );
  }

  // Fetch all selected items in parallel
  const [quotes, episodes, people] = await Promise.all([
    digest.quoteIds.length > 0
      ? prisma.quote.findMany({
          where: { id: { in: digest.quoteIds } },
          select: {
            id: true,
            text: true,
            context: true,
            speaker: { select: { displayName: true, slug: true } },
            episode: { select: { episodeNumber: true, title: true, slug: true } },
          },
        })
      : [],
    digest.episodeIds.length > 0
      ? prisma.episode.findMany({
          where: { id: { in: digest.episodeIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            episodeNumber: true,
            airDate: true,
            summaryShort: true,
            thumbnailUrl: true,
          },
        })
      : [],
    digest.personIds.length > 0
      ? prisma.person.findMany({
          where: { id: { in: digest.personIds } },
          select: {
            id: true,
            displayName: true,
            slug: true,
            shortBio: true,
            avatarUrl: true,
          },
        })
      : [],
  ]);

  // Preserve curated order
  const orderedQuotes = digest.quoteIds
    .map((id) => quotes.find((q) => q.id === id))
    .filter(Boolean) as typeof quotes;
  const orderedEpisodes = digest.episodeIds
    .map((id) => episodes.find((e) => e.id === id))
    .filter(Boolean) as typeof episodes;
  const orderedPeople = digest.personIds
    .map((id) => people.find((p) => p.id === id))
    .filter(Boolean) as typeof people;

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-14">
      {/* Header */}
      <section className="space-y-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
          ✦ &nbsp; Week of {formatDate(digest.weekOf)} &nbsp; ✦
        </p>
        <h1 className="font-display text-3xl font-bold text-text-primary">
          {digest.title}
        </h1>
        {digest.blurb && (
          <p className="font-mono text-xs text-text-muted max-w-xl mx-auto leading-relaxed">
            {digest.blurb}
          </p>
        )}
      </section>

      <MysticalDivider />

      {/* Quotes */}
      {orderedQuotes.length > 0 && (
        <section className="space-y-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
            /// moments_from_the_archive
          </p>

          {orderedQuotes.map((q) => {
            const epLabel = q.episode?.episodeNumber
              ? `EP.${String(q.episode.episodeNumber).padStart(3, "0")}`
              : null;
            return (
              <div
                key={q.id}
                className="rounded-xl border border-border bg-surface p-6 space-y-4"
              >
                <blockquote className="font-serif text-base leading-relaxed text-text-primary">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-0.5">
                    {q.speaker && (
                      <Link
                        href={`/people/${q.speaker.slug}`}
                        className="font-display text-sm font-bold text-accent-gold hover:text-accent-gold/80 transition-colors"
                      >
                        {q.speaker.displayName}
                      </Link>
                    )}
                    {q.episode && (
                      <p className="font-mono text-[10px] text-text-muted">
                        <Link
                          href={`/episodes/${q.episode.slug}`}
                          className="hover:text-accent-cyan transition-colors"
                        >
                          {epLabel ? `${epLabel} — ` : ""}
                          {q.episode.title}
                        </Link>
                      </p>
                    )}
                  </div>
                  <QuoteShareButton
                    quoteId={q.id}
                    quoteText={q.text}
                    speakerName={q.speaker?.displayName}
                  />
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Episodes */}
      {orderedEpisodes.length > 0 && (
        <section className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/60">
            /// transmissions_this_week
          </p>
          <div className="space-y-3">
            {orderedEpisodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.slug}`}
                className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent-cyan/30 hover:bg-elevated"
              >
                {ep.thumbnailUrl ? (
                  <Image
                    src={ep.thumbnailUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded bg-accent-cyan/5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ep.episodeNumber && (
                      <span className="font-mono text-[10px] font-bold text-accent-cyan">
                        EP.{String(ep.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    {ep.airDate && (
                      <time dateTime={ep.airDate.toISOString()} className="font-mono text-[10px] text-text-muted">
                        {formatDate(ep.airDate)}
                      </time>
                    )}
                  </div>
                  <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors">
                    {ep.title}
                  </h3>
                  {ep.summaryShort && (
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">{ep.summaryShort}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* People */}
      {orderedPeople.length > 0 && (
        <section className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60">
            /// voices_in_focus
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {orderedPeople.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.slug}`}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:border-accent-violet/30 hover:bg-elevated"
              >
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    alt={person.displayName}
                    className="h-12 w-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-accent-violet/10 border border-accent-violet/20" />
                )}
                <div>
                  <p className="font-display text-sm font-bold text-text-primary group-hover:text-accent-violet transition-colors">
                    {person.displayName}
                  </p>
                  {person.shortBio && (
                    <p className="mt-1 font-mono text-[10px] text-text-muted line-clamp-3 leading-relaxed">
                      {person.shortBio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <MysticalDivider />

      {/* Share CTA */}
      <section className="text-center space-y-3">
        <p className="font-mono text-xs text-text-muted">
          Share this week&apos;s archive with someone who should know it exists.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`This week in the Cult of Psyche archive:\n`)}&url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me"}/this-week`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-[11px] text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post on X
          </a>
          <Link
            href="/episodes"
            className="inline-flex items-center gap-2 rounded border border-accent-gold/30 px-4 py-2 font-mono text-[11px] text-accent-gold hover:bg-accent-gold/5 transition-colors"
          >
            Full archive →
          </Link>
        </div>
      </section>
    </main>
  );
}
