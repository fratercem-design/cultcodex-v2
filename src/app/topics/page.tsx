import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionGroup } from "@/components/archive/section-group";
import { getTopicsWithHeat, getTopicCount } from "@/lib/queries/topics";
import { getTopicAggregates, getArchiveLastUpdated } from "@/lib/queries/stats";
import { formatRelativeDate } from "@/lib/format/date";
import { IconTopic, IconLink } from "@/components/graphics/codex-icons";
import type { TopicCardData } from "@/lib/queries/topics";

export const revalidate = 600;

export const metadata = {
  title: "Topics — CULT CODEX",
  description: "Explore the key topics and themes of the Cult of Psyche",
};

export default async function TopicsPage() {
  const [{ popular, active, niche }, aggregates, lastUpdated] = await Promise.all([
    getTopicsWithHeat(),
    getTopicAggregates(),
    getArchiveLastUpdated(),
  ]);

  const glanceItems = [
    {
      icon: <IconTopic size={14} />,
      label: `${aggregates.total} topic${aggregates.total !== 1 ? "s" : ""}`,
    },
    ...(aggregates.linkedEpisodes > 0
      ? [
          {
            icon: <IconLink size={14} />,
            label: `${aggregates.linkedEpisodes} episode link${aggregates.linkedEpisodes !== 1 ? "s" : ""}`,
          },
        ]
      : []),
    ...(lastUpdated
      ? [{ icon: "🔄", label: `Updated ${formatRelativeDate(lastUpdated)}` }]
      : []),
  ];

  const totalCount = popular.length + active.length + niche.length;

  return (
    <>
      <PageHero
        title="TOPICS"
        subtitle="Key themes and recurring subjects"
        backgroundImage="/long-form-background.jpg"
      />
      <EntityGlanceBar items={glanceItems} />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        {totalCount === 0 ? (
          <EmptyState message="No topics in the archive yet" />
        ) : (
          <>
            {/* Popular — crimson */}
            {popular.length > 0 && (
              <SectionGroup
                title="Popular"
                accent="crimson"
                count={popular.length}
                description="Topics with 20+ connections across episodes, people, and lore."
              >
                <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {popular.map((t) => (
                    <TopicCard key={t.id} topic={t} accent="crimson" />
                  ))}
                </div>
              </SectionGroup>
            )}

            {/* Active — cyan */}
            {active.length > 0 && (
              <SectionGroup
                title="Active"
                accent="cyan"
                count={active.length}
                description="Topics with 5–19 connections — regularly referenced across the archive."
              >
                <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {active.map((t) => (
                    <TopicCard key={t.id} topic={t} accent="cyan" />
                  ))}
                </div>
              </SectionGroup>
            )}

            {/* Niche — violet */}
            {niche.length > 0 && (
              <SectionGroup
                title="Niche"
                accent="violet"
                count={niche.length}
                description="Topics with fewer than 5 connections — specific or emerging subjects."
              >
                <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {niche.map((t) => (
                    <TopicCard key={t.id} topic={t} accent="violet" />
                  ))}
                </div>
              </SectionGroup>
            )}
          </>
        )}
      </main>
    </>
  );
}

// ── Topic card ────────────────────────────────────────────────────────────────

type TopicAccent = "crimson" | "cyan" | "violet";

const CARD_STYLES: Record<
  TopicAccent,
  { hover: string; name: string; badge: string; dot: string }
> = {
  crimson: {
    hover: "hover:border-accent-crimson/40 hover:bg-elevated",
    name: "group-hover:text-accent-crimson",
    badge: "text-accent-crimson",
    dot: "bg-accent-crimson/50",
  },
  cyan: {
    hover: "hover:border-accent-cyan/40 hover:bg-elevated",
    name: "group-hover:text-accent-cyan",
    badge: "text-accent-cyan",
    dot: "bg-accent-cyan/50",
  },
  violet: {
    hover: "hover:border-accent-violet/40 hover:bg-elevated",
    name: "group-hover:text-accent-violet",
    badge: "text-accent-violet",
    dot: "bg-accent-violet/50",
  },
};

function TopicCard({
  topic,
  accent,
}: {
  topic: TopicCardData;
  accent: TopicAccent;
}) {
  const s = CARD_STYLES[accent];

  return (
    <Link
      href={`/topics/${topic.slug}`}
      className={`group block rounded-lg border border-border bg-surface p-4 transition-colors ${s.hover}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
        <div className="min-w-0 flex-1">
          <h3
            className={`font-sans text-sm font-medium text-text-primary transition-colors ${s.name}`}
          >
            {topic.title}
          </h3>
          {topic.description && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">
              {topic.description}
            </p>
          )}
          <div className={`mt-2 flex flex-wrap gap-x-3 font-mono text-[10px] ${s.badge}`}>
            {topic.episodeCount > 0 && (
              <span>{topic.episodeCount} ep{topic.episodeCount !== 1 ? "s" : ""}</span>
            )}
            {topic.personCount > 0 && (
              <span>{topic.personCount} {topic.personCount !== 1 ? "people" : "person"}</span>
            )}
            {topic.loreCount > 0 && (
              <span>{topic.loreCount} lore</span>
            )}
            {topic.totalConnections === 0 && (
              <span className="text-text-muted">no connections</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
