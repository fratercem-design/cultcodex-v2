"use client";

import { useState } from "react";
import Link from "next/link";

type Rarity = "STATIC" | "SIGNAL" | "TRANSMISSION" | "ANOMALY" | "ORACLE" | "LEGENDARY" | "MYTHIC" | "FORBIDDEN";

interface DrawnCard {
  slug: string;
  title: string;
  subtitle: string | null;
  flavourText: string | null;
  cardType: string;
  rarity: Rarity;
  abilities: string[];
  artSvg: string;
}

const RARITY_COLOR: Record<Rarity, string> = {
  STATIC:       "#9CBBAD",
  SIGNAL:       "#00FF9C",
  TRANSMISSION: "#FFB800",
  ANOMALY:      "#FF2BD6",
  ORACLE:       "#FF3860",
  LEGENDARY:    "#FFD700",
  MYTHIC:       "#E040FB",
  FORBIDDEN:    "#FF1744",
};

const SPREADS = [
  {
    key: "signal",
    count: 1,
    label: "THE SIGNAL",
    desc: "Single card",
    positions: ["THE SIGNAL"],
  },
  {
    key: "triad",
    count: 3,
    label: "THE TRIAD",
    desc: "Three-card reading",
    positions: ["SHADOW", "SIGNAL", "ORACLE"],
  },
  {
    key: "protocol",
    count: 5,
    label: "THE PROTOCOL",
    desc: "Full five-position",
    positions: ["FOUNDATION", "CHALLENGE", "SHADOW", "SIGNAL", "ORACLE"],
  },
];

export default function OraclePage() {
  const [spread, setSpread] = useState(SPREADS[1]!);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawn, setDrawn] = useState(false);

  async function pullReading() {
    if (loading) return;
    setLoading(true);
    setDrawn(false);
    setCards([]);
    try {
      const res = await fetch(`/api/tarot/reading?count=${spread.count}`);
      const data = (await res.json()) as DrawnCard[];
      setCards(data);
      setDrawn(true);
    } catch {
      // silently fail — keep showing empty state
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100%",
        backgroundColor: "var(--term-bg)",
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        padding: "32px 24px 64px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 10, color: "var(--term-fg-faint)", letterSpacing: "0.12em", marginBottom: 32 }}>
          <Link href="/tarot" style={{ color: "var(--term-fg-faint)", textDecoration: "none" }}>
            TAROT
          </Link>
          {" / "}
          <span style={{ color: "var(--neon-3)" }}>ARCANUM ORACLE</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: 10,
            color: "var(--neon-3)",
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            textShadow: "0 0 8px currentColor",
            marginBottom: 10,
          }}>
            {"// CULT OF PSYCHE ARCANUM ORACLE"}
          </p>
          <h1 style={{ fontSize: 26, color: "var(--term-fg)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
            Arcanum Oracle
          </h1>
          <p style={{ fontSize: 11, color: "var(--term-fg-dim)", lineHeight: 1.6, maxWidth: 480, margin: 0 }}>
            80 cards drawn from the Cult of Psyche archive. Every card a signal.
            Select a spread and pull your reading.
          </p>
        </div>

        {/* Spread selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {SPREADS.map((s) => (
            <button
              key={s.key}
              onClick={() => { setSpread(s); setDrawn(false); setCards([]); }}
              style={{
                padding: "8px 18px",
                background: "transparent",
                border: `1px solid ${spread.key === s.key ? "var(--neon-3)" : "var(--term-line-2)"}`,
                borderRadius: 4,
                color: spread.key === s.key ? "var(--neon-3)" : "var(--term-fg-faint)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                letterSpacing: "0.12em",
                cursor: "pointer",
                textTransform: "uppercase",
                textShadow: spread.key === s.key ? "0 0 6px currentColor" : "none",
                transition: "all 120ms",
              }}
            >
              {s.label}
              <span style={{ opacity: 0.5, marginLeft: 6, fontSize: 9 }}>— {s.desc}</span>
            </button>
          ))}
        </div>

        {/* Pull button */}
        <button
          onClick={pullReading}
          disabled={loading}
          style={{
            padding: "12px 32px",
            background: "transparent",
            border: "1px solid var(--neon-3)",
            borderRadius: 4,
            color: "var(--neon-3)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 12,
            letterSpacing: "0.14em",
            cursor: loading ? "wait" : "pointer",
            textShadow: "0 0 6px currentColor",
            marginBottom: 48,
            opacity: loading ? 0.5 : 1,
            transition: "opacity 120ms",
            textTransform: "uppercase",
          }}
        >
          {loading ? "DRAWING FROM THE ARCHIVE..." : drawn ? "DRAW AGAIN ▸" : "PULL READING ▸"}
        </button>

        {/* Empty state */}
        {!drawn && !loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 240,
            border: "1px dashed var(--term-line)",
            borderRadius: 8,
            color: "var(--term-fg-faint)",
            fontSize: 10,
            letterSpacing: "0.14em",
          }}>
            SELECT A SPREAD AND PULL YOUR READING
          </div>
        )}

        {/* Cards */}
        {drawn && cards.length > 0 && (
          <div style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            justifyContent: cards.length === 1 ? "flex-start" : "center",
          }}>
            {cards.map((card, i) => (
              <CardDisplay
                key={`${card.slug}-${i}`}
                card={card}
                position={spread.positions[i] ?? ""}
                color={RARITY_COLOR[card.rarity] ?? "#9CBBAD"}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}

function CardDisplay({
  card,
  position,
  color,
}: {
  card: DrawnCard;
  position: string;
  color: string;
}) {
  return (
    <div style={{ width: 196, flexShrink: 0 }}>

      {/* Position label */}
      <div style={{
        fontSize: 8,
        color: "var(--neon-3)",
        letterSpacing: "0.22em",
        textAlign: "center",
        marginBottom: 8,
        opacity: 0.75,
        textShadow: "0 0 6px currentColor",
      }}>
        {position}
      </div>

      {/* Art */}
      <div style={{
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${color}55`,
        boxShadow: `0 0 16px ${color}18, 0 0 4px ${color}30`,
        marginBottom: 10,
        lineHeight: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(card.artSvg)}`}
          alt={card.title}
          width={196}
          height={274}
          style={{ width: "100%", height: "auto", display: "block" }}
        />
      </div>

      {/* Info */}
      <div>
        <div style={{
          fontSize: 8,
          color,
          letterSpacing: "0.1em",
          marginBottom: 4,
          textShadow: `0 0 4px ${color}66`,
        }}>
          {card.rarity} · {card.cardType}
        </div>

        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--term-fg)",
          lineHeight: 1.3,
          marginBottom: 3,
          letterSpacing: "0.02em",
        }}>
          {card.title}
        </div>

        {card.subtitle && (
          <div style={{
            fontSize: 9,
            color: "var(--term-fg-dim)",
            letterSpacing: "0.04em",
            marginBottom: 8,
          }}>
            {card.subtitle}
          </div>
        )}

        {card.flavourText && (
          <div style={{
            fontSize: 9,
            color: "var(--term-fg-faint)",
            lineHeight: 1.65,
            fontStyle: "italic",
            borderLeft: `2px solid ${color}55`,
            paddingLeft: 8,
          }}>
            &ldquo;{card.flavourText}&rdquo;
          </div>
        )}

        {card.abilities.length > 0 && (
          <div style={{
            marginTop: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 4,
          }}>
            {card.abilities.slice(0, 2).map((ab) => (
              <span
                key={ab}
                style={{
                  fontSize: 7,
                  color: color,
                  border: `1px solid ${color}44`,
                  borderRadius: 2,
                  padding: "1px 5px",
                  letterSpacing: "0.06em",
                }}
              >
                {ab}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
