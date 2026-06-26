import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const LIFETIME_PERIOD_END = new Date("2099-01-07T00:00:00.000Z");

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to claim your invitation." }, { status: 401 });
  }

  let token: string, memberTitle: string;
  try {
    const body = await req.json() as { token?: string; memberTitle?: string };
    token = (body.token ?? "").trim();
    memberTitle = (body.memberTitle ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });
  if (!memberTitle || memberTitle.length > 40) {
    return NextResponse.json({ error: "Choose a name (1–40 characters)." }, { status: 400 });
  }

  const invite = await prisma.oracleInvite.findUnique({ where: { token } });
  if (!invite) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  if (invite.claimed) return NextResponse.json({ error: "This invitation has already been claimed." }, { status: 409 });

  // If the invite was issued to a specific email, enforce it.
  if (invite.recipientEmail) {
    const dbUser = await prisma.codexUser.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    if (!dbUser || dbUser.email.toLowerCase() !== invite.recipientEmail.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation was issued to a different email address." },
        { status: 403 }
      );
    }
  }

  // Claim atomically: the conditional updateMany (token + claimed:false) is the
  // single source of truth, so two concurrent requests for the same single-use
  // invite cannot both mint a lifetime "system" membership. Only the request
  // whose updateMany flips the row (count === 1) proceeds to grant access.
  const granted = await prisma.$transaction(async (tx) => {
    const claim = await tx.oracleInvite.updateMany({
      where: { token, claimed: false },
      data: { claimed: true, claimedAt: new Date(), claimedBy: user.id },
    });
    if (claim.count === 0) return false;
    await tx.codexUser.update({
      where: { id: user.id },
      data: {
        isLifetimeMember: true,
        subscriptionTier: "system",
        subscriptionStatus: "active",
        currentPeriodEnd: LIFETIME_PERIOD_END,
        memberTitle,
        isPublicMember: true,
      },
    });
    return true;
  });

  if (!granted) {
    return NextResponse.json({ error: "This invitation has already been claimed." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
