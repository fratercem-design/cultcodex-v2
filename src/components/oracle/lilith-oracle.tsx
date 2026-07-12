// Animated "Lilith in Scorpio" Oracle emblem — self-contained SVG + CSS.
// Replaces the static /oracle-throne.jpg hero image. Purely decorative
// (aria-hidden); no JS required; honors prefers-reduced-motion.
import { cn } from "@/lib/utils";

interface LilithOracleProps {
  className?: string;
}

const GOLD = "#C8392E";
const VIOLET = "#4A2D6E";
const CYAN = "#62E4C8";
const CRIMSON = "#A94A4A";

export function LilithOracle({ className }: LilithOracleProps) {
  // Twelve embers drifting up through the aura, staggered.
  const embers = [
    { x: 120, delay: 0, dur: 7, r: 1.6 },
    { x: 168, delay: 2.1, dur: 8.5, r: 1.1 },
    { x: 205, delay: 4.3, dur: 6.4, r: 2 },
    { x: 244, delay: 1.2, dur: 9, r: 1.3 },
    { x: 286, delay: 3.4, dur: 7.6, r: 1.7 },
    { x: 96, delay: 5.1, dur: 8.2, r: 1 },
    { x: 312, delay: 6.0, dur: 6.9, r: 1.4 },
    { x: 200, delay: 3.0, dur: 10, r: 1 },
  ];

  return (
    <div className={cn("lilith-oracle relative h-full w-full", className)} aria-hidden="true">
      <svg viewBox="0 0 400 400" className="h-full w-full" role="presentation">
        <defs>
          {/* Plutonian aura: crimson core → violet → void */}
          <radialGradient id="lo-aura" cx="50%" cy="46%" r="62%">
            <stop offset="0%" stopColor="#2A1030" />
            <stop offset="38%" stopColor="#180a1f" />
            <stop offset="72%" stopColor="#0d0710" />
            <stop offset="100%" stopColor="#07060A" />
          </radialGradient>
          {/* Iris of the all-seeing eye */}
          <radialGradient id="lo-iris" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FBEFCF" />
            <stop offset="22%" stopColor={GOLD} />
            <stop offset="60%" stopColor={VIOLET} />
            <stop offset="100%" stopColor="#2b1440" />
          </radialGradient>
          <radialGradient id="lo-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VIOLET} stopOpacity="0.55" />
            <stop offset="60%" stopColor={CRIMSON} stopOpacity="0.14" />
            <stop offset="100%" stopColor={CRIMSON} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lo-figure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#140a1c" />
            <stop offset="100%" stopColor="#05040a" />
          </linearGradient>
          <filter id="lo-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {/* Aura backdrop */}
        <rect width="400" height="400" fill="url(#lo-aura)" />
        <circle className="lo-breathe" cx="200" cy="188" r="150" fill="url(#lo-glow)" />

        {/* Radiating rays */}
        <g className="lo-rays" stroke={GOLD} strokeWidth="0.6" opacity="0.28">
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 24;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 70}
                y1={200 + Math.sin(a) * 70}
                x2={200 + Math.cos(a) * 186}
                y2={200 + Math.sin(a) * 186}
                strokeWidth={i % 2 ? 0.4 : 1}
              />
            );
          })}
        </g>

        {/* Outer zodiac ring (clockwise) */}
        <g className="lo-spin">
          <circle cx="200" cy="200" r="176" fill="none" stroke={VIOLET} strokeWidth="1" opacity="0.5" />
          <circle cx="200" cy="200" r="168" fill="none" stroke={GOLD} strokeWidth="0.5" opacity="0.4" />
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i * Math.PI * 2) / 48;
            const r0 = i % 4 === 0 ? 162 : 168;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * r0}
                y1={200 + Math.sin(a) * r0}
                x2={200 + Math.cos(a) * 176}
                y2={200 + Math.sin(a) * 176}
                stroke={GOLD}
                strokeWidth={i % 4 === 0 ? 1 : 0.4}
                opacity="0.55"
              />
            );
          })}
        </g>

        {/* Inner ring (counter-clockwise) */}
        <g className="lo-spin-rev">
          <circle cx="200" cy="200" r="132" fill="none" stroke={CYAN} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 8" />
          <circle cx="200" cy="200" r="120" fill="none" stroke={VIOLET} strokeWidth="0.6" opacity="0.35" />
        </g>

        {/* Black Moon Lilith — dark crescent crown with violet rim */}
        <g transform="translate(200 70)">
          <circle cx="0" cy="0" r="20" fill="#07060c" stroke={VIOLET} strokeWidth="1" opacity="0.9" />
          <circle cx="7" cy="-2" r="18" fill="url(#lo-aura)" />
          <path d="M -13 -12 A 20 20 0 0 0 -13 12" fill="none" stroke={GOLD} strokeWidth="1.2" opacity="0.7" className="lo-shimmer" />
        </g>

        {/* Lilith — symmetric dark feminine silhouette (head, flowing hair-wings) */}
        <g fill="url(#lo-figure)" stroke={VIOLET} strokeWidth="0.6" strokeOpacity="0.45">
          {/* wings / hair sweeping outward */}
          <path d="M200 150
                   C150 150 110 168 84 214
                   C120 196 150 196 176 208
                   C160 226 150 250 150 250
                   C176 232 200 230 200 230
                   C200 230 224 232 250 250
                   C250 250 240 226 224 208
                   C250 196 280 196 316 214
                   C290 168 250 150 200 150 Z" />
          {/* head */}
          <ellipse cx="200" cy="176" rx="26" ry="30" />
          {/* shoulders */}
          <path d="M170 214 C182 236 218 236 230 214 C226 246 216 262 200 262 C184 262 174 246 170 214 Z" />
        </g>

        {/* Horns / crescent above the brow */}
        <path d="M182 156 C186 146 194 142 200 150 C206 142 214 146 218 156"
              fill="none" stroke={GOLD} strokeWidth="1.4" opacity="0.8" className="lo-shimmer" />

        {/* All-seeing Oracle eye (her third eye) */}
        <g className="lo-breathe" style={{ transformOrigin: "200px 182px" }}>
          <ellipse cx="200" cy="182" rx="34" ry="34" fill="url(#lo-glow)" filter="url(#lo-soft)" />
          <path d="M168 182 Q200 160 232 182 Q200 204 168 182 Z" fill="#0b0710" stroke={GOLD} strokeWidth="1.2" />
          <circle cx="200" cy="182" r="12" fill="url(#lo-iris)" />
          <circle cx="200" cy="182" r="4.5" fill="#05040a" />
          <circle cx="196" cy="178" r="1.6" fill="#FBEFCF" opacity="0.9" />
        </g>

        {/* Scorpio glyph ♏ with radiant stinger */}
        <g transform="translate(200 300)" stroke={GOLD} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-34 -10 V 12 M-34 -10 A6 6 0 0 1 -22 -10 V 12
                   M-22 -10 A6 6 0 0 1 -10 -10 V 12
                   M-10 -10 A6 6 0 0 1 2 -10 V 16
                   M2 16 L 14 16 L 8 9 M 14 16 L 8 22"
                opacity="0.85" />
        </g>
        {/* stinger spark */}
        <circle className="lo-spark" cx="214" cy="316" r="2.6" fill={CRIMSON} />

        {/* Drifting embers */}
        <g>
          {embers.map((e, i) => (
            <circle
              key={i}
              className="lo-ember"
              cx={e.x}
              cy={330}
              r={e.r}
              fill={i % 2 ? GOLD : CRIMSON}
              style={{ animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s` }}
            />
          ))}
        </g>
      </svg>

      <style>{`
        .lilith-oracle svg { display:block; }
        .lilith-oracle .lo-spin { animation: lo-rot 72s linear infinite; transform-box: fill-box; transform-origin: center; }
        .lilith-oracle .lo-spin-rev { animation: lo-rot 96s linear infinite reverse; transform-box: fill-box; transform-origin: center; }
        .lilith-oracle .lo-rays { animation: lo-rot 140s linear infinite; transform-box: fill-box; transform-origin: center; }
        .lilith-oracle .lo-breathe { animation: lo-breathe 5.5s ease-in-out infinite; }
        .lilith-oracle .lo-shimmer { animation: lo-shimmer 4s ease-in-out infinite; }
        .lilith-oracle .lo-spark { animation: lo-spark 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .lilith-oracle .lo-ember { animation-name: lo-ember; animation-timing-function: ease-in; animation-iteration-count: infinite; opacity: 0; }
        @keyframes lo-rot { to { transform: rotate(360deg); } }
        @keyframes lo-breathe { 0%,100% { opacity:.85; } 50% { opacity:1; } }
        @keyframes lo-shimmer { 0%,100% { opacity:.5; } 50% { opacity:.95; } }
        @keyframes lo-spark { 0%,100% { opacity:.35; transform: scale(1); } 50% { opacity:1; transform: scale(1.9); } }
        @keyframes lo-ember {
          0% { opacity:0; transform: translateY(0) scale(1); }
          15% { opacity:.9; }
          80% { opacity:.5; }
          100% { opacity:0; transform: translateY(-170px) scale(.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lilith-oracle .lo-spin, .lilith-oracle .lo-spin-rev, .lilith-oracle .lo-rays,
          .lilith-oracle .lo-breathe, .lilith-oracle .lo-shimmer, .lilith-oracle .lo-spark,
          .lilith-oracle .lo-ember { animation: none !important; }
          .lilith-oracle .lo-ember { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
