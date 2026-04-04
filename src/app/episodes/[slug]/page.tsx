import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getEpisodeBySlug, getRelatedEpisodes } from "@/lib/queries/episodes";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
import { ShareButtons } from "@/components/ui/share-buttons";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { EpisodeStatsPanel } from "@/components/episodes/episode-stats-panel";
import { EpisodeTabLayout } from "@/components/episodes/episode-tab-layout";
import { formatDate } from "@/lib/format/date";
import { cleanTitle } from "@/lib/format/text";
import { formatDuration } from "@/lib/format/duration";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { RandomEpisodeButton } from "@/components/archive/random-episode-button";
import { TranscriptBadge } from "@/components/ui/transcript-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { SuggestCorrection } from "@/components/ui/suggest-correction";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const episodes = await prisma.episode.findMany({
    where: {},
    select: { slug: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
  return episodes.map((ep) => ({ slug: ep.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; t?: string }>;
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

export default async function EpisodeDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialTimestamp = sp.t ? parseInt(sp.t, 10) : undefined;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const relatedEpisodes = await getRelatedEpisodes(episode.id, { limit: 6 });

  const user = await getCurrentUser();

  const favoriteData = user
    ? await prisma.favorite.findUnique({
        where: { userId_episodeId: { userId: user.id, episodeId: episode.id } },
      })
    : null;
  const favoriteCount = await prisma.favorite.count({
    where: { episodeId: episode.id },
  });

  const reactionCounts = await getReactionCounts(episode.id, user?.id);
  const commentsData = await getCommentsForEpisode(episode.id, { take: 20 });

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const hasTranscript = episode.segments.length > 0;

  // Separate hosts from actual guests — hosts should not appear in the guest list
  const actualGuests = episode.guests.filter(
    (g) => g.person.personType !== "host"
  );
  const hostGuests = episode.guests.filter(
    (g) => g.person.personType === "host"
  );

  const tabs = [
    { id: "overview", label: "Overview" },
    ...(hasTranscript
      ? [{ id: "transcript", label: "Transcript", count: episode.segments.length }]
      : []),
    { id: "quotes", label: "Quotes", count: episode.quotes.length },
    // Only show Discussion tab if there are comments or user is logged in
    ...(commentsData.totalCount > 0 || user
      ? [{ id: "discussion", label: "Discussion", count: commentsData.totalCount }]
      : []),
  ];

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
      title={cleanTitle(episode.title)}
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
      guestCount={actualGuests.length}
    />
    <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video embed */}
          {episode.youtubeVideoId && episode.status !== "unavailable" && (
            <YouTubeEmbed
              videoId={episode.youtubeVideoId}
              title={episode.title}
            />
          )}

          {/* Unavailable notice */}
          {episode.status === "unavailable" && (
            <div className="relative w-full overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5 aspect-video flex flex-col items-center justify-center gap-3 text-center px-6">
              <svg className="h-10 w-10 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p className="font-mono text-sm text-amber-400">This episode is no longer available on YouTube</p>
              <p className="font-mono text-[11px] text-text-muted">The video may have been privatized or removed by the creator.</p>
            </div>
          )}

          {/* Rumble embed — show when no YouTube available */}
          {episode.rumbleVideoId && !episode.youtubeVideoId && (
            <div className="relative w-full overflow-hidden rounded-lg border border-emerald-500/20 bg-void aspect-video">
              <iframe
                src={`https://rumble.com/embed/${episode.rumbleVideoId}/`}
                title={episode.title}
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}

          {/* Watch on YouTube CTA */}
          {episode.youtubeVideoId && episode.status !== "unavailable" && (
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

          {/* Watch on Rumble CTA */}
          {episode.rumbleVideoId && (
            <a
              href={`https://rumble.com/${episode.rumbleVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
              Watch on Rumble
            </a>
          )}

          {/* Reactions & Social */}
          <div className="flex items-center gap-2 flex-wrap">
            <ReactionBar
              slug={episode.slug}
              initialCounts={reactionCounts}
              isAuthenticated={!!user}
            />
            <FavoriteButton
              slug={episode.slug}
              initialFavorited={!!favoriteData}
              initialCount={favoriteCount}
              isAuthenticated={!!user}
            />
            <ShareButtons
              url={`/episodes/${episode.slug}`}
              title={episode.title}
              type="episode"
            />
            <SuggestCorrection
              entityType="episode"
              entityTitle={episode.title}
            />
          </div>

          {/* Tab layout */}
          <Suspense fallback={<div className="h-40" />}>
            <EpisodeTabLayout tabs={tabs}>
              {{
                overview: (
                  <div className="space-y-6">
                    {/* Summary */}
                    {episode.summaryLong && (
                      <SectionCard title="Summary">
                        <p className="text-sm text-text-primary leading-relaxed">
                          {episode.summaryLong}
                        </p>
                      </SectionCard>
                    )}

                    {/* Guests (inline for mobile) — hosts filtered out */}
                    {actualGuests.length > 0 && (
                      <SectionCard title={`Guests (${actualGuests.length})`}>
                        <div className="flex flex-wrap gap-1.5">
                          {actualGuests.map((g) => (
                            <Link
                              key={g.person.slug}
                              href={`/people/${g.person.slug}`}
                              className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-green/30 hover:text-accent-green transition-colors"
                            >
                              {g.person.displayName}
                            </Link>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Topics (inline for mobile) */}
                    {episode.topics.length > 0 && (
                      <SectionCard title={`Topics (${episode.topics.length})`}>
                        <div className="flex flex-wrap gap-1.5">
                          {episode.topics.map((t) => (
                            <Link
                              key={t.topic.slug}
                              href={`/topics/${t.topic.slug}`}
                              className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-green/30 hover:text-accent-green transition-colors"
                            >
                              {t.topic.title}
                            </Link>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Related episodes */}
                    {relatedEpisodes.length > 0 && (
                      <section>
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
                  </div>
                ),
                ...(hasTranscript ? {
                  transcript: (
                    <TerminalPanel header="TRANSCRIPT">
                      <TranscriptViewer
                        segments={episode.segments}
                        hasVideoEmbed={!!episode.youtubeVideoId}
                        initialTimestamp={initialTimestamp}
                      />
                    </TerminalPanel>
                  ),
                } : {}),
                quotes: (
                  <div className="space-y-4">
                    {episode.quotes.length > 0 ? (
                      episode.quotes.map((q) => (
                        <QuoteHighlightCard
                          key={q.id}
                          id={q.id}
                          text={q.text}
                          speakerName={q.speaker?.displayName}
                          speakerAvatarUrl={q.speaker?.avatarUrl}
                          timestampSeconds={q.timestampSeconds}
                        />
                      ))
                    ) : (
                      <p className="py-4 text-center font-mono text-xs text-text-muted">
                        No quotes extracted from this episode
                      </p>
                    )}
                  </div>
                ),
                discussion: (
                  <SectionCard title={`Comments (${commentsData.totalCount})`}>
                    <CommentSection
                      slug={episode.slug}
                      initialComments={JSON.parse(JSON.stringify(commentsData.comments))}
                      initialTotalCount={commentsData.totalCount}
                      isAuthenticated={!!user}
                      currentUserId={user?.id}
                    />
                  </SectionCard>
                ),
              }}
            </EpisodeTabLayout>
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta */}
          <SectionCard title="Metadata">
            <div className="space-y-0">
              {epNum && <MetaRow label="Episode" value={epNum} />}
              <MetaRow label="Aired" value={formatDate(episode.airDate)} />
              <MetaRow label="Duration" value={formatDuration(episode.duration)} />
              {/* Only show status when it's notable (not published) */}
              {episode.status !== "published" && (
                <MetaRow
                  label="Status"
                  value={<StatusBadge label={episode.status} variant={episode.status === "unavailable" ? "muted" : "green"} />}
                />
              )}
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
              <MetaRow
                label="Transcript"
                value={<TranscriptBadge segmentCount={episode.segments.length} />}
              />
              <MetaRow
                label="Source"
                value={
                  <ProvenanceBadge
                    hasTranscript={hasTranscript}
                    hasSummary={!!episode.summaryLong}
                  />
                }
              />
              {episode.series && (
                <MetaRow label="Series" value={episode.series.title} />
              )}
            </div>
          </SectionCard>

          {/* Stats */}
          <EpisodeStatsPanel
            guestCount={actualGuests.length}
            quoteCount={episode.quotes.length}
            segmentCount={episode.segments.length}
            reactionTotal={reactionCounts.fire + reactionCounts.eye + reactionCounts.moon + reactionCounts.skull + reactionCounts.wildcard}
            commentCount={commentsData.totalCount}
          />

          {/* Guests — hosts filtered out */}
          <GuestGrid
            guests={actualGuests.map((g) => ({
              displayName: g.person.displayName,
              slug: g.person.slug,
              avatarUrl: g.person.avatarUrl,
            }))}
          />

          {/* Topics */}
          {episode.topics.length > 0 && (
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
          )}

          {/* Lore */}
          {episode.loreEntries.length > 0 && (
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
          )}
        </div>
      </div>
    </main>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: episode.title,
          description: episode.summaryShort ?? episode.title,
          thumbnailUrl: episode.thumbnailUrl ?? undefined,
          uploadDate: episode.airDate?.toISOString(),
          url: `https://cultcodex.me/episodes/${episode.slug}`,
          ...(episode.youtubeVideoId && { contentUrl: `https://www.youtube.com/watch?v=${episode.youtubeVideoId}` }),
        }),
      }}
    />
    </>
  );
}
