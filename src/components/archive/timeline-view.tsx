import { EpisodeListItem } from "@/components/archive/episode-list-item";

interface TimelineEpisode {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  thumbnailUrl: string | null;
}

interface TimelineViewProps {
  episodes: TimelineEpisode[];
}

function groupByMonth(episodes: TimelineEpisode[]) {
  const groups = new Map<string, TimelineEpisode[]>();
  const noDate: TimelineEpisode[] = [];

  for (const ep of episodes) {
    if (!ep.airDate) {
      noDate.push(ep);
      continue;
    }
    const d = new Date(ep.airDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(ep);
  }

  // Sort keys descending (newest first)
  const sorted = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  // Format labels
  const result = sorted.map(([key, eps]) => {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { key, label, episodes: eps };
  });

  if (noDate.length > 0) {
    result.push({ key: "undated", label: "Undated", episodes: noDate });
  }

  return result;
}

export function TimelineView({ episodes }: TimelineViewProps) {
  const groups = groupByMonth(episodes);

  if (groups.length === 0) {
    return <p className="text-sm text-text-muted">No episodes to display.</p>;
  }

  return (
    <div className="relative space-y-6">
      {/* Vertical timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

      {groups.map((group) => (
        <section key={group.key} className="relative pl-6">
          {/* Timeline dot */}
          <div className="absolute left-[-3px] top-1 h-1.5 w-1.5 rounded-full bg-accent-gold" />

          <h2 className="sticky top-0 z-10 mb-3 bg-void/90 py-1 font-display text-sm font-bold text-accent-gold backdrop-blur-sm">
            {group.label}
            <span className="ml-2 font-mono text-[10px] font-normal text-text-muted">
              ({group.episodes.length})
            </span>
          </h2>
          <div className="grid gap-2">
            {group.episodes.map((ep) => (
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
        </section>
      ))}
    </div>
  );
}
