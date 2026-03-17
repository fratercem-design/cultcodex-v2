import { notFound } from "next/navigation";
import Link from "next/link";
import { getPersonBySlug } from "@/lib/queries/people";
import { buildMetadata } from "@/lib/seo";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { QuoteHighlightCard } from "@/components/episodes/quote-highlight-card";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) {
    return buildMetadata({
      title: "Person Not Found",
      description: "This person could not be found.",
      path: `/people/${slug}`,
    });
  }

  return buildMetadata({
    title: person.displayName,
    description: person.shortBio || person.searchText || null,
    path: `/people/${person.slug}`,
  });
}

const PERSON_TYPE_LABELS: Record<string, string> = {
  host: "Host",
  recurring_guest: "Recurring Guest",
  guest: "Guest",
  mentioned: "Mentioned",
};

const PERSON_TYPE_VARIANTS: Record<string, "green" | "purple" | "gold" | "muted"> = {
  host: "green",
  recurring_guest: "purple",
  guest: "muted",
  mentioned: "muted",
};

export default async function PersonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) notFound();

  const allEpisodes = [
    ...person.guestAppearances.map((g) => g.episode),
    ...person.mentions.map((m) => m.episode),
  ];

  // Deduplicate by id and sort newest first
  const uniqueEpisodes = Array.from(
    new Map(allEpisodes.map((e) => [e.id, e])).values()
  ).sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0));

  const typeLabel = PERSON_TYPE_LABELS[person.personType] ?? person.personType;
  const typeVariant = PERSON_TYPE_VARIANTS[person.personType] ?? "muted";

  const glanceItems = [
    { icon: "\uD83C\uDFAD", label: typeLabel },
    ...(uniqueEpisodes.length > 0
      ? [{ icon: "\uD83C\uDFAC", label: `${uniqueEpisodes.length} appearance${uniqueEpisodes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.quotes.length > 0
      ? [{ icon: "\uD83D\uDCAC", label: `${person.quotes.length} quote${person.quotes.length !== 1 ? "s" : ""}` }]
      : []),
    ...(person.firstAppearanceEpisode?.airDate
      ? [{ icon: "\uD83D\uDCC5", label: `First seen ${formatDate(person.firstAppearanceEpisode.airDate)}` }]
      : []),
    ...(person.topics.length > 0
      ? [{ icon: "\uD83C\uDFF7\uFE0F", label: `${person.topics.length} topic${person.topics.length !== 1 ? "s" : ""}` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={person.displayName}
        subtitle={person.shortBio ?? undefined}
        backgroundImage="/wiki-page-header.jpg"
        avatarUrl={person.avatarUrl}
        badges={[{ label: typeLabel, variant: typeVariant }]}
      />
      <EntityGlanceBar items={glanceItems} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / Lore Summary */}
            {person.loreSummary && (
              <SectionCard title="Lore Summary">
                <p className="text-sm text-text-primary leading-relaxed">
                  {person.loreSummary}
                </p>
              </SectionCard>
            )}

            {/* Appearances */}
            <SectionCard title={`Appearances (${uniqueEpisodes.length})`}>
              {uniqueEpisodes.length > 0 ? (
                <div className="grid gap-3">
                  {uniqueEpisodes.map((ep) => (
                    <EpisodeListItem
                      key={ep.id}
                      slug={ep.slug}
                      title={ep.title}
                      episodeNumber={ep.episodeNumber}
                      airDate={ep.airDate}
                      summaryShort={ep.summaryShort}
                      thumbnailUrl={ep.thumbnailUrl}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No appearances recorded</p>
              )}
            </SectionCard>

            {/* Quotes */}
            {person.quotes.length > 0 && (
              <SectionCard title={`Quotes (${person.quotes.length})`}>
                <div className="space-y-4">
                  {person.quotes.map((q) => (
                    <QuoteHighlightCard
                      key={q.id}
                      id={q.id}
                      text={q.text}
                      speakerName={person.displayName}
                      speakerAvatarUrl={person.avatarUrl}
                      timestampSeconds={q.timestampSeconds}
                    />
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "\uD83C\uDFA4", label: "Appearances", value: person.guestAppearances.length },
                { icon: "\uD83D\uDCE2", label: "Mentions", value: person.mentions.length },
                { icon: "\uD83D\uDCAC", label: "Quotes", value: person.quotes.length },
                { icon: "\uD83C\uDFF7\uFE0F", label: "Topics", value: person.topics.length },
                { icon: "\uD83D\uDD17", label: "Lore Links", value: person.loreConnections.length },
              ]}
            />

            <SectionCard title="Dossier">
              <MetaRow
                label="Type"
                value={<StatusBadge label={typeLabel} variant={typeVariant} />}
              />
              {person.firstAppearanceEpisode && (
                <MetaRow
                  label="First Seen"
                  value={formatDate(person.firstAppearanceEpisode.airDate)}
                />
              )}
              {person.altNames.length > 0 && (
                <MetaRow label="Also Known As" value={person.altNames.join(", ")} />
              )}
            </SectionCard>

            <SectionCard>
              <EntityChipList
                title="Topics"
                entities={person.topics.map((t) => ({
                  label: t.topic.title,
                  slug: t.topic.slug,
                  type: "topic",
                }))}
              />
            </SectionCard>

            <SectionCard>
              <EntityChipList
                title="Lore Connections"
                entities={person.loreConnections.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}
