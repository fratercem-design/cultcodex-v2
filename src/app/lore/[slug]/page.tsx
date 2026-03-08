import { notFound } from "next/navigation";
import { getLoreBySlug } from "@/lib/queries/lore";
import { buildMetadata } from "@/lib/seo";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

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

export default async function LoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) notFound();

  return (
    <PageShell title={entry.title} subtitle={entry.category ?? undefined}>
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
        </div>

        <div className="space-y-6">
          <SectionCard title="Classification">
            <MetaRow
              label="Canon Status"
              value={
                <StatusBadge
                  label={entry.canonStatus.replace("_", " ")}
                  variant="gold"
                />
              }
            />
            {entry.category && <MetaRow label="Category" value={entry.category} />}
            {entry.firstMentionEpisode && (
              <MetaRow
                label="First Mention"
                value={formatDate(entry.firstMentionEpisode.airDate)}
              />
            )}
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="Episodes"
              entities={entry.episodes.map((e) => ({
                label: e.episode.title,
                slug: e.episode.slug,
                type: "episode",
              }))}
            />
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="People"
              entities={entry.people.map((p) => ({
                label: p.person.displayName,
                slug: p.person.slug,
                type: "person",
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
