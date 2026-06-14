/**
 * SymbolGlyph — accurate monoline SVG art for each Symbol Codex entry.
 *
 * Replaces the unreliable/inaccurate unicode glyphs (emoji, wrong
 * characters) with hand-drawn line art on a shared 100×100 viewBox.
 * Uses `currentColor` so existing gold text styling carries through.
 * Falls back to the unicode glyph for any slug not mapped.
 */
import type { ReactNode } from "react";

interface Props {
  slug: string;
  /** unicode fallback if the slug isn't mapped */
  glyph?: string;
  size?: number;
  className?: string;
}

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ART: Record<string, ReactNode> = {
  ouroboros: (
    <>
      <path d="M50 17 A33 33 0 1 1 33 19.5" {...S} />
      <path d="M33 19.5 l10 -5 l-1 11 z" {...S} fill="currentColor" />
      <circle cx="38" cy="17.5" r="1.6" fill="currentColor" />
    </>
  ),
  "eye-of-horus": (
    <>
      <path d="M18 50 Q40 33 66 47" {...S} />
      <path d="M18 50 Q40 63 66 47" {...S} />
      <circle cx="42" cy="50" r="7" fill="currentColor" />
      <path d="M30 58 L30 74" {...S} />
      <path d="M66 47 Q80 47 78 64 Q77 72 68 70" {...S} />
      <path d="M24 40 Q42 30 60 36" {...S} strokeWidth={1.8} />
    </>
  ),
  baphomet: (
    <>
      <circle cx="50" cy="50" r="46" {...S} />
      <circle cx="50" cy="50" r="39" {...S} strokeWidth={1.6} />
      <path d="M50 88 L27.7 19.3 L86.2 61.7 L13.8 61.7 L72.3 19.3 Z" {...S} />
    </>
  ),
  pentagram: (
    <>
      <circle cx="50" cy="50" r="45" {...S} strokeWidth={1.6} />
      <path d="M50 12 L72.3 80.7 L13.9 38.3 L86.1 38.3 L27.7 80.7 Z" {...S} />
    </>
  ),
  "tree-of-life": (
    <>
      {/* paths */}
      <path
        d="M50 9 L72 23 M50 9 L28 23 M72 23 L28 23 M72 23 L50 52 M28 23 L50 52
           M72 23 L72 43 M28 23 L28 43 M72 43 L28 43 M72 43 L50 52 M28 43 L50 52
           M72 43 L72 67 M28 43 L28 67 M50 52 L72 67 M50 52 L28 67 M50 52 L50 77
           M72 67 L50 77 M28 67 L50 77 M72 67 L28 67 M50 77 L50 92 M50 9 L50 52"
        {...S}
        strokeWidth={1.3}
      />
      {[
        [50, 9], [72, 23], [28, 23], [72, 43], [28, 43],
        [50, 52], [72, 67], [28, 67], [50, 77], [50, 92],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="4.4" {...S} strokeWidth={1.8} fill="var(--surface, #14101c)" />
      ))}
    </>
  ),
  "all-seeing-eye": (
    <>
      <path d="M50 14 L84 78 L16 78 Z" {...S} />
      <path d="M30 58 Q50 44 70 58" {...S} strokeWidth={1.8} />
      <path d="M30 58 Q50 70 70 58" {...S} strokeWidth={1.8} />
      <circle cx="50" cy="58" r="5" fill="currentColor" />
      {[[50, 6], [22, 16], [78, 16]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} l0 -5`} {...S} strokeWidth={1.6} />
      ))}
    </>
  ),
  ankh: (
    <>
      <ellipse cx="50" cy="28" rx="15" ry="18" {...S} />
      <path d="M50 46 L50 92" {...S} />
      <path d="M28 58 L72 58" {...S} />
    </>
  ),
  phoenix: (
    <>
      <path d="M50 86 L50 44" {...S} />
      <path d="M50 50 Q24 44 16 20 Q40 30 50 44" {...S} />
      <path d="M50 50 Q76 44 84 20 Q60 30 50 44" {...S} />
      <path d="M50 44 Q46 34 50 28 Q54 34 50 44" {...S} />
      <path d="M44 86 Q50 78 56 86" {...S} strokeWidth={1.8} />
    </>
  ),
  "black-sun": (
    <>
      <circle cx="50" cy="50" r="20" {...S} />
      <circle cx="50" cy="50" r="11" fill="currentColor" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 50 + 26 * Math.cos(a), y1 = 50 + 26 * Math.sin(a);
        const x2 = 50 + 42 * Math.cos(a), y2 = 50 + 42 * Math.sin(a);
        return <path key={i} d={`M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}`} {...S} strokeWidth={1.8} />;
      })}
    </>
  ),
  "rose-cross": (
    <>
      <path d="M50 12 L50 88 M18 50 L82 50" {...S} />
      <circle cx="50" cy="50" r="11" {...S} strokeWidth={1.8} />
      <circle cx="50" cy="50" r="5.5" {...S} strokeWidth={1.6} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <circle key={i} cx={(50 + 8 * Math.cos(a)).toFixed(1)} cy={(50 + 8 * Math.sin(a)).toFixed(1)} r="3.4" {...S} strokeWidth={1.3} />;
      })}
    </>
  ),
  "chaos-star": (
    <>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const x = 50 + 42 * Math.cos(a), y = 50 + 42 * Math.sin(a);
        // arrowhead
        const a1 = a + 0.18, a2 = a - 0.18;
        const hx1 = x - 9 * Math.cos(a1), hy1 = y - 9 * Math.sin(a1);
        const hx2 = x - 9 * Math.cos(a2), hy2 = y - 9 * Math.sin(a2);
        return (
          <g key={i}>
            <path d={`M50 50 L${x.toFixed(1)} ${y.toFixed(1)}`} {...S} strokeWidth={1.8} />
            <path d={`M${hx1.toFixed(1)} ${hy1.toFixed(1)} L${x.toFixed(1)} ${y.toFixed(1)} L${hx2.toFixed(1)} ${hy2.toFixed(1)}`} {...S} strokeWidth={1.8} />
          </g>
        );
      })}
    </>
  ),
  caduceus: (
    <>
      <path d="M50 16 L50 90" {...S} />
      <path d="M50 24 Q30 34 50 46 Q70 58 50 70 Q34 80 50 88" {...S} strokeWidth={1.8} />
      <path d="M50 24 Q70 34 50 46 Q30 58 50 70 Q66 80 50 88" {...S} strokeWidth={1.8} />
      <path d="M50 20 Q34 8 26 16 Q40 16 50 26 Q60 16 74 16 Q66 8 50 20" {...S} strokeWidth={1.6} />
      <circle cx="50" cy="15" r="3" fill="currentColor" />
    </>
  ),
  hexagram: (
    <>
      <path d="M50 14 L80 66 L20 66 Z" {...S} />
      <path d="M50 86 L20 34 L80 34 Z" {...S} />
    </>
  ),
  triquetra: (
    <>
      <path d="M50 24 Q72 56 32 60 Q48 24 50 24" {...S} transform="rotate(0 50 50)" />
      <path d="M50 24 Q72 56 32 60 Q48 24 50 24" {...S} transform="rotate(120 50 50)" />
      <path d="M50 24 Q72 56 32 60 Q48 24 50 24" {...S} transform="rotate(240 50 50)" />
      <circle cx="50" cy="50" r="40" {...S} strokeWidth={1.3} />
    </>
  ),
  labyrinth: (
    <>
      <path d="M50 20 A30 30 0 1 1 20 50 A20 20 0 1 1 50 30 A10 10 0 1 1 40 50" {...S} strokeWidth={1.8} />
      <circle cx="50" cy="50" r="2.6" fill="currentColor" />
    </>
  ),
  saturn: (
    <>
      <path d="M40 18 L40 60 Q40 80 58 80 Q74 80 72 62" {...S} />
      <path d="M30 30 L54 30" {...S} />
      <path d="M42 22 L42 40" {...S} />
    </>
  ),
  "flower-of-life": (
    <>
      <circle cx="50" cy="50" r="16" {...S} strokeWidth={1.6} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <circle key={i} cx={(50 + 16 * Math.cos(a)).toFixed(1)} cy={(50 + 16 * Math.sin(a)).toFixed(1)} r="16" {...S} strokeWidth={1.6} />;
      })}
      <circle cx="50" cy="50" r="33" {...S} strokeWidth={1.3} />
    </>
  ),
  "vesica-piscis": (
    <>
      <circle cx="40" cy="50" r="24" {...S} />
      <circle cx="60" cy="50" r="24" {...S} />
    </>
  ),
  scarab: (
    <>
      <ellipse cx="50" cy="56" rx="16" ry="22" {...S} />
      <path d="M50 34 L50 78" {...S} strokeWidth={1.4} />
      <path d="M50 30 m-7 0 a7 7 0 1 1 14 0" {...S} strokeWidth={1.8} />
      <path d="M34 44 L20 36 M34 56 L18 56 M34 68 L22 76" {...S} strokeWidth={1.6} />
      <path d="M66 44 L80 36 M66 56 L82 56 M66 68 L78 76" {...S} strokeWidth={1.6} />
    </>
  ),
  sigil: (
    <>
      <circle cx="50" cy="50" r="40" {...S} strokeWidth={1.6} />
      <path d="M30 64 L42 28 L60 60 L72 34" {...S} />
      <circle cx="30" cy="64" r="3.2" fill="currentColor" />
      <path d="M72 34 l-8 2 M72 34 l-2 -8" {...S} strokeWidth={1.6} />
      <circle cx="50" cy="50" r="5" {...S} strokeWidth={1.4} />
    </>
  ),
};

export function SymbolGlyph({ slug, glyph, size = 48, className }: Props) {
  const art = ART[slug];
  if (!art) {
    // Unmapped — fall back to the unicode glyph at a comparable size.
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden="true">
        {glyph}
      </span>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {art}
    </svg>
  );
}
