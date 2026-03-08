import Link from "next/link";

interface TopicCardProps {
  topic: {
    title: string;
    slug: string;
    description: string | null;
    episodeCount: number;
    personCount: number;
    loreCount: number;
  };
}

export function TopicCard({ topic }: TopicCardProps) {
  const totalConnections = topic.episodeCount + topic.personCount + topic.loreCount;

  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-purple/30 hover:bg-elevated"
    >
      <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-purple transition-colors">
        {topic.title}
      </h3>
      {topic.description && (
        <p className="mt-2 text-xs text-text-muted line-clamp-3">
          {topic.description}
        </p>
      )}
      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-text-muted">
        {topic.episodeCount > 0 && (
          <span>{topic.episodeCount} episode{topic.episodeCount !== 1 ? "s" : ""}</span>
        )}
        {topic.personCount > 0 && (
          <span>{topic.personCount} {topic.personCount !== 1 ? "people" : "person"}</span>
        )}
        {topic.loreCount > 0 && (
          <span>{topic.loreCount} lore</span>
        )}
        {totalConnections === 0 && <span>No connections yet</span>}
      </div>
    </Link>
  );
}
