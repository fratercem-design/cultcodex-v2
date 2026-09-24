// Background pattern overlays for hero sections and page decorations
import { cn } from "@/lib/utils";

interface PatternProps {
  className?: string;
}

/** Subtle geometric grid overlay for hero sections */
export function SacredGeometryOverlay({ className }: PatternProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <svg width="100%" height="100%" style={{ opacity: 0.04 }}>
        <defs>
          <pattern id="sacred-geo" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="40" stroke="#C8392E" strokeWidth="0.3" fill="none" />
            <circle cx="60" cy="60" r="16" stroke="#C8392E" strokeWidth="0.2" fill="none" />
            <line x1="60" y1="20" x2="60" y2="100" stroke="#C8392E" strokeWidth="0.15" />
            <line x1="20" y1="60" x2="100" y2="60" stroke="#C8392E" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sacred-geo)" />
      </svg>
    </div>
  );
}

/** Corner ornament for cards and sections */
export function CornerOrnament({ className, position = "top-left" }: PatternProps & { position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const transforms: Record<string, string> = {
    "top-left": "",
    "top-right": "scale(-1, 1)",
    "bottom-left": "scale(1, -1)",
    "bottom-right": "scale(-1, -1)",
  };

  const positions: Record<string, string> = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("absolute pointer-events-none", positions[position], className)}
      style={{ transform: transforms[position], opacity: 0.15, color: "var(--color-accent-gold)" }}
      aria-hidden="true"
    >
      <path d="M0 0v16" stroke="currentColor" strokeWidth="1" />
      <path d="M0 0h16" stroke="currentColor" strokeWidth="1" />
      <path d="M0 0l10 10" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <circle cx="0" cy="0" r="2" fill="currentColor" opacity="0.4" />
      <circle cx="8" cy="0" r="1" fill="currentColor" opacity="0.2" />
      <circle cx="0" cy="8" r="1" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** Radiant lines emanating from center — used behind headings */
export function RadiantBurst({ className }: PatternProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden", className)} aria-hidden="true">
      <svg width="400" height="200" viewBox="0 0 400 200" fill="none" style={{ opacity: 0.04 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 15 * Math.PI) / 180;
          const x2 = 200 + 200 * Math.cos(angle);
          const y2 = 100 + 100 * Math.sin(angle);
          return (
            <line
              key={i}
              x1="200"
              y1="100"
              x2={x2}
              y2={y2}
              stroke="#C8392E"
              strokeWidth="0.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

/** Floating particle dots — decorative ambient background */
export function FloatingParticles({ className, count = 12 }: PatternProps & { count?: number }) {
  // Deterministic positions based on index
  const particles = Array.from({ length: count }).map((_, i) => ({
    cx: ((i * 37 + 13) % 100),
    cy: ((i * 53 + 7) % 100),
    r: 0.8 + (i % 3) * 0.4,
    delay: (i * 0.4).toFixed(1),
    dur: (3 + (i % 4)).toFixed(0),
  }));

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <svg width="100%" height="100%" style={{ opacity: 0.1 }}>
        {particles.map((p, i) => (
          <circle key={i} cx={`${p.cx}%`} cy={`${p.cy}%`} r={p.r} fill="#C8392E">
            <animate
              attributeName="opacity"
              values="0.2;0.8;0.2"
              dur={`${p.dur}s`}
              begin={`${p.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
