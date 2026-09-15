export const dynamic = "force-dynamic";

import Link from "next/link";
import { globalSearch } from "@/lib/queries/search";
import type { SearchFilters } from "@/lib/queries/search";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";
import { formatSeconds } from "@/lib/format/duration";
import { SearchInput } from "@/components/search/search-input";
import { QuoteShareButton } from "@/components/quotes/share-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — CULT CODEX",
  description: "Search the Cult of Psyche archive for episodes, people, and lore.",
  alternates: { canonical: "/search" },
};

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;       // comma-separated: episodes,people,lore,topics,quotes,transcripts
    contentType?: string; // livestream,original,short,clip
    series?: string;      // series slug
    transcript?: string;  // "yes" or "no"
    from?: string;        // date YYYY-MM-DD
    to?: string;          // date YYYY-MM-DD
    page?: string;        // paginates a single selected entity type
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";

  const filters: SearchFilters = {};
  if (params.type) {
    filters.entityTypes = params.type.split(",").filter(Boolean);
  }
  if (params.contentType) {
    filters.contentType = params.contentType;
  }
  if (params.series) {
    filters.seriesSlug = params.series;
  }
  if (params.transcript === "yes") {
    filters.hasTranscript = true;
  } else if (params.transcript === "no") {
    filters.hasTranscript = false;
  }
  if (params.from) {
    filters.dateFrom = params.from;
  }
  if (params.to) {
    filters.dateTo = params.to;
  }
  const selectedTypes = params.type?.split(",").filter(Boolean) ?? [];
  const page = /^\d+$/.test(params.page ?? "") ? Math.max(1, Number(params.page)) : 1;
  if (selectedTypes.length === 1) filters.page = page;

  const results = query ? await globalSearch(query, filters) : null;

  return (
    <>
    <PageHero
      title="SEARCH"
      subtitle="Query the archive"
      backgroundImage="/search-database-background.jpg"
    
      label="search"
    />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      {/* Search input */}
      <div className="mb-6">
        <SearchInput defaultValue={query} />
      </div>

      {/* Oracle crosslink */}
      <div className="mb-8 flex items-center justify-between gap-4 rounded-lg border border-accent-violet/20 bg-accent-violet/5 px-4 py-3">
        <p className="font-mono text-[11px] text-text-muted leading-snug">
          <span className="text-accent-violet-text font-bold">Want a synthesized answer?</span>{" "}
          The Oracle is AI trained on the full archive — ask a question, get an answer with citations.
        </p>
        <Link
          href="/oracle"
          className="shrink-0 inline-flex items-center gap-1 rounded border border-accent-violet/40 bg-surface px-3 py-1.5 font-mono text-[10px] font-bold text-accent-violet-text transition-colors hover:bg-accent-violet/10 whitespace-nowrap"
        >
          Ask Oracle →
        </Link>
      </div>

      {/* Filter bar */}
      {query && (
        <div className="mb-6 space-y-3">
          {/* Entity type filters */}
          <div className="flex flex-wrap gap-2">
            {["episodes", "people", "lore", "topics", "quotes", "transcripts"].map((t) => {
              const currentTypes = params.type?.split(",").filter(Boolean) ?? [];
              const isActive = currentTypes.length === 0 || currentTypes.includes(t);
              const newTypes = isActive && currentTypes.length > 0
                ? currentTypes.filter((ct) => ct !== t)
                : [...currentTypes, t];
              const href = buildSearchUrl(query, { ...params, type: newTypes.length > 0 && newTypes.length < 6 ? newTypes.join(",") : undefined });
              return (
                <Link
                  key={t}
                  href={href}
                  className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                    isActive
                      ? "border-accent-gold text-accent-gold-text bg-accent-gold/10"
                      : "border-border text-text-muted hover:border-accent-gold/50"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Link>
              );
            })}
          </div>

          {/* Advanced filters */}
          <div className="flex flex-wrap gap-2">
            {/* Content type */}
            {(["livestream", "original", "short", "clip"] as const).map((ct) => {
              const isActive = params.contentType === ct;
              const href = buildSearchUrl(query, { ...params, contentType: isActive ? undefined : ct });
              return (
                <Link
                  key={ct}
                  href={href}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
                    isActive
                      ? "border-accent-purple text-accent-purple bg-accent-purple/10"
                      : "border-border text-text-muted hover:border-accent-purple/50"
                  }`}
                >
                  {ct}
                </Link>
              );
            })}

            {/* Transcript filter */}
            {(["yes", "no"] as const).map((val) => {
              const isActive = params.transcript === val;
              const href = buildSearchUrl(query, { ...params, transcript: isActive ? undefined : val });
              return (
                <Link
                  key={`transcript-${val}`}
                  href={href}
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition-colors ${
                    isActive
                      ? "border-accent-cyan text-accent-cyan bg-accent-cyan/10"
                      : "border-border text-text-muted hover:border-accent-cyan/50"
                  }`}
                >
                  {val === "yes" ? "has transcript" : "no transcript"}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* No query yet — explore the archive */}
      {!results && (
        <div className="space-y-6">
          <div>
            <h2 className="font-mono text-sm font-bold text-text-primary tracking-wider uppercase mb-1">
              Explore the Archive
            </h2>
            <p className="font-mono text-xs text-text-muted">
              Search for episodes, people, lore, topics, or quotes
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Browse Episodes", href: "/episodes" },
              { label: "Browse People", href: "/people" },
              { label: "Browse Lore", href: "/lore" },
              { label: "Browse Topics", href: "/topics" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-text-primary transition-all hover:border-accent-gold hover:text-accent-gold-text hover:bg-accent-gold/5"
              >
                {link.label}
                <span className="text-text-muted group-hover:text-accent-gold-text transition-colors">&rarr;</span>
              </Link>
            ))}
          </div>

          <div>
            <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mb-3">Try searching for:</p>
            <div className="flex flex-wrap gap-2">
              {["tarot", "mythology", "quantum", "panel discussion", "astrology", "Lilith", "Cupid and Psyche", "scary tales"].map((q) => (
                <Link
                  key={q}
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="rounded-full border border-border bg-surface px-4 py-2 font-mono text-xs text-text-primary transition-all hover:border-accent-gold hover:text-accent-gold-text hover:bg-accent-gold/5 hover:shadow-sm"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Query submitted but zero results */}
      {results && results.totalCount === 0 && (
        <EmptyState
          message={`No results found for "${query}".`}
          suggestion="Try different keywords or check your spelling."
        />
      )}

      {/* Results */}
      {results && results.totalCount > 0 && (
        <div className="space-y-6">
          <p className="font-mono text-xs text-text-muted">
            {results.totalCount} result{results.totalCount !== 1 ? "s" : ""}{" "}
            for &ldquo;{query}&rdquo;
          </p>

          {/* ── Episodes ────────────────────────── */}
          {results.episodes.length > 0 && (
            <SectionCard title={`Episodes (${results.episodeTotalCount > results.episodes.length ? `${results.episodes.length} of ${results.episodeTotalCount}` : results.episodes.length})`}>
              <ul className="divide-y divide-border">
                {results.episodes.map((ep) => (
                  <li key={ep.id}>
                    <Link
                      href={`/episodes/${ep.slug}`}
                      className="group flex items-start gap-3 py-3 px-1 transition-colors hover:bg-elevated rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {ep.episodeNumber != null && (
                            <span className="font-mono text-[10px] text-accent-gold-text font-bold">
                              EP.{String(ep.episodeNumber).padStart(3, "0")}
                            </span>
                          )}
                          {ep.airDate && (
                            <span className="font-mono text-[10px] text-text-muted">
                              {formatDate(ep.airDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                          <HighlightMatch text={ep.title} query={query} />
                        </p>
                        {ep.summaryShort && (
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                            <HighlightMatch
                              text={ep.summaryShort}
                              query={query}
                            />
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {selectedTypes.length !== 1 && results.episodeTotalCount > results.episodes.length && (
                <Link
                  href={buildSearchUrl(query, { ...params, type: "episodes" })}
                  className="mt-3 inline-flex font-mono text-xs text-accent-gold-text hover:underline"
                >
                  View all {results.episodeTotalCount} matching episodes →
                </Link>
              )}
            </SectionCard>
          )}
          {selectedTypes.length === 1 && selectedTypes[0] === "episodes" && (
            <PaginationControls
              basePath="/search"
              meta={{
                page,
                pageSize: 20,
                totalCount: results.episodeTotalCount,
                totalPages: Math.max(1, Math.ceil(results.episodeTotalCount / 20)),
              }}
            />
          )}

          {/* ── People ──────────────────────────── */}
          {results.people.length > 0 && (
            <SectionCard title={`People (${results.peopleTotalCount > results.people.length ? `${results.people.length} of ${results.peopleTotalCount}` : results.people.length})`}>
              <ul className="divide-y divide-border">
                {results.people.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/people/${person.slug}`}
                      className="group flex items-start gap-3 py-3 px-1 transition-colors hover:bg-elevated rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                            <HighlightMatch
                              text={person.displayName}
                              query={query}
                            />
                          </p>
                          <StatusBadge
                            label={person.personType.replace("_", " ")}
                            variant={
                              person.personType === "host"
                                ? "green"
                                : person.personType === "recurring"
                                  ? "purple"
                                  : "muted"
                            }
                          />
                        </div>
                        {person.shortBio && (
                          <p className="text-xs text-text-muted line-clamp-2">
                            <HighlightMatch
                              text={person.shortBio}
                              query={query}
                            />
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Lore ────────────────────────────── */}
          {results.lore.length > 0 && (
            <SectionCard title={`Lore (${results.loreTotalCount > results.lore.length ? `${results.lore.length} of ${results.loreTotalCount}` : results.lore.length})`}>
              <ul className="divide-y divide-border">
                {results.lore.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      href={`/lore/${entry.slug}`}
                      className="group flex items-start gap-3 py-3 px-1 transition-colors hover:bg-elevated rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                            <HighlightMatch
                              text={entry.title}
                              query={query}
                            />
                          </p>
                          <StatusBadge
                            label={entry.canonStatus.replace("_", " ")}
                            variant={
                              entry.canonStatus === "canonical"
                                ? "gold"
                                : entry.canonStatus === "speculative"
                                  ? "purple"
                                  : "green"
                            }
                          />
                        </div>
                        {entry.summary && (
                          <p className="text-xs text-text-muted line-clamp-2">
                            <HighlightMatch
                              text={entry.summary}
                              query={query}
                            />
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Topics ───────────────────────────── */}
          {results.topics.length > 0 && (
            <SectionCard title={`Topics (${results.topicsTotalCount > results.topics.length ? `${results.topics.length} of ${results.topicsTotalCount}` : results.topics.length})`}>
              <ul className="divide-y divide-border">
                {results.topics.map((topic) => (
                  <li key={topic.id}>
                    <Link
                      href={`/topics/${topic.slug}`}
                      className="group flex items-start gap-3 py-3 px-1 transition-colors hover:bg-elevated rounded"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                          <HighlightMatch text={topic.title} query={query} />
                        </p>
                        {topic.description && (
                          <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
                            <HighlightMatch text={topic.description} query={query} />
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Quotes ───────────────────────────── */}
          {results.quotes.length > 0 && (
            <SectionCard title={`Quotes (${results.quotesTotalCount > results.quotes.length ? `${results.quotes.length} of ${results.quotesTotalCount}` : results.quotes.length})`}>
              <ul className="divide-y divide-border">
                {results.quotes.map((quote) => (
                  <li key={quote.id} className="py-3 px-1">
                    <blockquote className="border-l-2 border-accent-gold/50 pl-4">
                      <p className="text-sm text-text-primary italic">
                        &ldquo;<HighlightMatch text={quote.text} query={query} />&rdquo;
                      </p>
                      <div className="mt-1 flex items-center gap-2 font-mono text-xs text-text-muted">
                        {quote.speakerName && (
                          <span className="text-accent-gold-text">— {quote.speakerName}</span>
                        )}
                        {quote.episodeSlug && quote.episodeTitle && (
                          <Link
                            href={`/episodes/${quote.episodeSlug}`}
                            className="hover:text-accent-gold-text transition-colors"
                          >
                            in {quote.episodeTitle}
                          </Link>
                        )}
                      </div>
                      <QuoteShareButton quoteId={quote.id} quoteText={quote.text} />
                    </blockquote>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* ── Transcripts ──────────────────────── */}
          {results.transcripts.length > 0 && (
            <SectionCard title={`Transcripts (${results.transcriptsTotalCount > results.transcripts.length ? `${results.transcripts.length} of ${results.transcriptsTotalCount}` : results.transcripts.length})`}>
              <ul className="divide-y divide-border">
                {results.transcripts.map((seg) => (
                  <li key={seg.id} className="py-3 px-1">
                    <Link
                      href={`/episodes/${seg.episodeSlug}?tab=transcript&t=${seg.startSeconds}`}
                      className="group block transition-colors hover:bg-elevated rounded p-1"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-accent-gold-text">
                          {formatSeconds(seg.startSeconds)}
                        </span>
                        {seg.speakerLabel && (
                          <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                            {seg.speakerLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-primary line-clamp-2">
                        <HighlightMatch text={seg.text} query={query} />
                      </p>
                      <div className="mt-1 font-mono text-[10px] text-text-muted">
                        {seg.episodeNumber != null && (
                          <span className="text-accent-gold-text font-bold mr-1">
                            EP.{String(seg.episodeNumber).padStart(3, "0")}
                          </span>
                        )}
                        <span className="group-hover:text-accent-gold-text transition-colors">
                          {seg.episodeTitle}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </main>
    </>
  );
}

// ── URL builder ─────────────────────────────────────────────────────

function buildSearchUrl(
  query: string,
  params: Record<string, string | undefined>,
) {
  const sp = new URLSearchParams();
  sp.set("q", query);
  if (params.type) sp.set("type", params.type);
  if (params.contentType) sp.set("contentType", params.contentType);
  if (params.series) sp.set("series", params.series);
  if (params.transcript) sp.set("transcript", params.transcript);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  return `/search?${sp.toString()}`;
}

// ── Highlight component ─────────────────────────────────────────────
// Wraps matched substrings in a <mark> with accent styling

function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query || query.length === 0) return <>{text}</>;

  // Escape regex specials in the query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="bg-accent-gold/20 text-accent-gold-text rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
