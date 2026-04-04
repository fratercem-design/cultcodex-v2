import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/queries/topics";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SuggestCorrection } from "@/components/ui/suggest-correction";
import type { Metadata } from "next";

export const revalidate = 600;

export async function generateStaticParams() {
  const topics = await prisma.topic.findMany({
    select: { slug: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
  });
  return topics.map((t) => ({ slug: t.slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) {
    return buildMetadata({
      title: "Topic Not Found",
      description: "This topic could not be found.",
      path: `/topics/${slug}`,
    });
  }

  return buildMetadata({
    title: topic.title,
    description: topic.description || null,
    path: `/topics/${topic.slug}`,
  });
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);

  if (!topic) notFound();

  const glanceItems = [
    ...(topic.episodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${topic.episodes.length} episode${topic.episodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(topic.people.length > 0
      ? [{ icon: "\uD83D\uDC64", label: `${topic.people.length} ${topic.people.length !== 1 ? "people" : "person"}` }]
      : []),
    ...(topic.lore.length > 0
      ? [{ icon: "\uD83D\uDCDC", label: `${topic.lore.length} lore entr${topic.lore.length !== 1 ? "ies" : "y"}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={topic.title}
        subtitle="Topic"
        backgroundImage="/wiki-page-header.jpg"
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Topics", href: "/topics" },
        { label: topic.title },
      ]} />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {topic.description && (
              <SectionCard title="Description">
                <p className="text-sm text-text-primary leading-relaxed">
                  {topic.description}
                </p>
              </SectionCard>
            )}

            <SectionCard title={`Episodes (${topic.episodes.length})`}>
              {topic.episodes.length > 0 ? (
                <div className="grid gap-3">
                  {topic.episodes.map((e) => (
                    <EpisodeListItem
                      key={e.episode.id}
                      slug={e.episode.slug}
                      title={e.episode.title}
                      episodeNumber={e.episode.episodeNumber}
                      airDate={e.episode.airDate}
                      summaryShort={e.episode.summaryShort}
                      thumbnailUrl={e.episode.thumbnailUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No episodes linked yet</p>
              )}
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: topic.episodes.length },
                { icon: "\uD83D\uDC64", label: "People", value: topic.people.length },
                { icon: "\uD83D\uDCDC", label: "Lore Entries", value: topic.lore.length },
              ]}
            />

            {/* People — avatar grid */}
            <GuestGrid
              guests={topic.people.map((p) => ({
                displayName: p.person.displayName,
                slug: p.person.slug,
                avatarUrl: p.person.avatarUrl,
              }))}
            />

            <SectionCard>
              <EntityChipList
                title="Lore"
                entities={topic.lore.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            </SectionCard>

            <SuggestCorrection
              entityType="topic"
              entityTitle={topic.title}
            />
          </div>
        </div>
      </main>
    </>
  );
}
