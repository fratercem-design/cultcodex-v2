import { notFound } from "next/navigation";
import { getTopicBySlug } from "@/lib/queries/topics";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import type { Metadata } from "next";

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

  return (
    <PageShell title={topic.title} subtitle="Topic">
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
              <EntityChipList
                title=""
                entities={topic.episodes.map((e) => ({
                  label: `${e.episode.episodeNumber ? `EP.${String(e.episode.episodeNumber).padStart(3, "0")} — ` : ""}${e.episode.title}`,
                  slug: e.episode.slug,
                  type: "episode",
                }))}
              />
            ) : (
              <p className="text-xs text-text-muted">No episodes linked yet</p>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={`People (${topic.people.length})`}>
            {topic.people.length > 0 ? (
              <EntityChipList
                title=""
                entities={topic.people.map((p) => ({
                  label: p.person.displayName,
                  slug: p.person.slug,
                  type: "person",
                }))}
              />
            ) : (
              <p className="text-xs text-text-muted">No people linked yet</p>
            )}
          </SectionCard>

          <SectionCard title={`Lore (${topic.lore.length})`}>
            {topic.lore.length > 0 ? (
              <EntityChipList
                title=""
                entities={topic.lore.map((l) => ({
                  label: l.loreEntry.title,
                  slug: l.loreEntry.slug,
                  type: "lore",
                }))}
              />
            ) : (
              <p className="text-xs text-text-muted">No lore linked yet</p>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
