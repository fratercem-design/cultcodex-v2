import { notFound } from "next/navigation";
import Link from "next/link";
import { getLoreBySlug } from "@/lib/queries/lore";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

export const revalidate = 600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) {
    return buildMetadata({
      title: "Lore Entry Not Found",
      description: "This lore entry could not be found.",
      path: `/lore/${slug}`,
    });
  }

  return buildMetadata({
    title: entry.title,
    description: entry.summary || entry.searchText || null,
    path: `/lore/${entry.slug}`,
  });
}

const CANON_VARIANTS: Record<string, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
};

export default async function LoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) notFound();

  const canonLabel = entry.canonStatus.replace("_", " ");
  const canonVariant = CANON_VARIANTS[entry.canonStatus] ?? "muted";

  // Collect related lore entries (deduplicated)
  const relatedLore = Array.from(
    new Map([
      ...entry.relatedFrom.map((r) => [r.loreB.id, r.loreB] as const),
      ...entry.relatedTo.map((r) => [r.loreA.id, r.loreA] as const),
    ]).values()
  );

  const glanceItems = [
    { icon: "\uD83D\uDCDC", label: canonLabel.charAt(0).toUpperCase() + canonLabel.slice(1) },
    ...(entry.category ? [{ icon: "\uD83D\uDCC2", label: entry.category }] : []),
    ...(entry.firstMentionEpisode?.airDate
      ? [{ icon: "\uD83D\uDCC5", label: `First mention ${formatDate(entry.firstMentionEpisode.airDate)}` }]
      : []),
    ...(entry.episodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${entry.episodes.length} episode${entry.episodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(entry.people.length > 0
      ? [{ icon: "\uD83D\uDC64", label: `${entry.people.length} ${entry.people.length !== 1 ? "people" : "person"}` }]
      : []),
    ...(entry.topics.length > 0
      ? [{ icon: "\uD83C\uDFF7\uFE0F", label: `${entry.topics.length} topic${entry.topics.length !== 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={entry.title}
        subtitle={entry.category ?? undefined}
        backgroundImage="/lore-header.jpg"
        badges={[{ label: canonLabel.toUpperCase(), variant: canonVariant }]}
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Lore", href: "/lore" },
        { label: entry.title },
      ]} />
      <EntityGlanceBar items={glanceItems} />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {entry.summary && (
              <SectionCard title="Summary">
                <p className="text-sm text-text-primary leading-relaxed">
                  {entry.summary}
                </p>
              </SectionCard>
            )}

            {entry.fullEntry && (
              <SectionCard title="Full Entry">
                <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                  {entry.fullEntry}
                </div>
              </SectionCard>
            )}

            {/* Episode appearances */}
            {entry.episodes.length > 0 && (
              <SectionCard title={`Episodes (${entry.episodes.length})`}>
                <div className="grid gap-3">
                  {entry.episodes.map((e) => (
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
              </SectionCard>
            )}

            {/* Related lore */}
            {relatedLore.length > 0 && (
              <SectionCard title={`Related Lore (${relatedLore.length})`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedLore.map((lore) => (
                    <Link
                      key={lore.id}
                      href={`/lore/${lore.slug}`}
                      className="group block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge
                          label={lore.canonStatus.replace("_", " ")}
                          variant={CANON_VARIANTS[lore.canonStatus] ?? "muted"}
                        />
                      </div>
                      <h4 className="text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
                        {lore.title}
                      </h4>
                      {lore.summary && (
                        <p className="mt-1 text-xs text-text-muted line-clamp-2">
                          {lore.summary}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFAC", label: "Episodes", value: entry.episodes.length },
                { icon: "\uD83D\uDC64", label: "People", value: entry.people.length },
                { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: entry.topics.length },
                { icon: "\uD83D\uDD17", label: "Related Lore", value: relatedLore.length },
              ]}
            />

            <SectionCard title="Classification">
              <MetaRow
                label="Canon Status"
                value={<StatusBadge label={canonLabel} variant={canonVariant} />}
              />
              {entry.category && <MetaRow label="Category" value={entry.category} />}
              {entry.firstMentionEpisode && (
                <MetaRow
                  label="First Mention"
                  value={formatDate(entry.firstMentionEpisode.airDate)}
                />
              )}
            </SectionCard>

            {/* People — avatar grid */}
            <GuestGrid
              guests={entry.people.map((p) => ({
                displayName: p.person.displayName,
                slug: p.person.slug,
                avatarUrl: p.person.avatarUrl,
              }))}
            />

            <SectionCard>
              <EntityChipList
                title="Topics"
                entities={entry.topics.map((t) => ({
                  label: t.topic.title,
                  slug: t.topic.slug,
                  type: "topic",
                }))}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
