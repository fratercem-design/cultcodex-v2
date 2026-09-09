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

/*
 * Color-coded entity chip system:
 *   Gold   — People (guests, hosts, figures)
 *   Cyan   — Topics (subjects, themes)
 *   Violet — Lore (mythology, deep lore)
 *   Green  — Episodes & Series (content)
 *   Red    — Quotes (notable moments)
 */
const typeColors: Record<EntityType, { dot: string; border: string; text: string; bg: string; label: string }> = {
  person:  { dot: "bg-accent-gold",   border: "border-accent-gold/20 hover:border-accent-gold/50", text: "text-accent-gold-text",   bg: "hover:bg-accent-gold-dim", label: "text-accent-gold-text" },
  topic:   { dot: "bg-accent-cyan",   border: "border-accent-cyan/20 hover:border-accent-cyan/50", text: "text-accent-cyan",   bg: "hover:bg-accent-cyan-dim", label: "text-accent-cyan" },
  lore:    { dot: "bg-accent-violet", border: "border-accent-violet/20 hover:border-accent-violet/50", text: "text-accent-violet-text", bg: "hover:bg-accent-violet-dim", label: "text-accent-violet-text" },
  episode: { dot: "bg-accent-gold",   border: "border-accent-gold/20 hover:border-accent-gold/50", text: "text-accent-gold-text",   bg: "hover:bg-accent-gold-dim", label: "text-accent-gold-text" },
  series:  { dot: "bg-accent-gold",   border: "border-accent-gold/20 hover:border-accent-gold/50", text: "text-accent-gold-text",   bg: "hover:bg-accent-gold-dim", label: "text-accent-gold-text" },
  quote:   { dot: "bg-red-400",       border: "border-red-400/20 hover:border-red-400/50",         text: "text-red-400",       bg: "hover:bg-red-400/5",       label: "text-red-400" },
};

export function EntityChipList({ title, entities }: EntityChipListProps) {
  if (entities.length === 0) return null;

  // Determine heading color from the first entity type
  const headingColor = entities[0] ? typeColors[entities[0].type].label : "text-text-muted";

  return (
    <div>
      {title && (
        <h4 className={`font-mono text-xs uppercase tracking-wider mb-2 ${headingColor}`}>
          {title}
        </h4>
      )}
      <div className="flex flex-wrap gap-1.5">
        {entities.map((entity) => {
          const colors = typeColors[entity.type];
          return (
            <Link
              key={`${entity.type}-${entity.slug}`}
              href={`${typeToPath[entity.type]}/${entity.slug}`}
              className={`inline-flex items-center gap-1.5 rounded border bg-surface px-2 py-0.5 font-mono text-[11px] transition-colors ${colors.border} ${colors.text} ${colors.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
              {entity.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
