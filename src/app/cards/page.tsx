export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getAllCards, getUserCollection, getUserCollectionStats, getCollectionSets } from "@/lib/queries/cards";
import { CARD_SPECIALS, arcanaGroupOf } from "@/components/cards/vault/constants";
import { ALL_TAROT_CARDS } from "@/lib/cards/tarot-data";
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

  // Archive cards keep their original numbering (DB order, 1–204); the tarot
  // follows in deck order (majors, then suits) so it reads as one deck.
  const tarotIndex = new Map(ALL_TAROT_CARDS.map((t, i) => [t.slug, i]));
  const isTarot = (c: (typeof dbCards)[number]) => c.sourceType === "tarot";
  const ordered = [
    ...dbCards.filter((c) => !isTarot(c)),
    ...dbCards.filter(isTarot).sort((a, b) => (tarotIndex.get(a.slug) ?? 999) - (tarotIndex.get(b.slug) ?? 999)),
  ];

  const cards: VaultCard[] = ordered.map((card, i) => ({
    id:          card.id,
    slug:        card.slug,
    num:         String(i + 1).padStart(2, "0"),
    deck:        isTarot(card) ? "arcana" : "archive",
    arcanaGroup: isTarot(card) ? arcanaGroupOf(card.slug) : undefined,
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

  const [collection, stats, sets] = await Promise.all([
    getUserCollection(user.id).catch(() => []),
    getUserCollectionStats(user.id).catch(() => null),
    getCollectionSets(user.id).catch(() => []),
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
      sets={sets}
      stats={stats ? {
        ownedCount:       stats.ownedCount,
        totalCards:       stats.totalCards,
        completionPct:    stats.completionPct,
        signalCredits:    stats.signalCredits,
        collectionPower:  stats.collectionPower,
        dailyStreak:      stats.dailyStreak,
        longestStreak:    stats.longestStreak,
        lastDailyClaimAt: stats.lastDailyClaimAt
          ? new Date(stats.lastDailyClaimAt as Date).toISOString()
          : null,
      } : undefined}
    />
  );
}
