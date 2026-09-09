import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { getQuoteReactionCounts } from "@/lib/queries/quote-reactions";
import { QuoteReactionBar } from "@/components/quotes/quote-reaction-bar";
import { SaveQuoteButton } from "@/components/codex/save-quote-button";
import { QuoteShareButton } from "@/components/quotes/share-button";
import { PersonSigil } from "@/components/ui/person-sigil";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatSeconds } from "@/lib/format/duration";
import { formatDate } from "@/lib/format/date";
import { getEraForEpisode } from "@/lib/eras";
import { buildMetadata } from "@/lib/seo";
import { QuoteCrossRef } from "@/components/quotes/quote-cross-ref";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true, episodeNumber: true, slug: true } },
    },
  });
  if (!quote) {
    return buildMetadata({
      title: "Quote not found — CULT CODEX",
      description: "This quote could not be found.",
      path: `/quotes/${id}`,
    });
  }

  const speaker = quote.speaker?.displayName ?? "Anonymous";
  const epLabel = quote.episode?.episodeNumber
    ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")}`
    : "the archive";
  const shortText = quote.text.length > 110
    ? quote.text.slice(0, 110) + "…"
    : quote.text;

  return buildMetadata({
    title: `"${shortText}" — ${speaker} — CULT CODEX`,
    description: `${speaker} on ${epLabel}${quote.episode?.title ? ` · ${quote.episode.title}` : ""}`,
    path: `/quotes/${id}`,
    image: `/quotes/${id}/og`,
  });
}

export default async function QuotePermalinkPage({ params }: PageProps) {
  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      speaker: {
        select: { slug: true, displayName: true, avatarUrl: true, personType: true },
      },
      episode: {
        select: {
          slug: true,
          title: true,
          episodeNumber: true,
          airDate: true,
          duration: true,
        },
      },
      transcriptSegment: {
        select: {
          id: true,
          episodeId: true,
          startSeconds: true,
          endSeconds: true,
          speakerLabel: true,
          text: true,
        },
      },
    },
  }).catch(() => null);

  if (!quote) notFound();

  const user = await getCurrentUser();
  const canReadTranscript = user ? await isSubscribed(user.id).catch(() => false) : false;

  // Surrounding transcript context — ± up to 2 segments around the quoted one,
  // bounded by the same episode and ordered by startSeconds. Gated by sub.
  const surroundingContext = await getSurroundingContext({
    segment: quote.transcriptSegment,
    enabled: Boolean(quote.transcriptSegment && canReadTranscript),
  }).catch(() => []);

  // Reactions
  const reactionCounts = await getQuoteReactionCounts(quote.id, user?.id).catch(() => ({
    fire: 0, eye: 0, moon: 0, skull: 0, wildcard: 0, userReactions: [] as string[],
  }));

  // Saved state for this user
  const savedRow = user
    ? await prisma.savedQuote.findUnique({
        where: { userId_quoteId: { userId: user.id, quoteId: quote.id } },
      }).catch(() => null)
    : null;
  const savedCount = await prisma.savedQuote.count({
    where: { quoteId: quote.id },
  }).catch(() => 0);

  // More from this episode / speaker
  const [moreFromEpisode, moreFromSpeaker] = await Promise.all([
    quote.episodeId
      ? prisma.quote.findMany({
          where: { episodeId: quote.episodeId, id: { not: quote.id } },
          include: {
            speaker: { select: { displayName: true, slug: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        }).catch(() => [])
      : Promise.resolve([]),
    quote.speakerPersonId
      ? prisma.quote.findMany({
          where: {
            id: { not: quote.id },
            speakerPersonId: quote.speakerPersonId,
          },
          include: {
            episode: {
              select: { slug: true, title: true, episodeNumber: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 4,
        }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const era = quote.episode ? getEraForEpisode(quote.episode.airDate) : null;

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 space-y-10">

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Quotes", href: "/quotes" },
          { label: quote.speaker?.displayName ?? "Quote" },
        ]}
      />

      {/* ── Quote poster ─────────────────────────────────────────── */}
      <article className="relative rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 via-surface to-surface px-7 py-9 sm:px-10 sm:py-12 space-y-7 overflow-hidden">
        {/* Gold radial glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(200, 57, 46,0.10), transparent 70%)",
          }}
        />
        {/* Decorative quote mark */}
        <span
          aria-hidden
          className="absolute top-4 left-5 font-serif text-[8rem] leading-none text-accent-gold-text/10 select-none pointer-events-none"
        >
          {"“"}
        </span>

        <div className="relative space-y-7">
          <blockquote className="font-display text-2xl sm:text-3xl leading-snug text-text-primary italic border-l-2 border-accent-gold/40 pl-5">
            &ldquo;{quote.text}&rdquo;
          </blockquote>

          {/* Attribution */}
          <div className="flex flex-wrap items-center gap-3 pl-5">
            {quote.speaker && (
              <Link
                href={`/people/${quote.speaker.slug}`}
                className="group flex items-center gap-2.5 hover:text-accent-gold-text transition-colors"
              >
                {quote.speaker.avatarUrl ? (
                  <Image
                    src={quote.speaker.avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover border border-accent-gold/30 group-hover:border-accent-gold/60 transition-colors"
                  />
                ) : (
                  <PersonSigil
                    slug={quote.speaker.slug}
                    name={quote.speaker.displayName}
                    personType={quote.speaker.personType}
                    size={32}
                    decorative
                    className="rounded-full border border-accent-gold/30"
                  />
                )}
                <span className="font-mono text-sm text-accent-gold-text">
                  {quote.speaker.displayName}
                </span>
              </Link>
            )}

            {quote.episode && (
              <>
                <span className="font-mono text-[10px] text-text-muted/60">·</span>
                <Link
                  href={
                    quote.timestampSeconds != null
                      ? `/episodes/${quote.episode.slug}?t=${quote.timestampSeconds}#quote-${quote.id}`
                      : `/episodes/${quote.episode.slug}`
                  }
                  className="font-mono text-[11px] text-text-muted hover:text-accent-gold-text transition-colors"
                >
                  {quote.episode.episodeNumber != null
                    ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")} · `
                    : ""}
                  {quote.episode.title}
                  {quote.timestampSeconds != null && (
                    <span className="ml-1.5 text-text-muted/60">
                      @ {formatSeconds(quote.timestampSeconds)}
                    </span>
                  )}
                </Link>
              </>
            )}

            {era && (
              <>
                <span className="font-mono text-[10px] text-text-muted/60">·</span>
                <Link
                  href={`/eras/${era.id}`}
                  className="font-mono text-[10px] text-text-muted/70 hover:text-accent-gold-text transition-colors"
                >
                  {era.sigil} {era.label}
                </Link>
              </>
            )}
          </div>

          {/* Action row */}
          <div className="flex flex-wrap items-center gap-3 pl-5 pt-2 border-t border-accent-gold/10">
            <QuoteReactionBar
              quoteId={quote.id}
              initial={reactionCounts}
              isAuthenticated={Boolean(user)}
              variant="full"
            />
            <div className="ml-auto flex items-center gap-3">
              <SaveQuoteButton
                quoteId={quote.id}
                initialSaved={Boolean(savedRow)}
                initialCount={savedCount}
                isAuthenticated={Boolean(user)}
              />
              <QuoteShareButton quoteId={quote.id} quoteText={quote.text} speakerName={quote.speaker?.displayName ?? undefined} />
            </div>
          </div>
        </div>
      </article>

      {/* ── Surrounding context ──────────────────────────────────── */}
      {quote.transcriptSegment && (
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
            {"/// surrounding_context"}
          </p>
          {canReadTranscript ? (
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3 font-mono text-[11px] text-text-muted leading-relaxed">
              {surroundingContext.map((seg) => {
                const isPivot = seg.id === quote.transcriptSegment?.id;
                return (
                  <div
                    key={seg.id}
                    className={`flex gap-4 ${isPivot ? "text-text-primary" : ""}`}
                  >
                    <span
                      className={`shrink-0 tabular-nums ${
                        isPivot ? "text-accent-gold-text" : "text-text-muted/60"
                      }`}
                    >
                      {formatSeconds(seg.startSeconds)}
                    </span>
                    <span
                      className={`min-w-0 ${
                        isPivot
                          ? "border-l-2 border-accent-gold/40 pl-3"
                          : "pl-[14px]"
                      }`}
                    >
                      {seg.speakerLabel && (
                        <span className={`mr-2 ${isPivot ? "text-accent-gold-text" : "text-text-muted/60"}`}>
                          {seg.speakerLabel}:
                        </span>
                      )}
                      {seg.text}
                    </span>
                  </div>
                );
              })}
              {quote.episode && (
                <div className="pt-2 border-t border-border">
                  <Link
                    href={`/episodes/${quote.episode.slug}?t=${quote.transcriptSegment.startSeconds}#quote-${quote.id}`}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-accent-violet-text hover:text-accent-violet-text/80 transition-colors"
                  >
                    Open in transcript <span aria-hidden>→</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-accent-violet/30 bg-accent-violet/5 p-5 text-center space-y-2">
              <p className="font-mono text-sm text-accent-violet-text">
                The surrounding transcript is sealed.
              </p>
              <p className="font-mono text-[11px] text-text-muted">
                Initiate+ unlocks every line before and after this quote.
              </p>
              <Link
                href="/premium#access"
                className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors mt-2"
              >
                Become Initiate+ →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* ── More from this episode ───────────────────────────────── */}
      {moreFromEpisode.length > 0 && quote.episode && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {"/// more_from_"}{quote.episode.episodeNumber != null
                ? `ep_${String(quote.episode.episodeNumber).padStart(3, "0")}`
                : "this_episode"}
            </p>
            <Link
              href={`/episodes/${quote.episode.slug}`}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
            >
              Open episode →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {moreFromEpisode.map((q) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="rounded-lg border border-border bg-surface p-4 hover:border-accent-gold/30 hover:bg-accent-gold/5 transition-colors space-y-2"
              >
                <p className="font-sans text-xs text-text-primary italic line-clamp-3 leading-snug">
                  &ldquo;{q.text}&rdquo;
                </p>
                {q.speaker && (
                  <p className="font-mono text-[9px] text-accent-gold-text/70">
                    — {q.speaker.displayName}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── More from this speaker ───────────────────────────────── */}
      {moreFromSpeaker.length > 0 && quote.speaker && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
              {"/// more_from_"}{quote.speaker.displayName.toLowerCase().replace(/\s+/g, "_")}
            </p>
            <Link
              href={`/people/${quote.speaker.slug}`}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
            >
              Profile →
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {moreFromSpeaker.map((q) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="rounded-lg border border-border bg-surface p-4 hover:border-accent-gold/30 hover:bg-accent-gold/5 transition-colors space-y-2"
              >
                <p className="font-sans text-xs text-text-primary italic line-clamp-3 leading-snug">
                  &ldquo;{q.text}&rdquo;
                </p>
                {q.episode && (
                  <p className="font-mono text-[9px] text-text-muted">
                    {q.episode.episodeNumber != null
                      ? `EP.${String(q.episode.episodeNumber).padStart(3, "0")} · `
                      : ""}
                    {q.episode.title}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Resonant moments — semantic cross-reference ─────────── */}
      <Suspense fallback={null}>
        <QuoteCrossRef
          quoteText={quote.text}
          excludeEpisodeId={quote.episodeId ?? undefined}
        />
      </Suspense>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <div className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/quotes"
          className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
        >
          ← All quotes
        </Link>
        {quote.episode && (
          <Link
            href={`/episodes/${quote.episode.slug}`}
            className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold-text transition-colors"
          >
            {quote.episode.episodeNumber != null
              ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")}`
              : "Episode"}{" "}
            transcript →
          </Link>
        )}
      </div>
    </main>
  );
}

interface SurroundingSegment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

async function getSurroundingContext(options: {
  segment: {
    id: string;
    episodeId: string;
    startSeconds: number;
    endSeconds: number;
    speakerLabel: string | null;
    text: string;
  } | null;
  enabled: boolean;
}): Promise<SurroundingSegment[]> {
  const { segment, enabled } = options;
  if (!segment || !enabled) return [];

  const selectShape = {
    id: true,
    startSeconds: true,
    endSeconds: true,
    speakerLabel: true,
    text: true,
  } as const;

  const [before, after] = await Promise.all([
    prisma.transcriptSegment.findMany({
      where: {
        episodeId: segment.episodeId,
        startSeconds: { lt: segment.startSeconds },
      },
      orderBy: { startSeconds: "desc" },
      take: 2,
      select: selectShape,
    }),
    prisma.transcriptSegment.findMany({
      where: {
        episodeId: segment.episodeId,
        startSeconds: { gt: segment.endSeconds },
      },
      orderBy: { startSeconds: "asc" },
      take: 2,
      select: selectShape,
    }),
  ]);

  const { id, startSeconds, endSeconds, speakerLabel, text } = segment;
  return [
    ...before.reverse(),
    { id, startSeconds, endSeconds, speakerLabel, text },
    ...after,
  ];
}
