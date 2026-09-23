/**
 * Color legend for the site-wide entity color coding system.
 *
 * Gold   — People (guests, hosts, figures)
 * Cyan   — Topics (subjects, themes)
 * Violet — Lore (mythology, deep lore)
 * Red    — Quotes (notable moments)
 */

const LEGEND_ITEMS = [
  { dot: "bg-accent-gold", label: "People", color: "text-accent-gold-text" },
  { dot: "bg-accent-cyan", label: "Topics", color: "text-accent-cyan" },
  { dot: "bg-accent-violet", label: "Lore", color: "text-accent-violet-text" },
  { dot: "bg-red-400", label: "Quotes", color: "text-red-400" },
] as const;

interface ColorLegendProps {
  className?: string;
}

export function ColorLegend({ className = "" }: ColorLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-mono uppercase tracking-widest ${className}`}>
      {LEGEND_ITEMS.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
          <span className={item.color}>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
