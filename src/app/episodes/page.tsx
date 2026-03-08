import { PageShell } from "@/components/ui/page-shell";
import { EpisodeCard } from "@/components/archive/episode-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEpisodes, formatEpisodeForCard, getEpisodeCount } from "@/lib/queries/episodes";

export const metadata = {
  title: "Episodes — CultCodex",
  description: "Browse all Cult of Psyche episodes",
};

export default async function EpisodesPage() {
  const [episodes, totalCount] = await Promise.all([
    getEpisodes({ take: 50, orderBy: "episodeNumber", order: "desc" }),
    getEpisodeCount("published"),
  ]);

  const cards = episodes.map(formatEpisodeForCard);

  return (
    <PageShell
      title="EPISODES"
      subtitle={`${totalCount} transmissions in the archive`}
    >
      {cards.length === 0 ? (
        <EmptyState
          message="No episodes in the archive yet"
          suggestion="Episodes will appear here once data is ingested"
        />
      ) : (
        <div className="grid gap-3">
          {cards.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
