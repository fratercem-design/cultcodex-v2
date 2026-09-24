import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug, getRelatedTopics } from "@/lib/queries/topics";
import { prisma } from "@/lib/db";
import { buildMetadata, jsonLdScript, breadcrumbListJsonLd, thinPageRobots } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
import { EntityHero } from "@/components/ui/entity-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EntityStatsPanel } from "@/components/ui/entity-stats-panel";
import { SectionCard } from "@/components/ui/section-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { EpisodeListItem } from "@/components/archive/episode-list-item";
import { GuestGrid } from "@/components/episodes/guest-grid";
import { SuggestCorrection } from "@/components/ui/suggest-correction";
import { SaveSignalButton } from "@/components/codex/save-signal-button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
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

  const epCount = topic._count.episodes;
  const peopleCount = topic._count.people;

  // Keyword-targeted title: lead with the topic term (what people actually
  // search), then add episode count + "Cult of Psyche" context for long-tail
  // and entity queries. Only append the qualifier when the title is short
  // enough to stay under ~60 chars once buildMetadata adds "— CultCodex".
  const title =
    epCount > 0 && topic.title.length <= 34
      ? `${topic.title} — ${epCount} Cult of Psyche Episode${epCount === 1 ? "" : "s"}`
      : topic.title;

  // Meta description: never lead with insider "In the Psycheverse:" lore.
  // Use the factual base of the description if it's substantial; otherwise
  // synthesize a search-intent sentence from the topic's real counts.
  const base = topic.description
    ? splitDescription(topic.description).base.replace(/\s+/g, " ").trim()
    : "";
  const synthesized =
    epCount > 0
      ? `Explore ${topic.title} across ${epCount} Cult of Psyche episode${epCount === 1 ? "" : "s"}${peopleCount > 0 ? ` and ${peopleCount} voice${peopleCount === 1 ? "" : "s"}` : ""} — full transcripts, guest discussions, lore, and related topics.`
      : `${topic.title} in the Cult of Psyche archive — transcripts, lore, related topics, and the people who keep returning to it.`;
  let description = base.length >= 60 ? base : synthesized;
  if (description.length > 160) description = `${description.slice(0, 157).trimEnd()}…`;

  return {
    ...buildMetadata({
      title,
      description,
      path: `/topics/${topic.slug}`,
    }),
    ...thinPageRobots(epCount),
  };
}

// Split a description into its factual part and "In the Psycheverse:" part
function splitDescription(description: string): { base: string; psycheverse: string | null } {
  const match = description.match(/^([\s\S]*?)(?:\n\n?)(In the Psycheverse:[\s\S]*)$/i);
  if (match) {
    return { base: match[1].trim(), psycheverse: match[2].trim() };
  }
  return { base: description.trim(), psycheverse: null };
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const topic = await getTopicBySlug(slug).catch(() => null);
  if (!topic) notFound();

  const user = await getCurrentUser();
  const [initialSaved, savedCount, relatedTopics] = await Promise.all([
    user
      ? prisma.savedTopic
          .findUnique({
            where: { userId_topicId: { userId: user.id, topicId: topic.id } },
          })
          .then((row) => !!row)
          .catch(() => false)
      : Promise.resolve(false),
    prisma.savedTopic.count({ where: { topicId: topic.id } }).catch(() => 0),
    getRelatedTopics(topic.id, 8).catch(() => []),
  ]);

  const { base: descBase, psycheverse: descPsycheverse } = topic.description
    ? splitDescription(topic.description)
    : { base: null, psycheverse: null };

  const sortedEpisodes = [...topic.episodes].sort(
    (a, b) => (b.episode.airDate?.getTime() ?? 0) - (a.episode.airDate?.getTime() ?? 0)
  );

  const glanceItems = [
    ...(topic._count.episodes > 0
      ? [{ icon: "🎬", label: `${topic._count.episodes} episode${topic._count.episodes !== 1 ? "s" : ""}` }]
      : []),
    ...(topic._count.people > 0
      ? [{ icon: "👤", label: `${topic._count.people} ${topic._count.people !== 1 ? "people" : "person"}` }]
      : []),
    ...(topic._count.lore > 0
      ? [{ icon: "📜", label: `${topic._count.lore} lore entr${topic._count.lore !== 1 ? "ies" : "y"}` }]
      : []),
    ...(relatedTopics.length > 0
      ? [{ icon: "🔗", label: `${relatedTopics.length} related topics` }]
      : []),
  ];

  return (
    <>
      <EntityHero
        title={topic.title}
        subtitle={descBase ?? "Topic"}
        backgroundImage="/wiki-page-header.jpg"
      label="signal"
      />
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: "Topics", href: "/topics" },
        { label: topic.title },
      ]} />
      <EntityGlanceBar items={glanceItems} />

      <div className="mx-auto max-w-7xl px-4 pt-3 flex justify-end">
        <SaveSignalButton
          slug={topic.slug}
          initialSaved={initialSaved}
          initialCount={savedCount}
          isAuthenticated={!!user}
          size="md"
        />
      </div>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">

            {descPsycheverse && (
              <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-5 py-4">
                <p className="font-mono text-[12px] uppercase tracking-widest text-accent-gold-text/80 mb-2">
                  In the Psycheverse
                </p>
                <p className="text-sm text-text-primary leading-relaxed">
                  {descPsycheverse.replace(/^In the Psycheverse:\s*/i, "")}
                </p>
              </div>
            )}

            <SectionCard headingLevel={2} title={`Episodes (${topic._count.episodes})`} accent="gold">
              {sortedEpisodes.length > 0 ? (
                <div className="grid gap-3">
                  {topic._count.episodes > sortedEpisodes.length && (
                    <p className="font-mono text-[12px] text-text-muted">
                      Showing the {sortedEpisodes.length} most recent of {topic._count.episodes}.{" "}
                      <Link href={`/episodes?topic=${topic.slug}`} className="underline hover:text-accent-gold-text">
                        Browse all episodes →
                      </Link>
                    </p>
                  )}
                  {sortedEpisodes.map((e) => (
                    <EpisodeListItem headingLevel={3}
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

            {relatedTopics.length > 0 && (
              <SectionCard headingLevel={2} title="🐇 Rabbit Hole" accent="cyan">
                <p className="text-xs text-text-muted mb-4">
                  Topics that frequently appear alongside{" "}
                  <strong className="text-text-primary">{topic.title}</strong>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedTopics.map((rt) => (
                    <Link
                      key={rt.slug}
                      href={`/topics/${rt.slug}`}
                      className="group flex flex-col gap-1 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-cyan/30 hover:bg-elevated"
                    >
                      <span className="font-mono text-sm font-semibold text-accent-cyan group-hover:underline">
                        {rt.title}
                      </span>
                      {rt.description && (
                        <span className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                          {rt.description.split("\n\n")[0]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          <div className="space-y-6">
            <EntityStatsPanel
              stats={[
                { icon: "🎬", label: "Episodes", value: topic._count.episodes },
                { icon: "👤", label: "People", value: topic._count.people },
                { icon: "📜", label: "Lore Entries", value: topic._count.lore },
              ]}
            />

            <GuestGrid
              guests={topic.people.map((p) => ({
                displayName: p.person.displayName,
                slug: p.person.slug,
                avatarUrl: p.person.avatarUrl,
                personType: p.person.personType,
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: topic.title,
            ...(topic.description ? { description: topic.description.split("\n\n")[0].trim() } : {}),
            url: `https://cultcodex.me/topics/${topic.slug}`,
            inDefinedTermSet: {
              "@type": "DefinedTermSet",
              name: "Cult of Psyche Signal Archive",
              url: "https://cultcodex.me/topics",
            },
            // Cross-entity mentions — knowledge-graph edges
            ...(topic._count.people > 0 || topic._count.lore > 0
              ? {
                  mentions: [
                    ...topic.people.slice(0, 5).map((tp) => ({
                      "@type": "Person",
                      name: tp.person.displayName,
                      url: `https://cultcodex.me/people/${tp.person.slug}`,
                    })),
                    ...topic.lore.slice(0, 5).map((tl) => ({
                      "@type": "Article",
                      name: tl.loreEntry.title,
                      url: `https://cultcodex.me/lore/${tl.loreEntry.slug}`,
                    })),
                  ],
                }
              : {}),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbListJsonLd([
              { name: "CultCodex", url: "https://cultcodex.me" },
              { name: "Signals", url: "https://cultcodex.me/topics" },
              { name: topic.title, url: `https://cultcodex.me/topics/${topic.slug}` },
            ])
          ),
        }}
      />
    </>
  );
}
