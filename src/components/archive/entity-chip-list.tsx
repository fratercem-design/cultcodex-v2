import Link from "next/link";
import type { EntityType } from "@/types";

interface EntityChip {
  label: string;
  slug: string;
  type: EntityType;
}

interface EntityChipListProps {
  title: string;
  entities: EntityChip[];
}

const typeToPath: Record<EntityType, string> = {
  episode: "/episodes",
  person: "/people",
  lore: "/lore",
  topic: "/topics",
  series: "/series",
  quote: "/quotes",
};

export function EntityChipList({ title, entities }: EntityChipListProps) {
  if (entities.length === 0) return null;

  return (
    <div>
      {title && (
        <h4 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
          {title}
        </h4>
      )}
      <div className="flex flex-wrap gap-1.5">
        {entities.map((entity) => (
          <Link
            key={`${entity.type}-${entity.slug}`}
            href={`${typeToPath[entity.type]}/${entity.slug}`}
            className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-green/30 hover:text-accent-green transition-colors"
          >
            {entity.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
