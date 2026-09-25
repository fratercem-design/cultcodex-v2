"use client";

import type { Rarity, CardType } from "@/generated/prisma/client";
import { CodexCard, CodexCardBack } from "./codex/codex-card";

/**
 * Legacy entry point, kept so decks and member pages don't change shape.
 * Renders through the Codex frame so every card on the site matches.
 */
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
  bonusCredits?: number;
  signalPower?: number;
  season?: number;
  collectorNo?: number | null;
  obtainMethod?: string | null;
}

interface TradingCardProps {
  card: TradingCardData;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  /** Show card face-down */
  faceDown?: boolean;
  /** Disable hover tilt (for grid views) */
  noTilt?: boolean;
}

const WIDTH = { sm: 140, md: 200, lg: 280 } as const;

export function TradingCard({ card, size = "md", onClick, faceDown = false, noTilt = false }: TradingCardProps) {
  return (
    <div style={{ width: WIDTH[size], flex: "0 0 auto" }}>
      {faceDown ? (
        <CodexCardBack onClick={onClick} />
      ) : (
        <CodexCard card={card} isFoil={card.isFoil} isNew={card.isNew} interactive={!noTilt} onClick={onClick} />
      )}
    </div>
  );
}
