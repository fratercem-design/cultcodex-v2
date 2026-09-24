import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { claimSetBonus } from "@/lib/queries/cards";
import type { CardType } from "@/generated/prisma/client";

const VALID_TYPES = [
  "VOICE", "TRANSMISSION", "LORE", "SIGNAL", "ORACLE", "CIPHER", "RELIC",
  "ENTITY", "PROPHECY", "MEMBER", "GLITCH", "MAHAVIDYA", "AVATAR", "INCIDENT",
] as const;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const cardType = body?.cardType;
  if (typeof cardType !== "string" || !VALID_TYPES.includes(cardType as (typeof VALID_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid cardType" }, { status: 400 });
  }

  try {
    const result = await claimSetBonus(user.id, cardType as CardType);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[set-bonus] error:", err);
    return NextResponse.json({ error: "Failed to claim set bonus. Please try again." }, { status: 400 });
  }
}
