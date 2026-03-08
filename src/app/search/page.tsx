import Link from "next/link";
import { globalSearch } from "@/lib/queries/search";
import { PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";
import { SearchInput } from "@/components/search/search-input";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search — CULT CODEX",
  description: "Search the Cult of Psyche archive for episodes, people, and lore.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const results = query ? await globalSearch(query) : null;

  return (
    <PageShell title="SEARCH" subtitle="Query the archive">
      {/* Search input */}
      <div className="mb-8">
        <SearchInput defaultValue={query} />
      </div>

      {/* No query yet */}
      {!results && (
        <EmptyState message="Enter a search query above to begin." />
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
                            <span className="font-mono text-[10px] text-accent-green font-bold">
                              EP.{String(ep.episodeNumber).padStart(3, "0")}
                            </span>
                          )}
                          {ep.airDate && (
                            <span className="font-mono text-[10px] text-text-muted">
                              {formatDate(ep.airDate)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
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
            </SectionCard>
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
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
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
                                : person.personType === "recurring_guest"
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
                          <p className="text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors">
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
        </div>
      )}
    </PageShell>
  );
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
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-accent-green/20 text-accent-green rounded-sm px-0.5"
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
