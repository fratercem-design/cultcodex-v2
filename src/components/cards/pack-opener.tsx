"use client";

import { useState, useCallback, useEffect, type CSSProperties } from "react";
import { TradingCard, type TradingCardData } from "./trading-card";
import { RARITY_STYLE, RARITY_ORDER } from "@/lib/cards/rarity";
import type { Rarity } from "@/generated/prisma/client";

interface PackOpenerProps {
  packSlug: string;
  packTitle: string;
  packAccentColor: string;
  onClose: () => void;
}

type Phase = "sealed" | "smoldering" | "splitting" | "fanning" | "done";

// Time (ms) between each card reveal
const CARD_STAGGER = 800;
// Delay before the first card after split
const REVEAL_START = 500;

export function PackOpener({ packSlug, packTitle, packAccentColor, onClose }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [cards, setCards] = useState<TradingCardData[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [blackout, setBlackout] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the accent CSS variable string
  const accent = packAccentColor.startsWith("var(") ? packAccentColor : `var(--neon)`;

  // ── Open pack ────────────────────────────────────────────────────────
  const openPack = useCallback(async () => {
    setPhase("smoldering");
    setError(null);

    try {
      const res = await fetch("/api/cards/open-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Pack open failed");

      // Sort: lowest rarity first so highest reveals last
      const sorted: TradingCardData[] = [...(json.cards as TradingCardData[])].sort(
        (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
      );

      // Splitting phase
      setPhase("splitting");

      setTimeout(() => {
        setCards(sorted);
        setPhase("fanning");

        sorted.forEach((card, i) => {
          const delay = REVEAL_START + i * CARD_STAGGER;
          const isMythic = RARITY_ORDER[card.rarity] >= RARITY_ORDER.MYTHIC;
          const isForbidden = card.rarity === "FORBIDDEN";

          if (isForbidden) {
            // Black out → then reveal
            setTimeout(() => setBlackout(true), delay);
            setTimeout(() => {
              setBlackout(false);
              setRevealed((p) => new Set([...p, i]));
            }, delay + 900);
          } else {
            setTimeout(() => {
              setRevealed((p) => new Set([...p, i]));
              if (isMythic) {
                setShaking(true);
                setTimeout(() => setShaking(false), 600);
              }
            }, delay);
          }
        });

        // Done after all cards + a beat
        const totalTime = REVEAL_START + sorted.length * CARD_STAGGER + 800;
        setTimeout(() => setPhase("done"), totalTime);
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("sealed");
    }
  }, [packSlug]);

  // ── ESC to cancel (sealed phase only) ────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && (phase === "sealed" || phase === "done")) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, onClose]);

  const allRevealed = cards.length > 0 && revealed.size === cards.length;
  const highestRarity = cards.reduce<Rarity>(
    (best, c) => RARITY_ORDER[c.rarity] > RARITY_ORDER[best] ? c.rarity : best,
    "STATIC"
  );

  // ── Overlay ───────────────────────────────────────────────────────────
  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(4,3,8,0.97)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    animation: shaking ? "screenShake 0.5s ease" : undefined,
    transition: "background 600ms ease",
    overflowY: "auto",
  };

  // ── Blackout overlay ──────────────────────────────────────────────────
  if (blackout) return (
    <div style={{ ...overlayStyle, backgroundColor: "#000", justifyContent: "center" }}>
      <div style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        color: "#FF1744",
        letterSpacing: "0.3em",
        animation: "termBlink 0.6s step-end infinite",
      }}>
        ◣ FORBIDDEN ◣
      </div>
    </div>
  );

  // ── Sealed / smoldering / splitting phases ────────────────────────────
  if (phase === "sealed" || phase === "smoldering" || phase === "splitting") {
    return (
      <div style={overlayStyle}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
          <PackVisual
            accent={accent}
            title={packTitle}
            phase={phase}
          />

          <div style={{ minHeight: 48 }}>
            {phase === "sealed" && (
              <>
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
                <button
                  onClick={openPack}
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 12,
                    letterSpacing: "0.15em",
                    color: accent,
                    background: "transparent",
                    border: `1px solid ${accent}`,
                    padding: "11px 32px",
                    cursor: "pointer",
                    textShadow: `0 0 8px ${accent}`,
                    transition: "background 120ms ease, box-shadow 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${accent}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  ▸ INITIATE SEQUENCE
                </button>
              </>
            )}
            {phase === "smoldering" && (
              <div style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: "#c8392e",
                letterSpacing: "0.22em",
                animation: "termBlink 0.5s step-end infinite",
              }}>
                SMOLDERING
              </div>
            )}
            {phase === "splitting" && (
              <div style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                color: accent,
                letterSpacing: "0.22em",
                opacity: 0.7,
              }}>
                ·
              </div>
            )}
          </div>

          {phase === "sealed" && (
            <button
              onClick={onClose}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                color: "var(--term-fg-faint)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              ← CANCEL  [ESC]
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Fanning / done phases ─────────────────────────────────────────────
  return (
    <div style={overlayStyle}>
      {/* Pack title */}
      <div style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        color: accent,
        letterSpacing: "0.32em",
        marginBottom: 28,
        textShadow: `0 0 10px ${accent}`,
        opacity: 0.9,
      }}>
        {"// "}{packTitle}
      </div>

      {/* Card fan */}
      <div style={{
        display: "flex",
        gap: "clamp(8px, 2vw, 20px)",
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 960,
        alignItems: "flex-end",
      }}>
        {cards.map((card, i) => {
          const isRevealed = revealed.has(i);
          const rarityS = RARITY_STYLE[card.rarity];
          const isHighValue = RARITY_ORDER[card.rarity] >= RARITY_ORDER.ANOMALY;
          const isMythic = RARITY_ORDER[card.rarity] >= RARITY_ORDER.MYTHIC;

          return (
            <div
              key={card.id}
              style={{
                position: "relative",
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? "translateY(0) scale(1)" : "translateY(40px) scale(0.88)",
                transition: "opacity 500ms cubic-bezier(0.22,1,0.36,1), transform 600ms cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {/* Aura ring for high-value cards */}
              {isRevealed && isHighValue && (
                <div style={{
                  position: "absolute",
                  inset: -14,
                  borderRadius: 12,
                  background: `radial-gradient(circle, ${rarityS.color}28 0%, transparent 70%)`,
                  animation: "pulseRing 2.5s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              )}

              {/* Mythic crown label */}
              {isRevealed && isMythic && (
                <div style={{
                  position: "absolute",
                  top: -26,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  letterSpacing: "0.22em",
                  color: rarityS.color,
                  textShadow: rarityS.glow,
                  whiteSpace: "nowrap",
                  animation: "termBlink 2s step-end 4",
                }}>
                  ✦ {card.rarity}
                </div>
              )}

              <TradingCard card={{ ...card, isNew: true }} size="md" noTilt={false} />
            </div>
          );
        })}
      </div>

      {/* Post-reveal summary + CTA */}
      {allRevealed && (
        <div style={{
          marginTop: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          animation: "fadeIn 500ms ease",
        }}>
          {RARITY_ORDER[highestRarity] >= RARITY_ORDER.ANOMALY && (
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 10,
              color: RARITY_STYLE[highestRarity].color,
              letterSpacing: "0.2em",
              textShadow: RARITY_STYLE[highestRarity].glow,
              marginBottom: 8,
            }}>
              ✦ {highestRarity} OBTAINED
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "var(--neon)",
                background: "transparent",
                border: "1px solid var(--neon)",
                padding: "9px 24px",
                cursor: "pointer",
                textShadow: "var(--glow-neon)",
              }}
            >
              COLLECT →
            </button>
          </div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 9,
            color: "var(--term-fg-faint)",
            letterSpacing: "0.08em",
          }}>
            [ESC] close
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pack visual component ─────────────────────────────────────────────────────

function PackVisual({ accent, title, phase }: { accent: string; title: string; phase: Phase }) {
  const isSmoldering = phase === "smoldering";
  const isSplitting = phase === "splitting";

  const baseStyle: CSSProperties = {
    width: 180,
    height: 260,
    border: `2px solid ${accent}`,
    background: "var(--term-bg)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 0 24px rgba(0,0,0,0.6), 0 0 40px ${accent}30`,
  };

  if (isSplitting) {
    // Show two halves flying apart
    const halfBase: CSSProperties = {
      width: 180,
      height: 128,
      border: `1px solid ${accent}`,
      background: "var(--term-bg)",
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      overflow: "hidden",
    };
    return (
      <div style={{ position: "relative", width: 180, height: 260 }}>
        <div style={{
          ...halfBase,
          top: 0,
          animation: "splitTop 0.6s ease forwards",
        }}>
          <div style={{ position: "absolute", inset: 0, background: `${accent}18` }} />
        </div>
        <div style={{
          ...halfBase,
          bottom: 0,
          animation: "splitBottom 0.6s ease forwards",
        }}>
          <div style={{ position: "absolute", inset: 0, background: `${accent}18` }} />
        </div>
        {/* Flash */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "#fff",
          opacity: 0,
          animation: "fadeIn 0.1s ease 0.1s forwards, fadeIn 0.3s ease reverse 0.2s forwards",
          pointerEvents: "none",
        }} />
      </div>
    );
  }

  return (
    <div style={{
      ...baseStyle,
      animation: isSmoldering
        ? "packShake 0.12s ease infinite, packSmolder 0.6s ease infinite"
        : undefined,
      transition: "box-shadow 400ms ease",
    }}>
      {/* Grid texture */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none" }}>
        <defs>
          <pattern id="og-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke={accent} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#og-grid)" />
      </svg>

      {/* Top stripe */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 7,
        background: `repeating-linear-gradient(90deg, ${accent}44 0px, ${accent}44 5px, transparent 5px, transparent 11px)`,
        borderBottom: `1px solid ${accent}44`,
      }} />

      {/* Ember glow overlay when smoldering */}
      {isSmoldering && (
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 50% 80%, rgba(200,57,46,0.35) 0%, transparent 70%)`,
          animation: "pulseRing 0.5s ease infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Icon + title */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontSize: 44,
          color: accent,
          textShadow: `0 0 ${isSmoldering ? 40 : 20}px ${accent}`,
          lineHeight: 1,
          marginBottom: 12,
          transition: "text-shadow 300ms ease",
        }}>
          ◉
        </div>
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          color: accent,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textShadow: `0 0 8px ${accent}`,
          lineHeight: 1.5,
          maxWidth: 130,
        }}>
          {title}
        </div>
        <div style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 8,
          color: "var(--term-fg-faint)",
          letterSpacing: "0.22em",
          marginTop: 8,
        }}>
          SIGNAL PACK
        </div>
      </div>

      {/* Bottom stripe */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 7,
        background: `repeating-linear-gradient(90deg, ${accent}44 0px, ${accent}44 5px, transparent 5px, transparent 11px)`,
        borderTop: `1px solid ${accent}44`,
      }} />
    </div>
  );
}
