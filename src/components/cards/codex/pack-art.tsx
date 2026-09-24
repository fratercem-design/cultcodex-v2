"use client";

import { useId } from "react";
import type { Palette } from "@/lib/cards/codex/types";
import { PALETTES } from "./codex-art";

/** A sealed foil booster: crimped ends, holo sheen, season seal. */
export function PackArt({
  name,
  theme = "gold",
  seasonNumeral = "I",
  count,
  shake = false,
}: {
  name: string;
  theme?: Palette;
  seasonNumeral?: string;
  count?: number;
  shake?: boolean;
}) {
  const uid = "pk" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = PALETTES[theme] ?? PALETTES.gold;
  const crimp = (y: number, dir: 1 | -1) =>
    Array.from({ length: 21 }, (_, i) => `${i * 10},${y + (i % 2 ? 6 * dir : 0)}`).join(" L ");
  return (
    <div className={`cx-pack${shake ? " cx-pack-shake" : ""}`}>
      <svg viewBox="0 0 200 300" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-foil`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.bg1} />
            <stop offset="45%" stopColor={p.bg0} />
            <stop offset="100%" stopColor={p.bg1} />
          </linearGradient>
          <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="48%" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="52%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={`${uid}-glow`}>
            <stop offset="0%" stopColor={p.g} stopOpacity="0.7" />
            <stop offset="100%" stopColor={p.g} stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={`M ${crimp(8, -1)} L 200,292 L ${crimp(292, 1).split(" L ").reverse().join(" L ")} Z`} fill={`url(#${uid}-foil)`} stroke={p.a} strokeWidth="1.2" />
        <rect x="0" y="22" width="200" height="1" fill={p.a} opacity="0.5" />
        <rect x="0" y="276" width="200" height="1" fill={p.a} opacity="0.5" />
        <circle cx="100" cy="128" r="80" fill={`url(#${uid}-glow)`} />
        <g fill="none" stroke={p.a} opacity="0.85">
          <circle cx="100" cy="128" r="52" strokeWidth="1.4" />
          <circle cx="100" cy="128" r="46" strokeWidth="0.7" strokeDasharray="2 3" />
          <path d="M100 82 L140 151 L60 151 Z" strokeWidth="1" />
          <path d="M100 174 L60 105 L140 105 Z" strokeWidth="1" />
        </g>
        <text x="100" y="138" textAnchor="middle" fontSize="30" fontWeight="700" fill={p.h} fontFamily="var(--font-display), sans-serif">{seasonNumeral}</text>
        <text x="100" y="44" textAnchor="middle" fontSize="9" letterSpacing="4" fill={p.a} fontFamily="monospace">CULTCODEX</text>
        <text x="100" y="212" textAnchor="middle" fontSize="13" fontWeight="700" fill={p.h} fontFamily="var(--font-display), sans-serif">{name.toUpperCase()}</text>
        <text x="100" y="230" textAnchor="middle" fontSize="7.5" letterSpacing="3" fill={p.a} fontFamily="monospace">SEASON {seasonNumeral}{count ? ` · ${count} CARDS` : ""}</text>
        <rect className="cx-pack-sheen" x="-200" y="0" width="200" height="300" fill={`url(#${uid}-sheen)`} />
      </svg>
    </div>
  );
}
