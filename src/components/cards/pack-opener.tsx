"use client";

import { useState, useCallback, type CSSProperties } from "react";
import { TradingCard, type TradingCardData } from "./trading-card";
import { RARITY_STYLE, RARITY_ORDER, cardPoints } from "@/lib/cards/rarity";
import { getAudioPref } from "@/lib/appearance";
import { playChime, playBell } from "@/lib/audio/ambient-engine";

interface PackOpenerProps {
  packSlug: string;
  packTitle: string;
  packAccentColor: string;
  onClose: () => void;
}

type Phase = "sealed" | "tearing" | "revealing" | "done";

export function PackOpener({ packSlug, packTitle, packAccentColor, onClose }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [cards, setCards] = useState<TradingCardData[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalBonusCredits, setTotalBonusCredits] = useState(0);
  const [totalSignalPower, setTotalSignalPower] = useState(0);

  const accentVar = `var(--${packAccentColor === "neon" ? "neon" : packAccentColor === "amber" ? "neon-4" : packAccentColor === "magenta" ? "neon-3" : packAccentColor === "crimson" ? "neon-5" : "neon-2"})`;

  const openPack = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setPhase("tearing");

    try {
      const res = await fetch("/api/cards/open-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pack open failed");

      // Sort: common first, epic/legendary last (most dramatic reveal)
      const sorted = [...json.cards].sort(
        (a: TradingCardData, b: TradingCardData) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
      );

      const bonusTotal = sorted.reduce((s: number, c: TradingCardData) => s + (c.bonusCredits ?? 0), 0);
      const powerTotal = sorted.reduce((s: number, c: TradingCardData) => s + (c.signalPower ?? cardPoints(c.rarity, !!c.isFoil)), 0);
      setTotalBonusCredits(bonusTotal);
      setTotalSignalPower(powerTotal);

      setTimeout(() => {
        setCards(sorted);
        setPhase("revealing");
        setLoading(false);
        if (getAudioPref() === "on") playChime();
        // Auto-reveal cards one by one
        sorted.forEach((card: TradingCardData, i: number) => {
          setTimeout(() => {
            setRevealed((prev) => new Set([...prev, i]));
            if (getAudioPref() === "on" && RARITY_ORDER[card.rarity] >= RARITY_ORDER.MYTHIC) {
              playBell();
            }
          }, 400 + i * 600);
        });
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("sealed");
      setLoading(false);
    }
  }, [packSlug, loading]);

  const allRevealed = cards.length > 0 && revealed.size === cards.length;

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.92)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  };

  if (phase === "sealed" || phase === "tearing") {
    return (
      <div style={overlayStyle}>
        <div style={{ textAlign: "center" }}>
          {/* Pack visual */}
          <PackVisual accentColor={accentVar} title={packTitle} tearing={phase === "tearing"} />

          <div style={{ marginTop: 32 }}>
            {error && (
              <div style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "var(--neon-5)",
                marginBottom: 16,
                letterSpacing: "0.06em",
              }}>
                ✕ {error}
              </div>
            )}
            {phase === "sealed" && !loading && (
              <button
                onClick={openPack}
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: accentVar,
                  background: "transparent",
                  border: `1px solid ${accentVar}`,
                  borderRadius: 4,
                  padding: "10px 28px",
                  cursor: "pointer",
                  textShadow: `0 0 8px ${accentVar}`,
                  boxShadow: `0 0 12px rgba(0,0,0,0.5)`,
                  transition: "background 120ms ease",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
              >
                ▸ OPEN PACK
              </button>
            )}
            {phase === "tearing" && (
              <div style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "var(--term-fg-dim)",
                letterSpacing: "0.2em",
                animation: "termBlink 0.8s step-end infinite",
              }}>
                OPENING...
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              marginTop: 24,
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: "var(--term-fg-faint)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            ← CANCEL
          </button>
        </div>
      </div>
    );
  }

  // Revealing / done phase
  return (
    <div style={overlayStyle}>
      <div style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        color: accentVar,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        marginBottom: 24,
        textShadow: `0 0 8px ${accentVar}`,
      }}>
        {"// "}{packTitle}
      </div>

      {/* Card spread */}
      <div style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 900,
        alignItems: "flex-end",
      }}>
        {cards.map((card, i) => {
          const isRevealed = revealed.has(i);
          const isLast = i === cards.length - 1;
          const rarityStyle = RARITY_STYLE[card.rarity];
          const isHighValue = RARITY_ORDER[card.rarity] >= RARITY_ORDER.ANOMALY;

          return (
            <div
              key={card.id}
              style={{
                transition: "transform 500ms cubic-bezier(0.34,1.56,0.64,1), opacity 400ms ease",
                transform: isRevealed ? "translateY(0) scale(1)" : "translateY(30px) scale(0.85)",
                opacity: isRevealed ? 1 : 0,
                position: "relative",
              }}
            >
              {/* High-value flash */}
              {isRevealed && isHighValue && (
                <div style={{
                  position: "absolute",
                  inset: -12,
                  borderRadius: 16,
                  background: `radial-gradient(circle, ${rarityStyle.color}22 0%, transparent 70%)`,
                  animation: "pulseRing 2s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              )}
              {isRevealed && (
                <div style={{
                  position: "absolute",
                  bottom: -22,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  color: rarityStyle.color,
                  textShadow: rarityStyle.glow !== "none" ? rarityStyle.glow : undefined,
                  letterSpacing: "0.12em",
                  whiteSpace: "nowrap",
                  animation: "fadeIn 300ms ease",
                  display: "flex",
                  gap: 6,
                }}>
                  <span>⚡{card.signalPower ?? cardPoints(card.rarity, !!card.isFoil)}</span>
                  {(card.bonusCredits ?? 0) > 0 && (
                    <span style={{ color: "var(--neon-4)", textShadow: "0 0 6px var(--neon-4)" }}>
                      +{card.bonusCredits}cr
                    </span>
                  )}
                </div>
              )}
              {isLast && isRevealed && isHighValue && (
                <div style={{
                  position: "absolute",
                  top: -28,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  color: rarityStyle.color,
                  textShadow: rarityStyle.glow,
                  letterSpacing: "0.2em",
                  whiteSpace: "nowrap",
                  animation: "termBlink 1.5s step-end 3",
                }}>
                  ✦ {card.rarity}
                </div>
              )}
              <TradingCard card={{ ...card, isNew: true }} size="md" noTilt />
            </div>
          );
        })}
      </div>

      {allRevealed && (
        <div style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          alignItems: "center",
          animation: "fadeIn 400ms ease",
        }}>
          {/* Pull summary */}
          <div style={{
            display: "flex",
            gap: 20,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            letterSpacing: "0.12em",
            color: "var(--ink-dim)",
          }}>
            <span>
              ⚡ <span style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}>
                +{totalSignalPower.toLocaleString("en-US")} SIGNAL POWER
              </span>
            </span>
            {totalBonusCredits > 0 && (
              <span>
                ◈ <span style={{ color: "var(--neon-4)", textShadow: "0 0 6px var(--neon-4)" }}>
                  +{totalBonusCredits} BONUS CREDITS
                </span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--neon)",
              background: "transparent",
              border: "1px solid var(--neon)",
              borderRadius: 4,
              padding: "8px 20px",
              cursor: "pointer",
            }}
          >
            VIEW COLLECTION →
          </button>
        </div>
      )}
    </div>
  );
}

function PackVisual({ accentColor, title, tearing }: { accentColor: string; title: string; tearing: boolean }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={{
        width: 180,
        height: 260,
        border: `2px solid ${accentColor}`,
        borderRadius: 12,
        background: "var(--term-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 24px rgba(0,0,0,0.5), 0 0 40px ${accentColor}33`,
        animation: tearing ? "packShake 0.15s ease infinite" : undefined,
        transition: "box-shadow 300ms ease",
      }}>
        {/* Grid texture */}
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
          <defs>
            <pattern id="pack-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={accentColor} strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pack-grid)" />
        </svg>

        {/* Diagonal stripe */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `repeating-linear-gradient(90deg, ${accentColor}33 0px, ${accentColor}33 6px, transparent 6px, transparent 12px)`,
          borderBottom: `1px solid ${accentColor}44`,
        }} />

        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{
            fontSize: 40,
            color: accentColor,
            textShadow: `0 0 20px ${accentColor}`,
            lineHeight: 1,
            marginBottom: 12,
          }}>
            ◉
          </div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
            color: accentColor,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            textShadow: `0 0 8px ${accentColor}`,
            lineHeight: 1.4,
            maxWidth: 130,
          }}>
            {title}
          </div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 8,
            color: "var(--term-fg-faint)",
            letterSpacing: "0.2em",
            marginTop: 8,
          }}>
            SIGNAL PACK
          </div>
        </div>

        {/* Bottom stripe */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 8,
          background: `repeating-linear-gradient(90deg, ${accentColor}33 0px, ${accentColor}33 6px, transparent 6px, transparent 12px)`,
          borderTop: `1px solid ${accentColor}44`,
        }} />
      </div>
    </div>
  );
}
