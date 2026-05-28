import Link from "next/link";

interface ArchetypeEntry {
  episodeSlug: string;
  episodeTitle: string;
  episodeNumber: number | null;
  airDate: Date | null;
  archetype: string;
  supporting: string;
}

interface ArchetypeTimelineProps {
  entries: ArchetypeEntry[];
  personName: string;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  // Dominant / aggressive
  dominant: "text-red-400 border-red-500/30 bg-red-500/5",
  aggressor: "text-red-400 border-red-500/30 bg-red-500/5",
  challenger: "text-red-400 border-red-500/30 bg-red-500/5",
  // Performer / charismatic
  performer: "text-accent-gold border-accent-gold/30 bg-accent-gold/5",
  charmer: "text-accent-gold border-accent-gold/30 bg-accent-gold/5",
  showman: "text-accent-gold border-accent-gold/30 bg-accent-gold/5",
  oracle: "text-accent-gold border-accent-gold/30 bg-accent-gold/5",
  // Defensive / deflective
  defensive: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  deflector: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  // Analytical / calm
  analyst: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5",
  strategist: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5",
  observer: "text-accent-cyan border-accent-cyan/30 bg-accent-cyan/5",
  // Default
  default: "text-accent-violet border-accent-violet/30 bg-accent-violet/5",
};

function getArchetypeColor(archetype: string): string {
  const key = archetype.toLowerCase().split(" ")[0];
  return ARCHETYPE_COLORS[key] ?? ARCHETYPE_COLORS.default;
}

export function ArchetypeTimeline({ entries, personName }: ArchetypeTimelineProps) {
  if (entries.length === 0) return null;

  const uniqueArchetypes = [...new Set(entries.map((e) => e.archetype))];
  const hasEvolution = new Set(entries.map((e) => e.archetype)).size > 1;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
            {"/// archetype_evolution"}
          </p>
          {hasEvolution && (
            <p className="font-mono text-[10px] text-text-muted mt-1">
              {personName}&rsquo;s role shifted across {entries.length} episode{entries.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {uniqueArchetypes.slice(0, 4).map((a) => (
            <span
              key={a}
              className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] ${getArchetypeColor(a)}`}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-3 pl-5">
          {entries.map((entry, i) => {
            const colorCls = getArchetypeColor(entry.archetype);
            const isLast = i === entries.length - 1;
            return (
              <div key={entry.episodeSlug} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-5 top-2 h-2.5 w-2.5 rounded-full border-2 border-void ${
                    isLast ? "bg-accent-violet" : "bg-border"
                  }`}
                  style={{ marginLeft: "-1px" }}
                />
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] ${colorCls}`}>
                        {entry.archetype}
                      </span>
                      {entry.airDate && (
                        <span className="font-mono text-[9px] text-text-muted">
                          {new Date(entry.airDate).getFullYear()}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/episodes/${entry.episodeSlug}`}
                      className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors line-clamp-1"
                    >
                      {entry.episodeNumber ? `EP.${String(entry.episodeNumber).padStart(3, "0")} · ` : ""}
                      {entry.episodeTitle}
                    </Link>
                    {entry.supporting && (
                      <p className="text-[10px] text-text-muted/70 mt-0.5 leading-relaxed line-clamp-2 italic">
                        {entry.supporting}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
