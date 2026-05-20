"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import {
  RARITY_STYLE,
  RARITY_LABEL,
  CARD_TYPE_GLYPH,
  CARD_TYPE_LABEL,
  STAT_LABELS,
} from "@/lib/cards/rarity";
import type { Rarity, CardType } from "@/generated/prisma/client";

export interface TradingCardData {
  id: string;
  slug: string;
  cardType: CardType;
  rarity: Rarity;
  title: string;
  subtitle?: string | null;
  flavourText?: string | null;
  artUrl?: string | null;
  statA: number;
  statB: number;
  statC: number;
  abilities: string[];
  isFoil?: boolean;
  isNew?: boolean;
  totalMinted?: number;
  maxSupply?: number | null;
}

interface TradingCardProps {
  card: TradingCardData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  /** Show card face-down (for pack reveal) */
  faceDown?: boolean;
  /** Disable hover tilt (for grid views) */
  noTilt?: boolean;
}

const SIZE_MAP = {
  sm: { width: 140, height: 196, scale: 0.7 },
  md: { width: 200, height: 280, scale: 1 },
  lg: { width: 280, height: 392, scale: 1.4 },
} as const;

const STAT_BAR_COLOR: Record<Rarity, string> = {
  STATIC:       "var(--term-fg-dim)",
  SIGNAL:       "var(--neon)",
  TRANSMISSION: "var(--neon-4)",
  ANOMALY:      "var(--neon-3)",
  ORACLE:       "var(--neon-5)",
  FORBIDDEN:    "#FFD700",
  GLITCHED:     "#E040FB",
  LIVING:       "#00FF9C",
};

export function TradingCard({ card, size = "md", onClick, faceDown = false, noTilt = false }: TradingCardProps) {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const { width, height } = SIZE_MAP[size];
  const rarityStyle = RARITY_STYLE[card.rarity];
  const barColor = STAT_BAR_COLOR[card.rarity];
  const statLabels = STAT_LABELS[card.cardType];
  const glyph = CARD_TYPE_GLYPH[card.cardType];
  const typeLabel = CARD_TYPE_LABEL[card.cardType];

  const isFoil = card.isFoil;
  const isHighValue = card.rarity === "ANOMALY" || card.rarity === "ORACLE";

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (noTilt || faceDown) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }

  const tiltX = noTilt || faceDown ? 0 : (mousePos.y - 0.5) * -12;
  const tiltY = noTilt || faceDown ? 0 : (mousePos.x - 0.5) * 12;

  const cardStyle: CSSProperties = {
    width,
    height,
    position: "relative",
    cursor: onClick ? "pointer" : "default",
    transition: "transform 200ms ease",
    transform: hovered && !noTilt
      ? `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.04)`
      : "perspective(600px) rotateX(0) rotateY(0) scale(1)",
    borderRadius: 8,
    flexShrink: 0,
  };

  if (faceDown) {
    return (
      <div style={cardStyle} onClick={onClick}>
        <CardBack width={width} height={height} />
      </div>
    );
  }

  const borderColor = rarityStyle.color;
  const glowShadow = rarityStyle.glow;

  const containerStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    border: `1.5px solid ${borderColor}`,
    boxShadow: hovered && glowShadow !== "none"
      ? `${glowShadow}, inset 0 0 30px rgba(0,0,0,0.6)`
      : `inset 0 0 30px rgba(0,0,0,0.6)`,
    backgroundColor: "var(--term-bg)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    transition: "box-shadow 200ms ease",
  };

  // Art area height: ~52% of card
  const artHeight = Math.round(height * 0.52);
  // Foil shimmer overlay
  const foilOverlay: CSSProperties | undefined = isFoil ? {
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    background: `linear-gradient(
      105deg,
      transparent 35%,
      rgba(255,255,255,0.12) 45%,
      rgba(${card.rarity === "ORACLE" ? "255,56,96" : card.rarity === "ANOMALY" ? "255,43,214" : "255,184,0"},0.18) 50%,
      rgba(255,255,255,0.12) 55%,
      transparent 65%
    )`,
    backgroundSize: "200% 200%",
    animation: hovered ? "foilShimmer 1.5s ease infinite" : "none",
    pointerEvents: "none",
    zIndex: 10,
  } : undefined;

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter") onClick(); } : undefined}
      aria-label={`${card.title} — ${RARITY_LABEL[card.rarity]} ${typeLabel} card`}
    >
      <div style={containerStyle}>
        {/* Scan-line texture overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
          pointerEvents: "none",
          zIndex: 2,
          borderRadius: 8,
        }} />

        {/* Header bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 7px 4px",
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: "rgba(0,0,0,0.35)",
          position: "relative",
          zIndex: 3,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: borderColor,
            letterSpacing: "0.1em",
            textShadow: glowShadow !== "none" ? glowShadow : undefined,
          }}>
            {glyph} {typeLabel}
          </span>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: borderColor,
            letterSpacing: "0.08em",
            textShadow: glowShadow !== "none" ? glowShadow : undefined,
          }}>
            {RARITY_LABEL[card.rarity]}
            {isFoil && " ✦"}
          </span>
        </div>

        {/* Art area */}
        <div style={{
          height: artHeight,
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
          backgroundColor: "var(--term-bg-2)",
        }}>
          {card.artUrl ? (
            <Image
              src={card.artUrl}
              alt={card.title}
              fill
              className="object-cover"
              sizes={`${width}px`}
            />
          ) : (
            <PlaceholderArt cardType={card.cardType} rarity={card.rarity} color={borderColor} glyph={glyph} />
          )}
          {/* Art gradient fade at bottom */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "linear-gradient(to top, var(--term-bg) 0%, transparent 100%)",
          }} />
          {/* NEW badge */}
          {card.isNew && (
            <div style={{
              position: "absolute",
              top: 6,
              right: 6,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 8,
              color: "var(--neon)",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid var(--neon)",
              borderRadius: 2,
              padding: "1px 4px",
              letterSpacing: "0.1em",
              textShadow: "var(--glow-neon)",
            }}>NEW</div>
          )}
        </div>

        {/* Name section */}
        <div style={{ padding: "6px 8px 4px", flexShrink: 0, position: "relative", zIndex: 3 }}>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: size === "sm" ? 9 : 11,
            fontWeight: 700,
            color: "var(--term-fg)",
            letterSpacing: "0.04em",
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}>
            {card.title}
          </div>
          {card.subtitle && (
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 8,
              color: "var(--term-fg-dim)",
              letterSpacing: "0.06em",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {card.subtitle}
            </div>
          )}
        </div>

        {/* Stats section */}
        <div style={{
          padding: "0 8px 6px",
          flexShrink: 0,
          position: "relative",
          zIndex: 3,
          borderTop: `1px solid rgba(${hexToRgb(borderColor)},0.25)`,
          marginTop: 4,
          paddingTop: 5,
        }}>
          {[
            { label: statLabels[0], val: card.statA },
            { label: statLabels[1], val: card.statB },
            { label: statLabels[2], val: card.statC },
          ].map(({ label, val }) => (
            <StatBar key={label} label={label} value={val} color={barColor} size={size} />
          ))}
        </div>

        {/* Abilities */}
        {card.abilities.length > 0 && size !== "sm" && (
          <div style={{
            padding: "3px 8px 4px",
            flexShrink: 0,
            position: "relative",
            zIndex: 3,
            borderTop: `1px solid rgba(${hexToRgb(borderColor)},0.15)`,
          }}>
            {card.abilities.slice(0, 2).map((ability) => (
              <div key={ability} style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 8,
                color: borderColor,
                letterSpacing: "0.06em",
                lineHeight: 1.4,
                marginBottom: 1,
              }}>
                ▸ {ability}
              </div>
            ))}
          </div>
        )}

        {/* Flavour text */}
        {card.flavourText && size === "lg" && (
          <div style={{
            padding: "3px 8px",
            flexShrink: 0,
            position: "relative",
            zIndex: 3,
          }}>
            <div style={{
              fontFamily: "var(--font-serif), serif",
              fontStyle: "italic",
              fontSize: 8,
              color: "var(--term-fg-faint)",
              lineHeight: 1.5,
              borderLeft: `2px solid rgba(${hexToRgb(borderColor)},0.3)`,
              paddingLeft: 5,
            }}>
              "{card.flavourText}"
            </div>
          </div>
        )}

        {/* Footer: serial number */}
        <div style={{
          marginTop: "auto",
          padding: "3px 8px 5px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid rgba(${hexToRgb(borderColor)},0.15)`,
          flexShrink: 0,
          position: "relative",
          zIndex: 3,
        }}>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 8,
            color: "var(--term-fg-faint)",
            letterSpacing: "0.06em",
          }}>
            CODEX
          </span>
          {card.maxSupply && (
            <span style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 8,
              color: "var(--term-fg-faint)",
              letterSpacing: "0.06em",
            }}>
              {card.totalMinted?.toLocaleString() ?? "?"}/{card.maxSupply.toLocaleString()}
            </span>
          )}
        </div>

        {/* Foil shimmer */}
        {foilOverlay && <div style={foilOverlay} aria-hidden="true" />}

        {/* Pulse ring for ANOMALY/ORACLE on hover */}
        {isHighValue && hovered && (
          <div style={{
            position: "absolute",
            inset: -3,
            borderRadius: 10,
            border: `1.5px solid ${borderColor}`,
            animation: "pulseRing 1.5s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }} aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function StatBar({ label, value, color, size }: { label: string; value: number; color: string; size: "sm" | "md" | "lg" }) {
  return (
    <div style={{ marginBottom: size === "sm" ? 2 : 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 7, color: "var(--term-fg-dim)", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 7, color, letterSpacing: "0.04em" }}>
          {value}
        </span>
      </div>
      <div style={{ height: 3, backgroundColor: "var(--term-line)", borderRadius: 1, overflow: "hidden" }}>
        <div style={{
          width: `${value}%`,
          height: "100%",
          backgroundColor: color,
          boxShadow: `0 0 4px ${color}`,
          transition: "width 600ms ease",
        }} />
      </div>
    </div>
  );
}

function PlaceholderArt({ cardType, rarity, color, glyph }: { cardType: CardType; rarity: Rarity; color: string; glyph: string }) {
  const gradients: Record<CardType, string> = {
    VOICE:        "radial-gradient(circle at 50% 60%, rgba(0,229,255,0.12) 0%, transparent 70%)",
    TRANSMISSION: "radial-gradient(circle at 50% 50%, rgba(0,255,156,0.1) 0%, transparent 70%)",
    LORE:         "radial-gradient(circle at 50% 40%, rgba(255,184,0,0.12) 0%, transparent 70%)",
    SIGNAL:       "radial-gradient(circle at 50% 50%, rgba(179,136,255,0.1) 0%, transparent 70%)",
    ORACLE:       "radial-gradient(circle at 50% 50%, rgba(255,56,96,0.12) 0%, transparent 70%)",
    CIPHER:       "radial-gradient(circle at 50% 50%, rgba(255,43,214,0.1) 0%, transparent 70%)",
    RELIC:        "radial-gradient(circle at 50% 50%, rgba(255,215,0,0.10) 0%, transparent 70%)",
    ENTITY:       "radial-gradient(circle at 50% 50%, rgba(206,147,216,0.12) 0%, transparent 70%)",
    PROPHECY:     "radial-gradient(circle at 50% 40%, rgba(255,128,171,0.12) 0%, transparent 70%)",
    MEMBER:       "radial-gradient(circle at 50% 60%, rgba(128,222,234,0.10) 0%, transparent 70%)",
    GLITCH:       "radial-gradient(circle at 50% 50%, rgba(255,109,0,0.12) 0%, transparent 70%)",
    MAHAVIDYA:    "radial-gradient(circle at 50% 40%, rgba(255,152,0,0.15) 0%, transparent 70%)",
    AVATAR:       "radial-gradient(circle at 50% 60%, rgba(179,157,219,0.12) 0%, transparent 70%)",
    INCIDENT:     "radial-gradient(circle at 50% 50%, rgba(239,83,80,0.12) 0%, transparent 70%)",
  };

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: gradients[cardType],
      position: "relative",
    }}>
      {/* Geometric grid lines */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
        <defs>
          <pattern id={`grid-${cardType}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${cardType})`} />
      </svg>
      <span style={{
        fontSize: 48,
        color,
        textShadow: `0 0 20px ${color}`,
        opacity: rarity === "STATIC" ? 0.4 : 0.7,
        position: "relative",
        zIndex: 1,
        lineHeight: 1,
      }}>
        {glyph}
      </span>
    </div>
  );
}

function CardBack({ width, height }: { width: number; height: number }) {
  return (
    <div style={{
      width,
      height,
      borderRadius: 8,
      border: "1.5px solid var(--term-line)",
      backgroundColor: "var(--term-bg)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
        <defs>
          <pattern id="back-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--neon)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#back-grid)" />
      </svg>
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{
          fontSize: 32,
          color: "var(--neon)",
          textShadow: "var(--glow-neon)",
          marginBottom: 8,
          lineHeight: 1,
        }}>◉</div>
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 9,
          color: "var(--neon)",
          letterSpacing: "0.3em",
          textShadow: "var(--glow-neon)",
        }}>CODEX</div>
      </div>
    </div>
  );
}

/** Fallback: returns a raw rgb string or the color value for CSS rgba() */
function hexToRgb(cssVar: string): string {
  // For known vars, return their RGB components
  const map: Record<string, string> = {
    "var(--neon)":        "0,255,156",
    "var(--neon-2)":      "0,229,255",
    "var(--neon-3)":      "255,43,214",
    "var(--neon-4)":      "255,184,0",
    "var(--neon-5)":      "255,56,96",
    "var(--term-fg-dim)": "120,140,160",
  };
  return map[cssVar] ?? "120,140,160";
}
