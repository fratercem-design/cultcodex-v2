import { notFound } from "next/navigation";
import { getPersonBySlug } from "@/lib/queries/people";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) notFound();

  const allEpisodes = [
    ...person.guestAppearances.map((g) => g.episode),
    ...person.mentions.map((m) => m.episode),
  ];

  // Deduplicate by id
  const uniqueEpisodes = Array.from(
    new Map(allEpisodes.map((e) => [e.id, e])).values()
  ).sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0));

  return (
    <PageShell
      title={person.displayName}
      subtitle={person.shortBio ?? undefined}
    >
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
            <div className="space-y-2">
              {uniqueEpisodes.map((ep) => (
                <EntityChipList
                  key={ep.id}
                  title=""
                  entities={[
                    {
                      label: `${ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")} \u2014 ` : ""}${ep.title}`,
                      slug: ep.slug,
                      type: "episode",
                    },
                  ]}
                />
              ))}
            </div>
          </SectionCard>

          {/* Quotes */}
          {person.quotes.length > 0 && (
            <SectionCard title="Quotes">
              <div className="space-y-4">
                {person.quotes.map((q) => (
                  <blockquote
                    key={q.id}
                    className="border-l-2 border-accent-gold/50 pl-4"
                  >
                    <p className="text-sm text-text-primary italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    {q.episode && (
                      <cite className="mt-1 block font-mono text-[10px] text-text-muted not-italic">
                        {q.episode.title}
                      </cite>
                    )}
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Dossier">
            <MetaRow
              label="Type"
              value={<StatusBadge label={person.personType} variant="purple" />}
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
    </PageShell>
  );
}
