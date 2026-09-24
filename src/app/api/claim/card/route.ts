import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST /api/claim/card — claim a single-use card gift token (e.g. Founder's
 * Edition). Grants the card into the claimant's vault (OwnedCard) and marks
 * the gift claimed atomically, mirroring /api/claim/oracle's race guard.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to claim your card." }, { status: 401 });
  }

  let token: string;
  try {
    const body = (await req.json()) as { token?: string };
    token = (body.token ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const gift = await prisma.cardGift.findUnique({
    where: { token },
    select: { cardId: true, claimed: true, serial: true, edition: true },
  });
  if (!gift) return NextResponse.json({ error: "This card was not found in the archive." }, { status: 404 });
  if (gift.claimed) return NextResponse.json({ error: "This card has already been claimed." }, { status: 409 });

  // Conditional updateMany (token + claimed:false) is the single source of
  // truth — two concurrent claims cannot both take the same serial.
  const granted = await prisma.$transaction(async (tx) => {
    const claim = await tx.cardGift.updateMany({
      where: { token, claimed: false },
      data: { claimed: true, claimedAt: new Date(), claimedBy: user.id },
    });
    if (claim.count === 0) return false;

    await tx.ownedCard.upsert({
      where: { userId_cardId_isFoil: { userId: user.id, cardId: gift.cardId, isFoil: true } },
      create: { userId: user.id, cardId: gift.cardId, isFoil: true, obtainedVia: `gift:${gift.edition}` },
      update: { quantity: { increment: 1 } },
    });
    await tx.card.update({ where: { id: gift.cardId }, data: { totalMinted: { increment: 1 } } });
    return true;
  });

  if (!granted) {
    return NextResponse.json({ error: "This card has already been claimed." }, { status: 409 });
  }
  return NextResponse.json({ ok: true, serial: gift.serial, edition: gift.edition });
}
