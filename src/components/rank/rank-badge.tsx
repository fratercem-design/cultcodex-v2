import type { Rank, RankColor } from "@/lib/rankings/ranks";

const COLOR: Record<RankColor, { text: string; border: string; bg: string }> = {
  cyan: { text: "text-accent-cyan", border: "border-accent-cyan/40", bg: "bg-accent-cyan/10" },
  violet: { text: "text-accent-violet-text", border: "border-accent-violet/40", bg: "bg-accent-violet/10" },
  gold: { text: "text-accent-gold-text", border: "border-accent-gold/40", bg: "bg-accent-gold/10" },
  crimson: { text: "text-accent-crimson", border: "border-accent-crimson/40", bg: "bg-red-950/20" },
};

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
}

export function RankBadge({ rank, size = "md", showTitle = true }: RankBadgeProps) {
  const c = COLOR[rank.color];
  const pad = size === "lg" ? "px-4 py-2 text-sm" : size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${c.border} ${c.bg} ${c.text} ${pad} font-mono font-bold uppercase tracking-widest`}
      style={{ textShadow: `0 0 8px ${rank.hex}55` }}
    >
      <span aria-hidden="true">{rank.glyph}</span>
      {showTitle && <span>{rank.title}</span>}
    </span>
  );
}
