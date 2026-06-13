export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAllCards, getUserCollection, getUserCollectionStats } from "@/lib/queries/cards";
import { CARD_SPECIALS } from "@/components/cards/vault/constants";
import type { VaultCard } from "@/components/cards/vault/constants";
import { VaultApp } from "@/components/cards/vault/vault-app";
import type { OwnedInfo } from "@/components/cards/vault/card";
import "./vault/vault.css";

export const metadata: Metadata = {
  title: "Signal Archive — CultCodex",
  description: "Browse all CultCodex trading cards: Mahavidyas, Entities, Ciphers, Relics, and more. Track your collection, open packs, and build your signal array.",
  alternates: { canonical: "/cards" },
};

export default async function CardsPage() {
  const [user, dbCards] = await Promise.all([
    getCurrentUser(),
    getAllCards().catch(() => []),
  ]);

  const cards: VaultCard[] = dbCards.map((card, i) => ({
    id:          card.id,
    slug:        card.slug,
    num:         String(i + 1).padStart(2, "0"),
    cardType:    card.cardType,
    rarity:      card.rarity,
    title:       card.title,
    subtitle:    card.subtitle ?? null,
    flavourText: card.flavourText ?? null,
    statA:       card.statA,
    statB:       card.statB,
    statC:       card.statC,
    abilities:   card.abilities,
    maxSupply:   card.maxSupply ?? null,
    personality: card.personality ?? null,
    special:     CARD_SPECIALS[card.slug],
  }));

  if (!user) {
    return <VaultApp cards={cards} />;
  }

  const [collection, stats] = await Promise.all([
    getUserCollection(user.id).catch(() => []),
    getUserCollectionStats(user.id).catch(() => null),
  ]);

  // Build slug → ownership map (merge foil + non-foil copies)
  const ownership: Record<string, OwnedInfo> = {};
  for (const oc of collection) {
    const slug = oc.card.slug;
    const existing = ownership[slug];
    if (existing) {
      existing.quantity += oc.quantity;
      existing.isFoil = existing.isFoil || oc.isFoil;
      existing.isNew = existing.isNew || oc.isNew;
    } else {
      ownership[slug] = { quantity: oc.quantity, isFoil: oc.isFoil, isNew: oc.isNew };
    }
  }

  return (
    <VaultApp
      cards={cards}
      ownership={ownership}
      stats={stats ? {
        ownedCount:       stats.ownedCount,
        totalCards:       stats.totalCards,
        completionPct:    stats.completionPct,
        signalCredits:    stats.signalCredits,
        lastDailyClaimAt: stats.lastDailyClaimAt
          ? new Date(stats.lastDailyClaimAt as Date).toISOString()
          : null,
      } : undefined}
    />
  );
}
