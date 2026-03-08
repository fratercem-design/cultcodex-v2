import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeCard } from "@/components/archive/episode-card";
import { ArchiveStatsDisplay } from "@/components/archive/archive-stats";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";

export default async function HomePage() {
  const [stats, recentEpisodes] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 5, orderBy: "episodeNumber", order: "desc" }),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);

  return (
    <PageShell
      title="MATRIX ARCHIVE"
      subtitle="The sacred intelligence terminal of the Cult of Psyche"
    >
      <div className="space-y-8">
        {/* Archive status */}
        <TerminalPanel header="SYS::STATUS">
          <p className="text-accent-green">Archive online. All data feeds nominal.</p>
        </TerminalPanel>

        {/* Stats */}
        <ArchiveStatsDisplay stats={stats} />

        {/* Recent episodes */}
        <SectionCard title="Recent Transmissions">
          {recentCards.length > 0 ? (
            <div className="grid gap-3">
              {recentCards.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No transmissions yet.</p>
          )}
          <div className="mt-4">
            <Link
              href="/episodes"
              className="font-mono text-xs text-accent-green hover:underline"
            >
              View all episodes →
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
