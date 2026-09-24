
import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionCard } from "@/components/ui/section-card";
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
  alternates: { canonical: "/transcripts" },
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
    { icon: "\uD83C\uDFA4", label: `${stats.episodeCount} transcribed episodes` },
    { icon: "\uD83D\uDCC4", label: `${stats.totalSegments.toLocaleString("en-US")} segments` },
  ];

  if (isSearch) {
    const totalCount = (await searchWithinTranscripts(query, { take: 0, skip: 0 })).totalCount;
    const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
    const { skip, take } = paginationArgs(page);
    const results = await searchWithinTranscripts(query, { take, skip });
    const paginationMeta = buildPaginationMeta(page, take, results.totalCount);

    return (
      <>
        <PageHero
          title="TRANSCRIPTS"
          subtitle={`${results.totalCount.toLocaleString("en-US")} result${results.totalCount !== 1 ? "s" : ""} for "${query}"`}
          backgroundImage="/search-database-background.jpg"
        label="transcripts"
        />
        <EntityGlanceBar items={glanceItems} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
          <TranscriptSearchBox defaultValue={query} />

          {results.hits.length === 0 ? (
            <EmptyState
              message={`No transcript segments match "${query}"`}
              suggestion="Try a different search term or browse the full directory below"
            />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-xs text-text-muted">
                  Showing {skip + 1}–{Math.min(skip + take, results.totalCount)} of {results.totalCount.toLocaleString("en-US")} matches
                </span>
                <Link
                  href="/transcripts"
                  className="ml-auto font-mono text-xs text-accent-cyan hover:underline"
                >
                  Clear search
                </Link>
              </div>
              <div className="space-y-2">
                {results.hits.map((hit) => (
                  <Link
                    key={hit.segmentId}
                    href={`/episodes/${hit.episodeSlug}?tab=transcript&t=${hit.startSeconds}`}
                    className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-cyan/40 hover:bg-elevated"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-mono text-[12px] text-accent-gold-text">
                        {hit.episodeNumber != null ? `EP ${hit.episodeNumber}` : "Episode"}
                      </span>
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                        {hit.episodeTitle}
                      </span>
                      <span className="ml-auto font-mono text-[12px] text-accent-cyan">
                        {formatSeconds(hit.startSeconds)}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      {hit.speakerLabel && (
                        <StatusBadge label={hit.speakerLabel} variant="gold" />
                      )}
                      <p className="text-sm leading-relaxed text-text-muted line-clamp-2">
                        {hit.text}
                      </p>
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
        subtitle="Search every word spoken across the archive"
        backgroundImage="/search-database-background.jpg"
      label="transcripts"
      />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        {/* Search prominently at top */}
        <SectionCard title="Search Transcripts">
          <p className="mb-3 text-xs text-text-muted">
            Search across all {stats.totalSegments.toLocaleString("en-US")} transcript segments from {stats.episodeCount} episodes.
          </p>
          <TranscriptSearchBox defaultValue="" />
        </SectionCard>

        {/* Quick stats */}
        <div className="mt-6 mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="🎤" label="Episodes" value={stats.episodeCount} />
          <StatCard icon="📄" label="Segments" value={stats.totalSegments} />
          <StatCard icon="📖" label="Page" value={`${page} / ${Math.ceil(totalCount / take)}`} />
          <StatCard icon="🔍" label="Searchable" value="100%" />
        </div>

        {/* Episode directory */}
        <h2 className="mb-4 font-display text-lg font-bold text-accent-cyan">
          Episode Directory
        </h2>

        {episodes.length === 0 ? (
          <EmptyState
            message="No transcripts available yet"
            suggestion="Transcripts will appear here once episodes are processed"
          />
        ) : (
          <>
            <div className="space-y-2">
              {episodes.map((ep) => (
                <Link
                  key={ep.id}
                  href={`/episodes/${ep.slug}?tab=transcript`}
                  className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-cyan/40 hover:bg-elevated"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-12 items-center justify-center rounded bg-accent-gold/10 font-mono text-xs font-bold text-accent-gold-text">
                      {ep.episodeNumber != null ? `#${ep.episodeNumber}` : "—"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors line-clamp-1">
                        {ep.title}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusBadge label={`${ep.segmentCount} seg`} variant="cyan" />
                        {ep.duration && (
                          <StatusBadge label={formatDuration(ep.duration)} variant="muted" />
                        )}
                        {ep.speakers.slice(0, 3).map((speaker) => (
                          <StatusBadge key={speaker} label={speaker} variant="gold" />
                        ))}
                        {ep.speakers.length > 3 && (
                          <StatusBadge label={`+${ep.speakers.length - 3}`} variant="muted" />
                        )}
                      </div>
                    </div>
                    <span className="hidden sm:block font-mono text-[12px] text-text-muted whitespace-nowrap">
                      {formatDate(ep.airDate)}
                    </span>
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

// ── Search box ────────────────────────────────────────────────────
function TranscriptSearchBox({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/transcripts" method="get">
      <div className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search by keyword, name, or phrase..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/30"
        />
        <button
          type="submit"
          className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-cyan transition-colors hover:bg-accent-cyan/20"
        >
          Search
        </button>
      </div>
    </form>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 text-center">
      <span className="text-lg">{icon}</span>
      <p className="mt-1 font-mono text-lg font-bold text-accent-cyan">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="font-mono text-[12px] text-text-muted uppercase tracking-wider">{label}</p>
    </div>
  );
}
