import type { JSX } from "react";
import type { PersonType } from "@/generated/prisma/client";

interface PersonSigilProps {
  slug: string;
  name: string;
  personType: PersonType;
  size?: number;
  className?: string;
}

// 32-bit FNV-1a hash — deterministic, fast, pure.
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

const TINT_CLASS: Record<PersonType, string> = {
  host: "text-accent-gold",
  recurring: "text-accent-purple",
  guest: "text-accent-green",
  mentioned: "text-accent-cyan",
};

// 8 compass positions for the accent mark, on a ring of radius 18.
// Angles in degrees, 0° = top, clockwise.
const COMPASS_POINTS: Array<{ x: number; y: number }> = Array.from(
  { length: 8 },
  (_, i) => {
    const angle = (i * 45 - 90) * (Math.PI / 180);
    return {
      x: 20 + 18 * Math.cos(angle),
      y: 20 + 18 * Math.sin(angle),
    };
  },
);

function renderPrimary(
  index: number,
  crescentRot: number,
  stroke: number,
): JSX.Element {
  const s = stroke;
  switch (index % 6) {
    case 0: // vertical bar
      return <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />;
    case 1: // horizontal bar
      return <line x1={8} y1={20} x2={32} y2={20} strokeWidth={s} />;
    case 2: // cross
      return (
        <g>
          <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />
          <line x1={8} y1={20} x2={32} y2={20} strokeWidth={s} />
        </g>
      );
    case 3: // crescent (quarter-arc), rotatable
      return (
        <path
          d="M 20 12 A 8 8 0 0 1 28 20"
          strokeWidth={s}
          fill="none"
          transform={`rotate(${crescentRot * 90} 20 20)`}
        />
      );
    case 4: // upright triangle
      return (
        <polygon
          points="20,10 30,28 10,28"
          strokeWidth={s}
          fill="none"
          strokeLinejoin="round"
        />
      );
    case 5: // inverted triangle
      return (
        <polygon
          points="10,12 30,12 20,30"
          strokeWidth={s}
          fill="none"
          strokeLinejoin="round"
        />
      );
    default:
      return <line x1={20} y1={8} x2={20} y2={32} strokeWidth={s} />;
  }
}

function renderAccent(
  index: number,
  cornerIdx: number,
  stroke: number,
): JSX.Element | null {
  const { x, y } = COMPASS_POINTS[cornerIdx % 8];
  const s = stroke;
  switch (index % 2) {
    case 0: {
      // dot triad — three small filled dots around (x, y)
      const r = 1.2;
      return (
        <g fill="currentColor" stroke="none">
          <circle cx={x - 1.5} cy={y - 1.0} r={r} />
          <circle cx={x + 1.5} cy={y - 1.0} r={r} />
          <circle cx={x} cy={y + 1.5} r={r} />
        </g>
      );
    }
    case 1: {
      // hatch cluster — four short diagonal strokes in 2x2
      return (
        <g>
          <line x1={x - 2} y1={y - 2} x2={x} y2={y} strokeWidth={s * 0.8} />
          <line x1={x + 1} y1={y - 2} x2={x + 3} y2={y} strokeWidth={s * 0.8} />
          <line x1={x - 2} y1={y + 1} x2={x} y2={y + 3} strokeWidth={s * 0.8} />
          <line
            x1={x + 1}
            y1={y + 1}
            x2={x + 3}
            y2={y + 3}
            strokeWidth={s * 0.8}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

export function PersonSigil({
  slug,
  name,
  personType,
  size = 40,
  className,
}: PersonSigilProps): JSX.Element {
  const hashKey = slug || name || "void";
  const hash = fnv1a(hashKey);

  const primaryIdx = hash & 0x7;
  const hasInnerRing = (hash & 0x8) !== 0;
  const accentCorner = (hash >> 4) & 0x7;
  const accentIdx = (hash >> 7) & 0x1;
  const crescentRot = (hash >> 11) & 0x3;

  // Size-based draw rules.
  const drawInnerRing = hasInnerRing && size >= 24;
  const drawAccent = size >= 24;
  const drawPrimary = size >= 16;
  const stroke = Math.max(1.5, size / 60);

  const tint = TINT_CLASS[personType] ?? TINT_CLASS.guest;

  return (
    <svg
      role="img"
      aria-label={name}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`${tint} ${className ?? ""}`.trim()}
      stroke="currentColor"
      fill="none"
    >
      <circle cx={20} cy={20} r={18} strokeWidth={stroke} />
      {drawInnerRing && (
        <circle
          cx={20}
          cy={20}
          r={14}
          strokeWidth={stroke * 0.5}
          strokeOpacity={0.5}
        />
      )}
      {drawPrimary && renderPrimary(primaryIdx, crescentRot, stroke)}
      {drawAccent && renderAccent(accentIdx, accentCorner, stroke)}
    </svg>
  );
}
