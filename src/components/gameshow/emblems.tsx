/**
 * Bespoke SVG emblems for the Panelverse Game Show — one per round, plus a
 * hero sigil. Built in the site's sacred-geometry idiom (viewBox 0 0 100 100,
 * currentColor line work, sealed rings) so they read as native CultCodex marks
 * rather than stock icons. Each round emblem inherits `currentColor`, so the
 * round's accent color flows straight through.
 */

interface EmblemProps {
  size?: number;
  className?: string;
  title?: string;
}

function Frame({
  size = 48,
  className,
  title,
  children,
}: EmblemProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* Shared seal: double ring + eight orbit nodes */}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <circle cx="50" cy="50" r="42.5" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={50 + 42.5 * Math.cos(a)}
            cy={50 + 42.5 * Math.sin(a)}
            r={i % 2 === 0 ? 1.6 : 1}
            fill="currentColor"
            opacity="0.8"
          />
        );
      })}
      {children}
    </svg>
  );
}

/** Round 1 — Real or Fake: Lore. An unfurled grimoire scroll with a wax seal. */
export function LoreEmblem(p: EmblemProps) {
  return (
    <Frame {...p}>
      <path d="M32 30 Q28 34 32 38 L32 66 Q28 70 32 74 L68 74 Q72 70 68 66 L68 38 Q72 34 68 30 Z" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <path d="M32 30 Q36 34 32 38 M68 30 Q64 34 68 38 M32 74 Q36 70 32 66 M68 74 Q64 70 68 66" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {[44, 50, 56, 62].map((y) => (
        <line key={y} x1="38" y1={y} x2="62" y2={y} stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      ))}
      <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.85" />
      <circle cx="50" cy="50" r="2" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    </Frame>
  );
}

/** Round 2 — Two Truths & a Lie. Twin masks, one whole, one cracked. */
export function MasksEmblem(p: EmblemProps) {
  return (
    <Frame {...p}>
      {/* left mask — whole */}
      <path d="M30 34 Q42 32 44 44 Q45 60 37 68 Q29 60 28 44 Q28 36 30 34 Z" stroke="currentColor" strokeWidth="1.3" opacity="0.9" />
      <circle cx="34" cy="46" r="1.6" fill="currentColor" opacity="0.8" />
      <circle cx="40" cy="46" r="1.6" fill="currentColor" opacity="0.8" />
      <path d="M33 56 Q37 60 41 56" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      {/* right mask — cracked */}
      <path d="M56 34 Q68 32 70 44 Q71 60 63 68 Q55 60 54 44 Q54 36 56 34 Z" stroke="currentColor" strokeWidth="1.3" opacity="0.9" />
      <circle cx="60" cy="46" r="1.6" fill="currentColor" opacity="0.8" />
      <circle cx="66" cy="46" r="1.6" fill="currentColor" opacity="0.8" />
      <path d="M59 58 Q63 55 67 58" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      {/* the crack */}
      <path d="M62 33 L60 42 L64 50 L61 60 L63 68" stroke="currentColor" strokeWidth="1" opacity="0.55" strokeDasharray="1 1.4" />
    </Frame>
  );
}

/** Round 3 — Prophecy or Bogus. A crystal orb on a stand, radiant. */
export function OrbEmblem(p: EmblemProps) {
  return (
    <Frame {...p}>
      <circle cx="50" cy="46" r="17" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <path d="M40 40 Q50 34 60 40" stroke="currentColor" strokeWidth="0.9" opacity="0.55" />
      <circle cx="44" cy="41" r="2.4" fill="currentColor" opacity="0.5" />
      {/* inner star spark */}
      <path d="M50 40 L52 46 L58 46 L53 50 L55 56 L50 52 L45 56 L47 50 L42 46 L48 46 Z" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
      {/* stand */}
      <path d="M40 63 Q50 70 60 63 L57 68 L43 68 Z" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
      {/* rays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <line key={i} x1={50 + 20 * Math.cos(a)} y1={46 + 20 * Math.sin(a)} x2={50 + 24 * Math.cos(a)} y2={46 + 24 * Math.sin(a)} stroke="currentColor" strokeWidth="0.8" opacity="0.45" />
        );
      })}
    </Frame>
  );
}

/** Round 4 — Did Psyche Say It? A speaking mouth radiating sound waves. */
export function VoiceEmblem(p: EmblemProps) {
  return (
    <Frame {...p}>
      {/* vintage mic */}
      <rect x="44" y="30" width="12" height="22" rx="6" stroke="currentColor" strokeWidth="1.3" opacity="0.9" />
      {[36, 41, 46].map((y) => (
        <line key={y} x1="45" y1={y} x2="55" y2={y} stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      ))}
      <path d="M38 48 Q38 60 50 60 Q62 60 62 48" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <line x1="50" y1="60" x2="50" y2="68" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <line x1="43" y1="68" x2="57" y2="68" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      {/* sound waves */}
      <path d="M68 38 Q74 46 68 54" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M73 34 Q82 46 73 58" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
      <path d="M32 38 Q26 46 32 54" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M27 34 Q18 46 27 58" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
    </Frame>
  );
}

/** Round 5 — Codex Cluedo. A magnifying glass over a lit candle / case file. */
export function ClueEmblem(p: EmblemProps) {
  return (
    <Frame {...p}>
      {/* case file */}
      <rect x="30" y="40" width="26" height="30" rx="2" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
      {[47, 52, 57, 62].map((y) => (
        <line key={y} x1="34" y1={y} x2="48" y2={y} stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      ))}
      {/* candle flame top-left */}
      <path d="M36 34 Q39 30 36 26 Q33 30 36 34 Z" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="36" y1="34" x2="36" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {/* magnifier */}
      <circle cx="60" cy="52" r="12" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <circle cx="60" cy="52" r="8" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      <line x1="69" y1="61" x2="76" y2="68" stroke="currentColor" strokeWidth="2" opacity="0.85" strokeLinecap="round" />
      {/* question spark in the lens */}
      <path d="M57 49 Q57 46 60 46 Q63 46 63 49 Q63 51 60 52 L60 54" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
      <circle cx="60" cy="57" r="0.8" fill="currentColor" opacity="0.7" />
    </Frame>
  );
}

/** Hero — a grand psi sigil crowned within a proscenium arch. */
export function GameShowHero({ size = 96, className, title }: EmblemProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} role={title ? "img" : "presentation"} aria-label={title} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.4" opacity="0.9" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* proscenium arch */}
      <path d="M24 74 L24 44 Q24 26 50 24 Q76 26 76 44 L76 74" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
      <path d="M30 74 L30 46 Q30 32 50 30 Q70 32 70 46 L70 74" stroke="currentColor" strokeWidth="0.7" opacity="0.35" />
      {/* the psi sigil */}
      <path d="M50 34 L50 66" stroke="currentColor" strokeWidth="1.8" opacity="0.95" />
      <path d="M40 40 Q40 54 50 54 Q60 54 60 40" stroke="currentColor" strokeWidth="1.8" opacity="0.95" />
      {/* crown of nodes */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (-Math.PI * 0.5) + ((i - 2) * 0.5);
        return <circle key={i} cx={50 + 20 * Math.cos(a)} cy={50 + 20 * Math.sin(a)} r={i === 2 ? 2 : 1.3} fill="currentColor" opacity="0.8" />;
      })}
      {/* base line + orbit spark */}
      <line x1="34" y1="72" x2="66" y2="72" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="50" cy="72" r="2.5" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

export const ROUND_EMBLEMS: Record<string, (p: EmblemProps) => React.ReactElement> = {
  "real-or-fake-lore": LoreEmblem,
  "two-truths-lie": MasksEmblem,
  "prophecy-or-bogus": OrbEmblem,
  "did-psyche-say-it": VoiceEmblem,
  "codex-cluedo": ClueEmblem,
};
