import type { Metadata } from "next";
import { getAllCards } from "@/lib/queries/cards";
import { CARD_SPECIALS } from "@/components/cards/vault/constants";
import type { VaultCard } from "@/components/cards/vault/constants";
import { VaultApp } from "@/components/cards/vault/vault-app";
import "./vault.css";

export const metadata: Metadata = {
  title: "Card Vault — CultCodex",
  description: "Browse all 70+ CultCodex trading cards: Mahavidyas, Entities, Ciphers, Relics, and more. Full vault with rarity filters, stats, and pack preview.",
  alternates: { canonical: "/cards/vault" },
};

export default async function VaultPage() {
  const dbCards = await getAllCards();

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
