import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCardArtSvg } from "@/lib/cards/card-art";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(5, Math.max(1, parseInt(searchParams.get("count") ?? "3", 10)));

  const all = await prisma.card.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      title: true,
      subtitle: true,
      flavourText: true,
      cardType: true,
      rarity: true,
      abilities: true,
    },
  });

  // Fisher-Yates shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }

  const drawn = all.slice(0, count).map((card) => ({
    ...card,
    artSvg: generateCardArtSvg({
      slug: card.slug,
      cardType: card.cardType,
      rarity: card.rarity,
      width: 200,
      height: 280,
    }),
  }));

  return NextResponse.json(drawn);
}
