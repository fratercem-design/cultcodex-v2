/**
 * CodexSigil — the signature symbol of CultCodex.
 *
 * A recursive eye-within-a-spiral set inside a sacred-geometry seal:
 * the all-seeing archive eye, ringed by an orbit of nodes (the network
 * of voices) and a recursive spiral (the ever-deepening archive). Meant
 * to be instantly recognizable and reused everywhere — topbar, loaders,
 * footers, OG images.
 *
 * Inherits `currentColor` so it adapts to context. Pass `size` (px) and
 * optional `glow` to add a soft drop-shadow halo.
 */
interface CodexSigilProps {
  size?: number;
  className?: string;
  glow?: boolean;
  title?: string;
}

export function CodexSigil({
  size = 24,
  className,
  glow = false,
  title,
}: CodexSigilProps) {
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
      style={glow ? { filter: "drop-shadow(0 0 4px currentColor)" } : undefined}
    >
      {title ? <title>{title}</title> : null}

      {/* Outer seal ring */}
      <circle cx="50" cy="50" r="47" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />

      {/* Orbit nodes — the network of voices (8-point) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const cx = 50 + 42 * Math.cos(a);
        const cy = 50 + 42 * Math.sin(a);
        return <circle key={i} cx={cx} cy={cy} r={i % 2 === 0 ? 2 : 1.2} fill="currentColor" opacity="0.85" />;
      })}

      {/* Two counter-rotating triangles — the sacred seal */}
      <path d="M50 16 L79 66 L21 66 Z" stroke="currentColor" strokeWidth="1" opacity="0.55" />
      <path d="M50 84 L21 34 L79 34 Z" stroke="currentColor" strokeWidth="1" opacity="0.55" />

      {/* The eye — almond aperture */}
      <path
        d="M26 50 Q50 32 74 50 Q50 68 26 50 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.95"
      />

      {/* Iris + recursive spiral pupil (the ever-deepening archive) */}
      <circle cx="50" cy="50" r="11" stroke="currentColor" strokeWidth="1" opacity="0.8" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.95" />
      <path
        d="M50 50 m0 -8 a8 8 0 1 1 -7 4"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
        fill="none"
      />
    </svg>
  );
}
