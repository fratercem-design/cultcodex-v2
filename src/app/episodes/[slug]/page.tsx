import { notFound } from "next/navigation";
import { getEpisodeBySlug } from "@/lib/queries/episodes";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";
import { formatDuration, formatSeconds } from "@/lib/format/duration";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Not Found — CultCodex" };
  return {
    title: `${episode.title} — CultCodex`,
    description: episode.summaryShort ?? undefined,
  };
}

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <PageShell
      title={episode.title}
      subtitle={[epNum, formatDate(episode.airDate), formatDuration(episode.duration)]
        .filter(Boolean)
        .join(" \u00b7 ")}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {episode.summaryLong && (
            <SectionCard title="Summary">
              <p className="text-sm text-text-primary leading-relaxed">
                {episode.summaryLong}
              </p>
            </SectionCard>
          )}

          {/* Transcript segments */}
          {episode.segments.length > 0 && (
            <TerminalPanel header="TRANSCRIPT">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {episode.segments.map((seg) => (
                  <div key={seg.id} className="flex gap-3">
                    <span className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5">
                      {formatSeconds(seg.startSeconds)}
                    </span>
                    <div>
                      {seg.speakerLabel && (
                        <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                          {seg.speakerLabel}
                        </span>
                      )}
                      <p className="text-sm text-text-primary">{seg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalPanel>
          )}

          {/* Quotes */}
          {episode.quotes.length > 0 && (
            <SectionCard title="Notable Quotes">
              <div className="space-y-4">
                {episode.quotes.map((q) => (
                  <blockquote
                    key={q.id}
                    className="border-l-2 border-accent-gold/50 pl-4"
                  >
                    <p className="text-sm text-text-primary italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    {q.speaker && (
                      <cite className="mt-1 block font-mono text-xs text-accent-gold not-italic">
                        — {q.speaker.displayName}
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
          {/* Meta */}
          <SectionCard title="Metadata">
            <div className="space-y-0">
              {epNum && <MetaRow label="Episode" value={epNum} />}
              <MetaRow label="Aired" value={formatDate(episode.airDate)} />
              <MetaRow label="Duration" value={formatDuration(episode.duration)} />
              <MetaRow
                label="Status"
                value={<StatusBadge label={episode.status} variant="green" />}
              />
              {episode.series && (
                <MetaRow label="Series" value={episode.series.title} />
              )}
            </div>
          </SectionCard>

          {/* Guests */}
          <SectionCard>
            <EntityChipList
              title="Guests"
              entities={episode.guests.map((g) => ({
                label: g.person.displayName,
                slug: g.person.slug,
                type: "person" as const,
              }))}
            />
          </SectionCard>

          {/* Topics */}
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

          {/* Lore */}
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
        </div>
      </div>
    </PageShell>
  );
}
