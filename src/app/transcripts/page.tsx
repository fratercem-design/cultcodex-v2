import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getEpisodesWithTranscripts,
  getEpisodesWithTranscriptsCount,
  searchWithinTranscripts,
  getTranscriptStats,
} from "@/lib/queries/transcripts";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import { formatSeconds } from "@/lib/format/duration";

export const revalidate = 600;

export const metadata = {
  title: "Transcripts — CULT CODEX",
  description: "Search and browse episode transcripts from the Cult of Psyche archive",
};

interface TranscriptsPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function TranscriptsPage({ searchParams }: TranscriptsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const isSearch = query.length > 0;

  const stats = await getTranscriptStats();

  const glanceItems = [
    { icon: "\uD83C\uDFA4", label: `${stats.episodeCount} transcribed episode${stats.episodeCount !== 1 ? "s" : ""}` },
    { icon: "\uD83D\uDCC4", label: `${stats.totalSegments.toLocaleString()} segment${stats.totalSegments !== 1 ? "s" : ""}` },
  ];

  if (isSearch) {
    // ── Search mode ──────────────────────────────────────────────────
    const totalCount = (await searchWithinTranscripts(query, { take: 0, skip: 0 })).totalCount;
    const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
    const { skip, take } = paginationArgs(page);
    const results = await searchWithinTranscripts(query, { take, skip });
    const paginationMeta = buildPaginationMeta(page, take, results.totalCount);

    return (
      <>
        <PageHero
          title="TRANSCRIPTS"
          subtitle={`${results.totalCount.toLocaleString()} result${results.totalCount !== 1 ? "s" : ""} for "${query}"`}
          backgroundImage="/search-database-background.jpg"
        />
        <EntityGlanceBar items={glanceItems} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
          <SearchBox defaultValue={query} />

          {results.hits.length === 0 ? (
            <EmptyState
              message={`No transcript segments match "${query}"`}
              suggestion="Try a different search term or browse the directory"
            />
          ) : (
            <>
              <div className="space-y-3">
                {results.hits.map((hit) => (
                  <Link
                    key={hit.segmentId}
                    href={`/episodes/${hit.episodeSlug}?tab=transcript&t=${hit.startSeconds}`}
                    className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[11px] text-accent-gold">
                        {hit.episodeNumber != null ? `#${hit.episodeNumber}` : "Episode"}
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {hit.episodeTitle}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-text-muted">
                        {formatSeconds(hit.startSeconds)}
                      </span>
                    </div>
                    {hit.speakerLabel && (
                      <StatusBadge label={hit.speakerLabel} variant="purple" />
                    )}
                    <p className="mt-1 text-sm leading-relaxed text-text-muted line-clamp-2">
                      {hit.text}
                    </p>
                  </Link>
                ))}
              </div>
              <PaginationControls meta={paginationMeta} basePath="/transcripts" />
            </>
          )}
        </main>
      </>
    );
  }

  // ── Directory mode ───────────────────────────────────────────────
  const totalCount = await getEpisodesWithTranscriptsCount();
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);
  const episodes = await getEpisodesWithTranscripts({ take, skip });
  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <>
      <PageHero
        title="TRANSCRIPTS"
        subtitle="Browse and search episode transcripts"
        backgroundImage="/search-database-background.jpg"
      />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <SearchBox defaultValue="" />

        {episodes.length === 0 ? (
          <EmptyState
            message="No transcripts available yet"
            suggestion="Transcripts will appear here once episodes are processed"
          />
        ) : (
          <>
            <div className="space-y-3">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/episodes/${ep.slug}?tab=transcript`}
                  className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-accent-gold">
                      {ep.episodeNumber != null ? `#${ep.episodeNumber}` : "—"}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {ep.title}
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-text-muted">
                      {formatDate(ep.airDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge label={`${ep.segmentCount} segments`} variant="muted" />
                    {ep.duration && (
                      <StatusBadge label={formatDuration(ep.duration)} variant="muted" />
                    )}
                    {ep.speakers.map((speaker) => (
                      <StatusBadge key={speaker} label={speaker} variant="purple" />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
            <PaginationControls meta={paginationMeta} basePath="/transcripts" />
          </>
        )}
      </main>
    </>
  );
}

// ── Search box (plain HTML form) ────────────────────────────────────
function SearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/transcripts" method="get" className="mb-6">
      <div className="relative">
        <input
          type="text"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search within transcripts..."
          className="w-full max-w-md rounded-lg border border-border bg-background px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green/50 focus:outline-none focus:ring-1 focus:ring-accent-green/30"
        />
        <button
          type="submit"
          className="absolute right-1 top-1 rounded-md border border-border bg-surface px-3 py-1 font-mono text-[11px] text-text-muted transition-colors hover:border-accent-green/30 hover:text-accent-green"
        >
          Search
        </button>
      </div>
    </form>
  );
}
