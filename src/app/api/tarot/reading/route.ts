import { NextResponse } from "next/server";
import { generateCardArtSvg } from "@/lib/cards/card-art";
import { ALL_TAROT_CARDS } from "@/lib/cards/tarot-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = Math.min(5, Math.max(1, parseInt(searchParams.get("count") ?? "3", 10)));

    // Fisher-Yates shuffle over the static 80-card Cult of Psyche deck
    const deck = [...ALL_TAROT_CARDS];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j]!, deck[i]!];
    }

    const drawn = deck.slice(0, count).map((card) => ({
      slug:        card.slug,
      title:       card.title,
      subtitle:    card.subtitle,
      flavourText: card.flavourText,
      cardType:    card.cardType,
      rarity:      card.rarity,
      abilities:   card.abilities,
      artSvg: generateCardArtSvg({
        slug:     card.slug,
        cardType: card.cardType,
        rarity:   card.rarity,
        width:    200,
        height:   280,
      }),
    }));

    return NextResponse.json(drawn);
  } catch (err) {
    console.error("[tarot/reading] Error drawing cards:", err);
    return NextResponse.json({ error: "Failed to draw cards" }, { status: 500 });
  }
}
