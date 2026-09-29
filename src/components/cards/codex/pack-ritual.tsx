"use client";

/**
 * Full-screen pack opening: tear the foil, then turn each card over. Cards
 * arrive rarest-last so the best pull is always the final flip.
 * Works for store packs (`/api/cards/open-pack`) and the Initiation Pack.
 */
import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import type { Rarity } from "@/generated/prisma/client";
import { RARITY_ORDER } from "@/lib/cards/rarity";
import type { Palette } from "@/lib/cards/codex/types";
import { getAudioPref } from "@/lib/appearance";
import { playBell, playChime } from "@/lib/audio/ambient-engine";
import { CodexCard, CodexCardBack, RARITY_COLOR, type CodexCardData } from "./codex-card";
import { PackArt } from "./pack-art";

type RitualCard = CodexCardData & { id: string; isFoil: boolean };
type Phase = "sealed" | "tearing" | "reveal" | "error";

export function PackRitual({
  title,
  theme,
  count,
  endpoint,
  body,
  onClose,
}: {
  title: string;
  theme: Palette;
  count: number;
  endpoint: string;
  body?: Record<string, unknown>;
  onClose: (opened: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>("sealed");
  const [cards, setCards] = useState<RitualCard[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [bonus, setBonus] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && phase !== "tearing") onClose(cards.length > 0); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, cards.length, onClose]);

  async function tear() {
    setPhase("tearing");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "The pack wouldn't open.");
      const sorted = [...(json.cards as RitualCard[])].sort(
        (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || Number(a.isFoil) - Number(b.isFoil),
      );
      const extra = (json.bonusCredits ?? 0) + sorted.reduce((s, c) => s + ((c as { bonusCredits?: number }).bonusCredits ?? 0), 0);
      setBonus(extra);
      setTimeout(() => { setCards(sorted); setPhase("reveal"); }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The pack wouldn't open.");
      setPhase("error");
    }
  }

  function flip(i: number) {
    if (revealed.has(i)) return;
    setRevealed((s) => new Set(s).add(i));
    const c = cards[i];
    if (getAudioPref() === "on") (RARITY_ORDER[c.rarity as Rarity] >= RARITY_ORDER.ANOMALY ? playBell : playChime)();
  }

  const allRevealed = cards.length > 0 && revealed.size === cards.length;
  const best = cards[cards.length - 1];

  return (
    <div className="cx-ritual" role="dialog" aria-modal="true" aria-label={`Opening ${title}`}>
      <button type="button" className="cx-ritual-close" onClick={() => onClose(cards.length > 0)} disabled={phase === "tearing"} aria-label="Close">✕</button>

      {(phase === "sealed" || phase === "tearing" || phase === "error") && (
        <div className="cx-ritual-sealed">
          <div className={`cx-ritual-pack${phase === "tearing" ? " is-tearing" : ""}`}>
            <PackArt name={title} theme={theme} count={count} shake={phase === "tearing"} />
          </div>
          {phase === "error" ? (
            <p className="cx-ritual-error" role="alert">{error}</p>
          ) : (
            <button type="button" className="cx-btn cx-btn-primary" onClick={tear} disabled={phase === "tearing"}>
              {phase === "tearing" ? "Tearing…" : "Tear it open"}
            </button>
          )}
        </div>
      )}

      {phase === "reveal" && (
        <div className="cx-ritual-reveal">
          <p className="cx-ritual-hint">{allRevealed ? "Added to your Codex." : "Tap each card to turn it over."}</p>
          <div className="cx-ritual-row" data-count={cards.length}>
            {cards.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                className={`cx-flip${revealed.has(i) ? " is-flipped" : ""}`}
                style={{ animationDelay: `${i * 90}ms`, "--flip-glow": RARITY_COLOR[c.rarity] } as CSSProperties}
                data-rarity={c.rarity}
              >
                <div className="cx-flip-inner">
                  <div className="cx-flip-back"><CodexCardBack glow={RARITY_COLOR[c.rarity]} onClick={() => flip(i)} /></div>
                  <div className="cx-flip-front"><CodexCard card={c} isFoil={c.isFoil} interactive={revealed.has(i)} /></div>
                </div>
              </div>
            ))}
          </div>
          <div className="cx-ritual-actions">
            {!allRevealed ? (
              <button type="button" className="cx-btn" onClick={() => setRevealed(new Set(cards.map((_, i) => i)))}>Reveal all</button>
            ) : (
              <>
                {best && <span className="cx-ritual-best" style={{ color: RARITY_COLOR[best.rarity] }}>Best pull: {best.title} · {best.rarity}</span>}
                {bonus > 0 && <span className="cx-ritual-bonus">+{bonus} Signal Credits</span>}
                <Link href="/cards" className="cx-btn cx-btn-primary" onClick={() => onClose(true)}>View in Codex</Link>
                <button type="button" className="cx-btn" onClick={() => onClose(true)}>Done</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
