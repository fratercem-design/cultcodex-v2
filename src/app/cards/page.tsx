// The card catalog (~200 cards) is essentially static, so this page is
// ISR-cached instead of force-dynamic — it no longer queries the DB per
// request. Per-user ownership loads client-side via /api/cards/collection.
export const revalidate = 3600;

import type { Metadata } from "next";
import { getAllCards } from "@/lib/queries/cards";
import { CARD_SPECIALS } from "@/components/cards/vault/constants";
import type { VaultCard } from "@/components/cards/vault/constants";
import { VaultApp } from "@/components/cards/vault/vault-app";
import "./vault/vault.css";

export const metadata: Metadata = {
  title: "Signal Archive — CultCodex",
  description: "Browse all CultCodex trading cards: Mahavidyas, Entities, Ciphers, Relics, and more. Track your collection, open packs, and build your signal array.",
  alternates: { canonical: "/cards" },
};

export default async function CardsPage() {
  const dbCards = await getAllCards().catch(() => []);

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

  return <VaultApp cards={cards} />;
}
