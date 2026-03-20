import { notFound } from "next/navigation";
import { getEpisodeBySlug, getRelatedEpisodes } from "@/lib/queries/episodes";
import { getCurrentUser } from "@/lib/auth";
import { getReactionCounts } from "@/lib/queries/reactions";
import { getCommentsForEpisode } from "@/lib/queries/comments";
import { CommentSection } from "@/components/episodes/comment-section";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EpisodeHero } from "@/components/episodes/episode-hero";
import { EpisodeGlanceBar } from "@/components/episodes/episode-glance-bar";
import { SectionCard } from "@/components/ui/section-card";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { YouTubeEmbed } from "@/components/media/youtube-embed";
import { TranscriptViewer } from "@/components/media/transcript-viewer";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { ReactionBar } from "@/components/episodes/reaction-bar";
import { EpisodeStatsPanel } from "@/components/episodes/episode-stats-panel";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { RandomEpisodeButton } from "@/components/archive/random-episode-button";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) {
    return buildMetadata({
      title: "Episode Not Found",
      description: "This episode could not be found.",
      path: `/episodes/${slug}`,
    });
  }

  return buildMetadata({
    title: episode.title,
    description: episode.summaryShort || episode.searchText || null,
    path: `/episodes/${episode.slug}`,
  });
}

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const relatedEpisodes = await getRelatedEpisodes(episode.id, { limit: 6 });

  const user = await getCurrentUser();
  const reactionCounts = await getReactionCounts(episode.id, user?.id);
  const commentsData = await getCommentsForEpisode(episode.id, { take: 20 });

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <>
    {episode.series && (
      <nav className="mx-auto max-w-7xl px-4 pt-4">
        <ol className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <li><Link href="/series" className="hover:text-accent-green transition-colors">Series</Link></li>
          <li>/</li>
          <li><Link href={`/series/${episode.series.slug}`} className="hover:text-accent-green transition-colors">{episode.series.title}</Link></li>
          <li>/</li>
          <li className="text-text-primary">{epNum ?? episode.title}</li>
        </ol>
      </nav>
    )}
    <EpisodeHero
      title={episode.title}
      subtitle={episode.summaryShort ?? ""}
      thumbnailUrl={episode.thumbnailUrl}
      episodeNumber={episode.episodeNumber}
      contentType={episode.contentType}
      series={episode.series ? { title: episode.series.title, slug: episode.series.slug } : null}
    />
    <Breadcrumbs items={[
      { label: "Home", href: "/" },
      { label: "Episodes", href: "/episodes" },
      { label: episode.title },
    ]} />
    <EpisodeGlanceBar
      contentType={episode.contentType}
      series={episode.series ? { title: episode.series.title, slug: episode.series.slug } : null}
      airDate={episode.airDate}
      duration={episode.duration}
      guestCount={episode.guests.length}
    />
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video embed */}
          {episode.youtubeVideoId && (
            <YouTubeEmbed
              videoId={episode.youtubeVideoId}
              title={episode.title}
            />
          )}

          {/* Watch on YouTube CTA */}
          {episode.youtubeVideoId && (
            <a
              href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 font-mono text-xs text-red-400 transition hover:bg-red-500/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/><path fill="#fff" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              Watch on YouTube
            </a>
          )}

          {/* Reactions */}
          <ReactionBar
            slug={episode.slug}
            initialCounts={reactionCounts}
            isAuthenticated={!!user}
          />

          {/* Short synopsis */}
          {episode.summaryShort && (
            <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-4">
              <p className="text-sm text-text-primary leading-relaxed font-medium">
                {episode.summaryShort}
              </p>
            </div>
          )}

          {/* Summary */}
          {episode.summaryLong && (
            <SectionCard title="Summary">
              <p className="text-sm text-text-primary leading-relaxed">
                {episode.summaryLong}
              </p>
            </SectionCard>
          )}

          {/* Transcript segments */}
          {episode.segments.length > 0 && (
            <TerminalPanel header="TRANSCRIPT">
              <TranscriptViewer
                segments={episode.segments}
                hasVideoEmbed={!!episode.youtubeVideoId}
              />
            </TerminalPanel>
          )}

          {/* Quotes */}
          {episode.quotes.length > 0 && (
            <SectionCard title="Notable Quotes">
              <div className="space-y-4">
                {episode.quotes.map((q) => (
                  <QuoteHighlightCard
                    key={q.id}
                    id={q.id}
                    text={q.text}
                    speakerName={q.speaker?.displayName}
                    speakerAvatarUrl={q.speaker?.avatarUrl}
                    timestampSeconds={q.timestampSeconds}
                  />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Related episodes */}
          {relatedEpisodes.length > 0 && (
            <section className="mt-8">
              <SectionCard title={`Related Episodes (${relatedEpisodes.length})`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedEpisodes.map((ep) => (
                    <EpisodeListItem
                      key={ep.id}
                      slug={ep.slug}
                      title={ep.title}
                      episodeNumber={ep.episodeNumber}
                      airDate={ep.airDate}
                      summaryShort={ep.summaryShort}
                    />
                  ))}
                </div>
              </SectionCard>
            </section>
          )}

          <div className="mt-4 flex justify-center">
            <RandomEpisodeButton />
          </div>

          {/* Comments */}
          <SectionCard title={`Comments (${commentsData.totalCount})`}>
            <CommentSection
              slug={episode.slug}
              initialComments={JSON.parse(JSON.stringify(commentsData.comments))}
              initialTotalCount={commentsData.totalCount}
              isAuthenticated={!!user}
              currentUserId={user?.id}
            />
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta */}
          <SectionCard title="Metadata">
            <div className="space-y-0">
              {epNum && <MetaRow label="Episode" value={epNum} />}
              <MetaRow label="Aired" value={formatDate(episode.airDate)} />
              <MetaRow label="Duration" value={formatDuration(episode.duration)} />
              <MetaRow
                label="Status"
                value={<StatusBadge label={episode.status} variant="green" />}
              />
              {episode.contentType && episode.contentType !== "original" && (
                <MetaRow
                  label="Type"
                  value={
                    <StatusBadge
                      label={episode.contentType.toUpperCase()}
                      variant={episode.contentType === "livestream" ? "purple" : "muted"}
                    />
                  }
                />
              )}
              {episode.series && (
                <MetaRow label="Series" value={episode.series.title} />
              )}
            </div>
          </SectionCard>

          {/* Stats */}
          <EpisodeStatsPanel
            guestCount={episode.guests.length}
            quoteCount={episode.quotes.length}
            segmentCount={episode.segments.length}
            reactionTotal={reactionCounts.fire + reactionCounts.eye + reactionCounts.moon + reactionCounts.skull + reactionCounts.wildcard}
            commentCount={commentsData.totalCount}
          />

          {/* Guests */}
          <GuestGrid
            guests={episode.guests.map((g) => ({
              displayName: g.person.displayName,
              slug: g.person.slug,
              avatarUrl: g.person.avatarUrl,
            }))}
          />

          {/* Topics */}
          <SectionCard>
            <EntityChipList
              title="Topics"
              entities={episode.topics.map((t) => ({
                label: t.topic.title,
                slug: t.topic.slug,
                type: "topic" as const,
              }))}
            />
          </SectionCard>

          {/* Lore */}
          <SectionCard>
            <EntityChipList
              title="Lore"
              entities={episode.loreEntries.map((l) => ({
                label: l.loreEntry.title,
                slug: l.loreEntry.slug,
                type: "lore" as const,
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </main>
    </>
  );
}
