import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { getArchiveStats } from "@/lib/queries/stats";
import {
  getMostQuotedPeople,
  getTopTopicsByEpisodes,
  getCanonBreakdown,
} from "@/lib/queries/analytics";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Archive Stats — CultCodex",
  description: "The Cult of Psyche archive by the numbers",
};

const CANON_COLORS: Record<string, string> = {
  canonical: "#C8A96B",
  speculative: "#00d9ff",
  community_myth: "#a855f7",
};

const CANON_LABELS: Record<string, string> = {
  canonical: "Canonical",
  speculative: "Speculative",
  community_myth: "Community Myth",
};

export default async function StatsPage() {
  const [stats, quotedPeople, topTopics, canonBreakdown] = await Promise.all([
    getArchiveStats(),
    getMostQuotedPeople(10),
    getTopTopicsByEpisodes(15),
    getCanonBreakdown(),
  ]);

  const maxQuotes = Math.max(...quotedPeople.map((p) => p.count), 1);
  const maxTopicCount = Math.max(...topTopics.map((t) => t.count), 1);
  const minTopicCount = Math.min(...topTopics.map((t) => t.count), 1);

  // Build conic gradient for canon donut
  const canonTotal = canonBreakdown.reduce((sum, c) => sum + c.count, 0);
  let gradientParts: string[] = [];
  let currentDeg = 0;
  for (const entry of canonBreakdown) {
    const sliceDeg = canonTotal > 0 ? (entry.count / canonTotal) * 360 : 0;
    const color = CANON_COLORS[entry.status] ?? "#666";
    gradientParts.push(`${color} ${currentDeg}deg ${currentDeg + sliceDeg}deg`);
    currentDeg += sliceDeg;
  }
  const conicGradient = `conic-gradient(${gradientParts.join(", ")})`;

  const statCards = [
    { label: "Episodes", value: stats.episodes },
    { label: "People", value: stats.people },
    { label: "Lore Entries", value: stats.loreEntries },
    { label: "Quotes", value: stats.quotes },
    { label: "Transcript Segments", value: stats.segments },
    { label: "Hours of Content", value: stats.totalHours },
    // Only show community stats when there's activity
    ...(stats.comments > 0 ? [{ label: "Comments", value: stats.comments }] : []),
    ...(stats.reactions > 0 ? [{ label: "Reactions", value: stats.reactions }] : []),
  ];

  return (
    <div>
      <PageHero
        title="ARCHIVE STATS"
        subtitle="The Cult of Psyche by the numbers"
        backgroundImage="/wiki-page-header.jpg"
      
      label="system_stats"
    />

      <div className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-border bg-surface p-4 text-center"
            >
              <div className="font-mono text-3xl font-bold text-accent-gold">
                {card.value.toLocaleString()}
              </div>
              <div className="font-mono text-[10px] text-text-muted uppercase tracking-wider mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Most Quoted People */}
        <SectionCard title="MOST QUOTED">
          <div className="space-y-3">
            {quotedPeople.map((person, i) => (
              <Link
                key={person.slug}
                href={`/people/${person.slug}`}
                className="flex items-center gap-3 group"
              >
                <span className="shrink-0 font-mono text-[10px] text-text-muted w-5 text-right">
                  {i + 1}.
                </span>
                <span className="shrink-0 font-mono text-xs text-text-primary w-40 truncate group-hover:text-accent-gold transition-colors">
                  {person.displayName}
                </span>
                <div className="flex-1 h-2 rounded-full bg-elevated overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent-gold/70"
                    style={{ width: `${(person.count / maxQuotes) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[10px] text-accent-gold font-bold w-8 text-right">
                  {person.count}
                </span>
              </Link>
            ))}
            {quotedPeople.length === 0 && (
              <p className="py-4 text-center font-mono text-xs text-text-muted">
                No quotes in the archive yet
              </p>
            )}
          </div>
        </SectionCard>

        {/* Topic Cloud */}
        <SectionCard title="TOPIC FREQUENCY">
          <div className="flex flex-wrap gap-2 justify-center py-4">
            {topTopics.map((topic, i) => {
              // Scale font size from text-xs (12px) to text-2xl (24px)
              const range = maxTopicCount - minTopicCount || 1;
              const normalized = (topic.count - minTopicCount) / range;
              const fontSize = 12 + normalized * 14; // 12px to 26px

              // Color tiers
              let colorClass = "text-accent-cyan";
              if (i < 5) colorClass = "text-accent-gold";
              else if (i < 10) colorClass = "text-accent-gold";

              return (
                <Link
                  key={topic.slug}
                  href={`/topics/${topic.slug}`}
                  className={`inline-block rounded-full border border-border px-3 py-1 font-mono transition-colors hover:bg-elevated hover:border-accent-gold/30 ${colorClass}`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {topic.title}
                  <span className="ml-1 opacity-40 text-[9px]">
                    {topic.count}
                  </span>
                </Link>
              );
            })}
            {topTopics.length === 0 && (
              <p className="py-4 text-center font-mono text-xs text-text-muted">
                No topics in the archive yet
              </p>
            )}
          </div>
        </SectionCard>

        {/* Canon Status Breakdown */}
        <SectionCard title="LORE CANON STATUS">
          <div className="flex flex-col items-center gap-6 py-4">
            {canonTotal > 0 ? (
              <>
                {/* Donut chart */}
                <div
                  className="relative h-48 w-48 rounded-full"
                  style={{ background: conicGradient }}
                >
                  {/* Center hole */}
                  <div className="absolute inset-6 rounded-full bg-void flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-mono text-2xl font-bold text-text-primary">
                        {canonTotal}
                      </div>
                      <div className="font-mono text-[9px] text-text-muted uppercase">
                        Total
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex gap-6">
                  {canonBreakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            CANON_COLORS[entry.status] ?? "#666",
                        }}
                      />
                      <div>
                        <span className="font-mono text-xs text-text-primary">
                          {CANON_LABELS[entry.status] ?? entry.status}
                        </span>
                        <span className="ml-1 font-mono text-[9px] text-text-muted">
                          {entry.count} ({entry.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-4 text-center font-mono text-xs text-text-muted">
                No lore entries in the archive yet
              </p>
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
