import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { getQuotes, getQuoteCount, getTopSpeakers } from "@/lib/queries/quotes";
import { getArchiveLastUpdated } from "@/lib/queries/stats";
import { getSavedQuoteIds } from "@/lib/queries/codex";
import { getQuoteReactionCountsBatch } from "@/lib/queries/quote-reactions";
import { getCurrentUser } from "@/lib/auth";
import { SaveQuoteButton } from "@/components/codex/save-quote-button";
import { formatRelativeDate } from "@/lib/format/date";
import { IconQuote } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

export const revalidate = 300;

export const metadata = {
  title: "Quotes — CULT CODEX",
  description: "Notable quotes from Cult of Psyche episodes",
};

interface QuotesPageProps {
  searchParams: Promise<{ page?: string; q?: string; speaker?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const speakerFilter = params.speaker?.trim() ?? "";

  const [totalCount, topSpeakers, lastUpdated] = await Promise.all([
    getQuoteCount({ search: search || undefined, speakerSlug: speakerFilter || undefined }),
    getTopSpeakers(20),
    getArchiveLastUpdated(),
  ]);

  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const quotes = await getQuotes({
    take,
    skip,
    search: search || undefined,
    speakerSlug: speakerFilter || undefined,
  });

  // /codex save state — mark which quotes the current user has already saved.
  const user = await getCurrentUser();
  const quoteIds = quotes.map((q) => q.id);
  const [savedIds, reactionMap] = await Promise.all([
    getSavedQuoteIds(user?.id ?? null, quoteIds),
    getQuoteReactionCountsBatch(quoteIds, user?.id),
  ]);

  const allQuoteCount = search || speakerFilter
    ? await getQuoteCount()
    : totalCount;

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const activeSpeaker = speakerFilter
    ? topSpeakers.find((s) => s.slug === speakerFilter)
    : null;

  const subtitleParts: string[] = [];
  if (search) subtitleParts.push(`matching "${search}"`);
  if (activeSpeaker) subtitleParts.push(`by ${activeSpeaker.displayName}`);
  const subtitle = subtitleParts.length > 0
    ? `${totalCount.toLocaleString()} quotes ${subtitleParts.join(" ")}`
    : `${allQuoteCount.toLocaleString()} notable quotes from the archive`;

  const glanceItems = [
    { icon: <IconQuote size={14} />, label: `${allQuoteCount.toLocaleString()} quotes` },
    { icon: "\uD83C\uDFA4", label: `${topSpeakers.length} speakers` },
    ...(lastUpdated ? [{ icon: "\uD83D\uDD04", label: `Updated ${formatRelativeDate(lastUpdated)}` }] : []),
  ];

  // Build pagination basePath with filters preserved
  const filterParams = new URLSearchParams();
  if (search) filterParams.set("q", search);
  if (speakerFilter) filterParams.set("speaker", speakerFilter);
  const basePath = filterParams.toString()
    ? `/quotes?${filterParams.toString()}`
    : "/quotes";

  return (
    <>
      <PageHero
        title="QUOTES"
        subtitle={subtitle}
        backgroundImage="/long-form-background.jpg"
      />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Search bar */}
            <form action="/quotes" method="get" className="mb-5">
              {speakerFilter && (
                <input type="hidden" name="speaker" value={speakerFilter} />
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  name="q"
                  defaultValue={search}
                  placeholder="Search quotes by keyword or phrase..."
                  className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-crimson/50 focus:outline-none focus:ring-1 focus:ring-accent-crimson/30"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-accent-crimson/30 bg-accent-crimson/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-crimson transition-colors hover:bg-accent-crimson/20"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Active filters */}
            {(search || speakerFilter) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">Filters:</span>
                {search && (
                  <Link
                    href={speakerFilter ? `/quotes?speaker=${speakerFilter}` : "/quotes"}
                    className="inline-flex items-center gap-1 rounded-full border border-accent-crimson/30 bg-accent-crimson/10 px-2.5 py-0.5 font-mono text-[10px] text-accent-crimson hover:bg-accent-crimson/20"
                  >
                    &ldquo;{search}&rdquo; ✕
                  </Link>
                )}
                {activeSpeaker && (
                  <Link
                    href={search ? `/quotes?q=${encodeURIComponent(search)}` : "/quotes"}
                    className="inline-flex items-center gap-1 rounded-full border border-accent-gold/30 bg-accent-gold/10 px-2.5 py-0.5 font-mono text-[10px] text-accent-gold hover:bg-accent-gold/20"
                  >
                    {activeSpeaker.displayName} ✕
                  </Link>
                )}
                <Link
                  href="/quotes"
                  className="font-mono text-[10px] text-text-muted hover:text-accent-crimson"
                >
                  Clear all
                </Link>
              </div>
            )}

            {/* Quote list */}
            {quotes.length === 0 ? (
              <EmptyState
                message={search ? `No quotes match "${search}"` : "No quotes found"}
                suggestion={search ? "Try a different search term" : "Quotes are extracted during AI enrichment"}
              />
            ) : (
              <>
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id}>
                      <QuoteHighlightCard
                        id={quote.id}
                        text={quote.text}
                        speakerName={quote.speaker?.displayName}
                        speakerAvatarUrl={quote.speaker?.avatarUrl}
                        speakerSlug={quote.speaker?.slug}
                        speakerType={quote.speaker?.personType}
                        timestampSeconds={quote.timestampSeconds}
                        reactions={reactionMap.get(quote.id)}
                        isAuthenticated={Boolean(user)}
                      />
                      {/* Episode context link + save button */}
                      <div className="mt-1 ml-4 flex items-center justify-between gap-2">
                        {quote.episode ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] text-text-muted">from</span>
                            <Link
                              href={`/episodes/${quote.episode.slug}`}
                              className="font-mono text-[10px] text-accent-gold hover:underline line-clamp-1"
                            >
                              {quote.episode.episodeNumber != null && `EP ${quote.episode.episodeNumber}: `}
                              {quote.episode.title}
                            </Link>
                          </div>
                        ) : (
                          <span />
                        )}
                        <SaveQuoteButton
                          quoteId={quote.id}
                          initialSaved={savedIds.has(quote.id)}
                          isAuthenticated={!!user}
                          size="sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <PaginationControls meta={paginationMeta} basePath={basePath} />
              </>
            )}
          </div>

          {/* Sidebar — Top Speakers */}
          <div className="space-y-6">
            <SectionCard title="Top Quoted">
              <div className="space-y-1">
                {topSpeakers.map((speaker) => (
                  <Link
                    key={speaker.slug}
                    href={search ? `/quotes?q=${encodeURIComponent(search)}&speaker=${speaker.slug}` : `/quotes?speaker=${speaker.slug}`}
                    className={`group flex items-center justify-between rounded-md px-2.5 py-1.5 transition-colors ${
                      speakerFilter === speaker.slug
                        ? "border border-accent-gold/40 bg-accent-gold/10"
                        : "hover:bg-elevated"
                    }`}
                  >
                    <span className={`font-mono text-xs line-clamp-1 ${
                      speakerFilter === speaker.slug
                        ? "text-accent-gold font-bold"
                        : "text-text-muted group-hover:text-accent-gold"
                    }`}>
                      {speaker.displayName}
                    </span>
                    <span className={`ml-2 font-mono text-[10px] ${
                      speakerFilter === speaker.slug
                        ? "text-accent-gold"
                        : "text-text-muted"
                    }`}>
                      {speaker.quoteCount}
                    </span>
                  </Link>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Browse By">
              <div className="space-y-2">
                <Link
                  href="/people"
                  className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent-gold/40 hover:bg-elevated"
                >
                  <span className="text-sm">👤</span>
                  <span className="font-mono text-xs text-text-muted group-hover:text-accent-gold">People</span>
                </Link>
                <Link
                  href="/episodes"
                  className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent-gold/40 hover:bg-elevated"
                >
                  <span className="text-sm">🎬</span>
                  <span className="font-mono text-xs text-text-muted group-hover:text-accent-gold">Episodes</span>
                </Link>
                <Link
                  href="/transcripts"
                  className="group flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent-cyan/40 hover:bg-elevated"
                >
                  <span className="text-sm">📄</span>
                  <span className="font-mono text-xs text-text-muted group-hover:text-accent-cyan">Transcripts</span>
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
