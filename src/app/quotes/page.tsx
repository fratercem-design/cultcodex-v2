import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { getQuotes, getQuoteCount, getTopSpeakers } from "@/lib/queries/quotes";
import { getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import { IconQuote } from "@/components/graphics/codex-icons";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import type { PersonType } from "@/generated/prisma/client";

export const revalidate = 300;

export const metadata = {
  title: "Quotes — CULT CODEX",
  description: "Notable quotes from Cult of Psyche episodes",
};

// Color accent per personType for the speaker spotlight
const TYPE_ACCENT: Record<
  PersonType,
  { ring: string; bg: string; text: string; initial: string }
> = {
  host: {
    ring: "ring-accent-gold/60",
    bg: "bg-accent-gold/10",
    text: "text-accent-gold",
    initial: "bg-accent-gold/20 text-accent-gold",
  },
  recurring: {
    ring: "ring-accent-cyan/60",
    bg: "bg-accent-cyan/10",
    text: "text-accent-cyan",
    initial: "bg-accent-cyan/20 text-accent-cyan",
  },
  guest: {
    ring: "ring-accent-violet/60",
    bg: "bg-accent-violet/10",
    text: "text-accent-violet",
    initial: "bg-accent-violet/20 text-accent-violet",
  },
  mentioned: {
    ring: "ring-border",
    bg: "bg-elevated",
    text: "text-text-muted",
    initial: "bg-elevated text-text-muted",
  },
};

interface QuotesPageProps {
  searchParams: Promise<{ page?: string; q?: string; speaker?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const speakerFilter = params.speaker?.trim() ?? "";

  const [totalCount, topSpeakers, lastUpdated] = await Promise.all([
    getQuoteCount({
      search: search || undefined,
      speakerSlug: speakerFilter || undefined,
    }),
    getTopSpeakers(24),
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

  const allQuoteCount =
    search || speakerFilter ? await getQuoteCount() : totalCount;

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const activeSpeaker = speakerFilter
    ? topSpeakers.find((s) => s.slug === speakerFilter)
    : null;

  const subtitleParts: string[] = [];
  if (search) subtitleParts.push(`matching "${search}"`);
  if (activeSpeaker) subtitleParts.push(`by ${activeSpeaker.displayName}`);
  const subtitle =
    subtitleParts.length > 0
      ? `${totalCount.toLocaleString()} quotes ${subtitleParts.join(" ")}`
      : `${allQuoteCount.toLocaleString()} notable quotes from the archive`;

  const glanceItems = [
    {
      icon: <IconQuote size={14} />,
      label: `${allQuoteCount.toLocaleString()} quotes`,
    },
    { icon: "🎤", label: `${topSpeakers.length} speakers` },
    ...(lastUpdated
      ? [{ icon: "🔄", label: `Updated ${formatRelativeDate(lastUpdated)}` }]
      : []),
  ];

  // Pagination basePath preserves active filters
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

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {/* ── Speaker spotlight strip ──────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-3">
            <div className="h-5 w-1 rounded-full bg-accent-crimson" />
            <h2 className="font-display text-base font-bold tracking-tight text-accent-crimson">
              Top Quoted
            </h2>
            <span className="rounded-full border border-accent-crimson/30 bg-accent-crimson/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent-crimson">
              {topSpeakers.length}
            </span>
            {speakerFilter && (
              <Link
                href={search ? `/quotes?q=${encodeURIComponent(search)}` : "/quotes"}
                className="ml-auto font-mono text-[11px] text-text-muted hover:text-accent-crimson"
              >
                Clear speaker ✕
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {topSpeakers.map((speaker) => {
              const isActive = speakerFilter === speaker.slug;
              const a = TYPE_ACCENT[speaker.personType as PersonType] ?? TYPE_ACCENT.mentioned;
              const href = search
                ? `/quotes?q=${encodeURIComponent(search)}&speaker=${speaker.slug}`
                : `/quotes?speaker=${speaker.slug}`;

              return (
                <Link
                  key={speaker.slug}
                  href={isActive ? (search ? `/quotes?q=${encodeURIComponent(search)}` : "/quotes") : href}
                  title={`${speaker.displayName} — ${speaker.quoteCount} quotes`}
                  className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
                    isActive
                      ? `${a.bg} border-current ${a.text} shadow-sm`
                      : "border-border bg-surface hover:border-current hover:bg-elevated"
                  }`}
                  style={isActive ? {} : undefined}
                >
                  {/* Avatar or initial */}
                  {speaker.avatarUrl ? (
                    <img
                      src={speaker.avatarUrl}
                      alt=""
                      className={`h-5 w-5 rounded-full object-cover ring-1 ${isActive ? a.ring : "ring-border group-hover:ring-current"}`}
                    />
                  ) : (
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${isActive ? a.initial : "bg-elevated text-text-muted group-hover:bg-current/10"}`}
                    >
                      {speaker.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`font-mono text-[11px] font-medium leading-none ${
                      isActive ? a.text : "text-text-muted group-hover:" + a.text.replace("text-", "")
                    }`}
                  >
                    {speaker.displayName}
                  </span>
                  <span
                    className={`font-mono text-[10px] leading-none ${
                      isActive ? a.text + " opacity-70" : "text-text-muted/60"
                    }`}
                  >
                    {speaker.quoteCount}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Divider ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
            {activeSpeaker
              ? `${totalCount} quote${totalCount !== 1 ? "s" : ""} by ${activeSpeaker.displayName}`
              : search
              ? `${totalCount} result${totalCount !== 1 ? "s" : ""}`
              : "All quotes"}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>

        {/* ── Search + filters ───────────────────────────────────────────────── */}
        <form action="/quotes" method="get" className="-mt-4">
          {speakerFilter && (
            <input type="hidden" name="speaker" value={speakerFilter} />
          )}
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search quotes by keyword or phrase…"
              className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-crimson/50 focus:outline-none focus:ring-1 focus:ring-accent-crimson/30"
            />
            <button
              type="submit"
              className="rounded-lg border border-accent-crimson/30 bg-accent-crimson/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-crimson transition-colors hover:bg-accent-crimson/20"
            >
              Search
            </button>
            {search && (
              <Link
                href={speakerFilter ? `/quotes?speaker=${speakerFilter}` : "/quotes"}
                className="flex items-center rounded-lg border border-border px-3 py-2.5 font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
              >
                ✕
              </Link>
            )}
          </div>
        </form>

        {/* ── Quote list ─────────────────────────────────────────────────────── */}
        {quotes.length === 0 ? (
          <EmptyState
            message={search ? `No quotes match "${search}"` : "No quotes found"}
            suggestion={
              search
                ? "Try a different search term"
                : "Quotes are extracted during AI enrichment"
            }
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
                    timestampSeconds={quote.timestampSeconds}
                  />
                  {quote.episode && (
                    <div className="ml-4 mt-1 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-text-muted">
                        from
                      </span>
                      <Link
                        href={`/episodes/${quote.episode.slug}`}
                        className="line-clamp-1 font-mono text-[10px] text-accent-gold hover:underline"
                      >
                        {quote.episode.episodeNumber != null &&
                          `EP ${quote.episode.episodeNumber}: `}
                        {quote.episode.title}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <PaginationControls meta={paginationMeta} basePath={basePath} />
          </>
        )}
      </main>
    </>
  );
}
