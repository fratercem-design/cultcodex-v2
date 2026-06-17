import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getEpisodeBySlug,
  getRelatedEpisodes,
  getEpisodeNeighborsInEra,
} from "@/lib/queries/episodes";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getReactionCounts } from "@/lib/queries/reactions";
import { getEraForEpisode } from "@/lib/eras";
import { EraNeighbors } from "@/components/episodes/era-neighbors";
import { getCommentsForEpisode } from "@/lib/queries/comments";
import { CommentSection } from "@/components/episodes/comment-section";
import { buildMetadata, episodeJsonLd, jsonLdScript, detailBreadcrumbJsonLd } from "@/lib/seo";
import { AiNotice } from "@/components/ui/ai-notice";
import { getConfidenceTier } from "@/lib/format/confidence-tier";
import { renderWithTimestamps } from "@/lib/format/render-timestamps";
import { HumanReviewBadge } from "@/components/ui/human-review-badge";
import { SplitSummaryCard } from "@/components/episodes/split-summary";
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
import { PaywallGate } from "@/components/subscription/paywall-gate";
import { isSubscribed } from "@/lib/subscription";
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
import { DecodeModePanel } from "@/components/episodes/decode-mode-panel";
import { WhatYouMissed } from "@/components/episodes/what-you-missed";
import { TranscriptNotify } from "@/components/episodes/transcript-notify";
import { EpisodeCrossRef } from "@/components/episodes/episode-cross-ref";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { RandomEpisodeButton } from "@/components/archive/random-episode-button";
import { TranscriptBadge } from "@/components/ui/transcript-badge";
import { ProvenanceBadge } from "@/components/ui/provenance-badge";
import { SuggestCorrection } from "@/components/ui/suggest-correction";
import { AnnotationSection } from "@/components/annotations/annotation-section";
import { DataQualityBadge } from "@/components/ui/data-quality-badge";
import { ColorLegend } from "@/components/ui/color-legend";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
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
    image: episode.thumbnailUrl ?? null,
  });
}

export default async function EpisodeDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const initialTimestamp = sp.t ? parseInt(sp.t, 10) : undefined;
  const episode = await getEpisodeBySlug(slug).catch(() => null);

  if (!episode) notFound();

  const [relatedEpisodes, user] = await Promise.all([
    getRelatedEpisodes(episode.id, { limit: 6 }).catch(() => []),
    getCurrentUser(),
  ]);

  const favoriteData = user
    ? await prisma.favorite.findUnique({
        where: { userId_episodeId: { userId: user.id, episodeId: episode.id } },
      }).catch(() => null)
    : null;
  const favoriteCount = await prisma.favorite.count({
    where: { episodeId: episode.id },
  }).catch(() => 0);

  const [reactionCounts, commentsData] = await Promise.all([
    getReactionCounts(episode.id, user?.id).catch(() => ({ fire: 0, eye: 0, moon: 0, skull: 0, wildcard: 0, userReactions: [] as string[] })),
    getCommentsForEpisode(episode.id, { take: 20 }).catch(() => ({ comments: [], totalCount: 0 })),
  ]);

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const hasTranscript = episode.segments.length > 0;
  const confidenceTier = getConfidenceTier(episode.segments.length, !!episode.summaryLong);
  const hasTranscriptAccess = user ? await isSubscribed(user.id).catch(() => false) : false;
  const hasDecodeAccess = hasTranscriptAccess; // same tier — Initiate+
  const hasDecodeData = !!episode.decodeData;

  // Signal/Noise map — only exposed to subscribers
  const signalMap =
    hasTranscriptAccess && episode.decodeData
      ? ((episode.decodeData as Record<string, unknown>).signal_noise as Record<string, "signal" | "noise" | "neutral"> | undefined)
      : undefined;

  // Separate hosts from actual guests — hosts should not appear in the guest list
  const actualGuests = episode.guests.filter(
    (g) => g.person.personType !== "host"
  );
  const hostGuests = episode.guests.filter(
    (g) => g.person.personType === "host"
  );

  // Era resolution — derived from airDate via static era config.
  const era = getEraForEpisode(episode.airDate);

  // Era neighbors (prev/next published episode within the same date range).
  const eraNeighbors =
    era && episode.airDate
      ? await getEpisodeNeighborsInEra({
          episodeId: episode.id,
          airDate: episode.airDate,
          eraDateStart: new Date(era.dateStart),
          eraDateEnd: era.dateEnd ? new Date(era.dateEnd) : null,
        }).catch(() => ({ previous: null, next: null }))
      : { previous: null, next: null };

  // Guest archetypes — soft-linked via personSlug on PsychenomiconEntity.
  // Used to annotate each guest in the grid with their primary archetype.
  const guestSlugs = actualGuests.map((g) => g.person.slug);
  const guestArchetypes = new Map<string, string>();
  if (guestSlugs.length > 0) {
    const entities = await prisma.psychenomiconEntity.findMany({
      where: { personSlug: { in: guestSlugs }, primaryArchetype: { not: null } },
      select: { personSlug: true, primaryArchetype: true },
    }).catch(() => []);
    for (const e of entities) {
      if (e.personSlug && e.primaryArchetype) {
        // Keep only the first canonical token of compound archetypes
        // (e.g. "Mirror/Gravity" → "Mirror") so the chip stays short.
        const firstToken = e.primaryArchetype.split(/[/&,|]| — |\s+and\s+/i)[0].trim();
        guestArchetypes.set(e.personSlug, firstToken || e.primaryArchetype);
      }
    }
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    ...(hasTranscript
      ? [{ id: "transcript", label: "Transcript", count: episode.segments.length }]
      : []),
    { id: "decode", label: "Decode", locked: !hasDecodeAccess },
    { id: "quotes", label: "Quotes", count: episode.quotes.length },
    // Only show Discussion tab if there are comments or user is logged in
    ...(commentsData.totalCount > 0 || user
      ? [{ id: "discussion", label: "Discussion", count: commentsData.totalCount }]
      : []),
  ];

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdScript(
          episodeJsonLd({
            title: cleanTitle(episode.title),
            slug: episode.slug,
            description: episode.summaryShort ?? episode.summaryLong ?? null,
            airDate: episode.airDate,
            thumbnailUrl: episode.thumbnailUrl,
            youtubeVideoId: episode.youtubeVideoId,
            duration: episode.duration,
          })
        ),
      }}
    />
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLdScript(
          detailBreadcrumbJsonLd(
            { name: "Archive", path: "/episodes" },
            { name: cleanTitle(episode.title), path: `/episodes/${episode.slug}` }
          )
        ),
      }}
    />
    {episode.series && (
      <nav className="mx-auto max-w-7xl px-4 pt-4">
        <ol className="flex items-center gap-2 font-mono text-xs text-text-muted">
          <li><Link href="/series" className="hover:text-accent-cyan transition-colors">Series</Link></li>
          <li>/</li>
          <li><Link href={`/series/${episode.series.slug}`} className="hover:text-accent-cyan transition-colors">{episode.series.title}</Link></li>
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
      era={
        era
          ? { id: era.id, label: era.label, sigil: era.sigil, color: era.color }
          : null
      }
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

          {/* Rumble embed — show when no YouTube available */}
          {episode.rumbleVideoId && (!episode.youtubeVideoId || episode.status === "unavailable") && (
            <div className="relative w-full overflow-hidden rounded-lg border border-emerald-500/20 bg-void aspect-video">
              <iframe
                src={`https://rumble.com/embed/${episode.rumbleVideoId}/`}
                title={episode.title}
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          )}

          {/* Unavailable notice — only if NO playable source exists */}
          {episode.status === "unavailable" && !episode.rumbleVideoId && (
            <div className="relative w-full overflow-hidden rounded-lg border border-amber-500/30 bg-amber-500/5 aspect-video flex flex-col items-center justify-center gap-3 text-center px-6">
              <svg className="h-10 w-10 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <p className="font-mono text-sm text-amber-400">Video unavailable</p>
              <p className="font-mono text-[11px] text-text-muted">This episode&apos;s video has been privatized or removed. Browse the transcript, quotes, and metadata below.</p>
            </div>
          )}

          {/* No media at all — archive stub */}
          {!episode.youtubeVideoId && !episode.rumbleVideoId && episode.status !== "unavailable" && (
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-surface aspect-video flex flex-col items-center justify-center gap-3 text-center px-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-gold/10">
                <span className="text-2xl">📼</span>
              </div>
              <p className="font-mono text-sm text-text-muted">No video linked yet</p>
              <p className="font-mono text-[10px] text-text-muted">This episode is archived from metadata. Check the transcript, summary, and quotes below.</p>
            </div>
          )}

          {/* Watch externally CTAs */}
          <div className="flex flex-wrap gap-2">
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
          </div>

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

          {/* What You Missed */}
          <WhatYouMissed
            decodeData={hasDecodeData ? (episode.decodeData as Parameters<typeof WhatYouMissed>[0]["decodeData"]) : null}
            isUnlocked={hasDecodeAccess}
            isAuthenticated={!!user}
            episodeSlug={episode.slug}
          />

          {/* Tab layout */}
          <Suspense fallback={<div className="h-40" />}>
            <EpisodeTabLayout tabs={tabs}>
              {{
                overview: (
                  <div className="space-y-6">
                    {/* Summary — split view (new) or legacy single-blob (old) */}
                    {episode.summaryFacts ? (
                      <SplitSummaryCard
                        summaryFacts={episode.summaryFacts}
                        summaryThemes={episode.summaryThemes}
                        youtubeVideoId={episode.youtubeVideoId}
                        confidenceTier={confidenceTier}
                        isHumanReviewed={episode.isHumanReviewed}
                        humanReviewedAt={episode.humanReviewedAt}
                      />
                    ) : episode.summaryLong ? (
                      <SectionCard title="Summary">
                        <p className="text-sm text-text-primary leading-relaxed">
                          {renderWithTimestamps(episode.summaryLong, episode.youtubeVideoId)}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {episode.isHumanReviewed && (
                            <HumanReviewBadge reviewedAt={episode.humanReviewedAt} variant="full" />
                          )}
                          <AiNotice tier={confidenceTier} />
                        </div>
                      </SectionCard>
                    ) : null}

                    {/* Guests (inline for mobile) — hosts filtered out */}
                    {actualGuests.length > 0 && (
                      <SectionCard title={`Guests (${actualGuests.length})`} accent="gold">
                        <div className="flex flex-wrap gap-1.5">
                          {actualGuests.map((g) => (
                            <Link
                              key={g.person.slug}
                              href={`/people/${g.person.slug}`}
                              className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-gold/30 hover:text-accent-gold transition-colors"
                            >
                              {g.person.displayName}
                            </Link>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Topics (inline for mobile) */}
                    {episode.topics.length > 0 && (
                      <SectionCard title={`Topics (${episode.topics.length})`} accent="cyan">
                        <div className="flex flex-wrap gap-1.5">
                          {episode.topics.map((t) => (
                            <Link
                              key={t.topic.slug}
                              href={`/topics/${t.topic.slug}`}
                              className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors"
                            >
                              {t.topic.title}
                            </Link>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* Transcript status — show when no transcript */}
                    {!hasTranscript && (
                      <SectionCard title="Transcript">
                        <div className="flex items-center gap-3 py-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border">
                            <span className="font-mono text-[10px] text-text-muted">░░░</span>
                          </div>
                          <div>
                            <p className="font-mono text-xs text-text-muted">No transcript available</p>
                            <p className="font-mono text-[10px] text-text-muted mt-0.5">
                              {episode.youtubeVideoId
                                ? "Auto-captions may be disabled for this video"
                                : "No video source linked to extract captions from"}
                            </p>
                          </div>
                        </div>
                        <TranscriptNotify episodeSlug={episode.slug} />
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

                    {/* Go Deeper — topic rabbit holes */}
                    {(() => {
                      const topicsWithDesc = episode.topics
                        .filter((t) => t.topic.description && t.topic.description.length > 20)
                        .slice(0, 3);
                      if (topicsWithDesc.length === 0) return null;
                      return (
                        <SectionCard title="🐇 Go Deeper">
                          <p className="text-xs text-text-muted mb-4">
                            Explore the ideas at the heart of this episode
                          </p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {topicsWithDesc.map(({ topic: t }) => {
                              const desc = t.description!.split("\n\n")[0];
                              return (
                                <Link
                                  key={t.slug}
                                  href={`/topics/${t.slug}`}
                                  className="group flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3 transition-all hover:border-accent-cyan/30 hover:bg-elevated"
                                >
                                  <span className="font-mono text-xs font-semibold text-accent-cyan group-hover:underline line-clamp-1">
                                    {t.title}
                                  </span>
                                  <span className="text-[11px] text-text-muted leading-relaxed line-clamp-3">
                                    {desc}
                                  </span>
                                  <span className="mt-auto font-mono text-[10px] text-text-muted group-hover:text-accent-cyan transition-colors">
                                    Explore topic →
                                  </span>
                                </Link>
                              );
                            })}
                          </div>
                        </SectionCard>
                      );
                    })()}
                  </div>
                ),
                ...(hasTranscript ? {
                  transcript: hasTranscriptAccess ? (
                    <TerminalPanel header="TRANSCRIPT">
                      <TranscriptViewer
                        segments={episode.segments}
                        hasVideoEmbed={!!episode.youtubeVideoId}
                        initialTimestamp={initialTimestamp}
                        signalMap={signalMap}
                      />
                    </TerminalPanel>
                  ) : (
                    <TerminalPanel header="TRANSCRIPT">
                      <PaywallGate
                        previewSegments={episode.segments.slice(0, 5)}
                        totalCount={episode.segments.length}
                        isAuthenticated={!!user}
                      />
                    </TerminalPanel>
                  ),
                } : {}),
                decode: (
                  <DecodeModePanel
                    decodeData={hasDecodeData ? (episode.decodeData as Parameters<typeof DecodeModePanel>[0]["decodeData"]) : null}
                    isUnlocked={hasDecodeAccess}
                    isAuthenticated={!!user}
                  />
                ),
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
                          speakerSlug={q.speaker?.slug}
                          speakerType={q.speaker?.personType}
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
                  <div className="space-y-6">
                    <SectionCard title={`Comments (${commentsData.totalCount})`}>
                      <CommentSection
                        slug={episode.slug}
                        initialComments={JSON.parse(JSON.stringify(commentsData.comments))}
                        initialTotalCount={commentsData.totalCount}
                        isAuthenticated={!!user}
                        currentUserId={user?.id}
                      />
                    </SectionCard>
                    <SectionCard title="Community Annotations">
                      <AnnotationSection
                        targetType="episode"
                        targetId={episode.slug}
                        returnPath={`/episodes/${episode.slug}`}
                        label="Connections, corrections, and context added by Initiate+ members."
                      />
                    </SectionCard>
                  </div>
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
              <MetaRow
                label="Data"
                value={
                  <DataQualityBadge
                    hasSummary={!!episode.summaryLong}
                    hasTranscript={hasTranscript}
                    guestCount={actualGuests.length}
                    topicCount={episode.topics.length}
                    quoteCount={episode.quotes.length}
                    loreCount={episode.loreEntries.length}
                    hasAirDate={!!episode.airDate}
                    hasDuration={!!episode.duration}
                  />
                }
              />
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

          {/* Color legend */}
          <ColorLegend />

          {/* Upgrade CTA — only for non-subscribers */}
          {!hasTranscriptAccess && (
            <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-5 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold">{"/// initiate_layer"}</p>
              <p className="font-mono text-xs font-bold text-accent-gold">Observers see the surface.</p>
              <ul className="space-y-1.5">
                {[
                  "Full searchable transcript",
                  "Decode Mode — AI analysis",
                  "Jump to any timestamp",
                  "Pattern search across all episodes",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 font-mono text-[10px] text-text-muted">
                    <span className="text-accent-gold mt-0.5">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/premium"
                className="block w-full rounded-lg border border-accent-gold bg-accent-gold/15 px-4 py-2.5 text-center font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
              >
                Become Initiate+ — $10/mo
              </Link>
            </div>
          )}

          {/* Guests — hosts filtered out */}
          <GuestGrid
            guests={actualGuests.map((g) => ({
              displayName: g.person.displayName,
              slug: g.person.slug,
              avatarUrl: g.person.avatarUrl,
              personType: g.person.personType,
            }))}
            archetypes={guestArchetypes}
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

          {/* Era neighbors — prev/next published episode within the same era */}
          {era && (eraNeighbors.previous || eraNeighbors.next) && (
            <EraNeighbors
              era={{ id: era.id, label: era.label, sigil: era.sigil, color: era.color }}
              previous={eraNeighbors.previous}
              next={eraNeighbors.next}
            />
          )}

          {/* Semantic cross-references — related moments from other episodes */}
          {(episode.summaryShort || episode.topics.length > 0) && (
            <Suspense fallback={null}>
              <EpisodeCrossRef
                episodeId={episode.id}
                concept={
                  episode.summaryShort ||
                  [episode.title, episode.topics[0]?.topic.title]
                    .filter(Boolean)
                    .join(" — ")
                }
              />
            </Suspense>
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
        __html: jsonLdScript({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: episode.title,
          description: episode.summaryShort ?? episode.title,
          thumbnailUrl: episode.thumbnailUrl ?? undefined,
          uploadDate: episode.airDate?.toISOString(),
          url: `https://cultcodex.me/episodes/${episode.slug}`,
          ...(episode.youtubeVideoId && {
            contentUrl: `https://www.youtube.com/watch?v=${episode.youtubeVideoId}`,
            // embedUrl lets Google render a video card in search results
            embedUrl: `https://www.youtube.com/embed/${episode.youtubeVideoId}`,
          }),
          // Convert stored "h:mm:ss" / "m:ss" to ISO 8601 duration for rich results
          ...(episode.duration && (() => {
            const parts = episode.duration!.split(":").map(Number);
            if (parts.length === 3) {
              const [h, m, s] = parts;
              return { duration: `PT${h}H${m}M${s}S` };
            }
            if (parts.length === 2) {
              const [m, s] = parts;
              return { duration: `PT${m}M${s}S` };
            }
            return {};
          })()),
        }),
      }}
    />
    </>
  );
}
