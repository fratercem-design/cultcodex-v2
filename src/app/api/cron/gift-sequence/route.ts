/**
 * GET/POST /api/cron/gift-sequence
 *
 * Advances the Gospel/Initiate email drip. Step 0 (delivery) is sent inline at
 * sign-up by /api/initiate, which sets giftStage=1. This cron sends the later
 * steps, time-gated by lastEmailAt, and increments giftStage until the sequence
 * is complete (giftStage reaches STEP_COUNT + 1).
 *
 * Auth: Bearer CRON_SECRET (Vercel Cron sets the Authorization header when the
 * CRON_SECRET env var exists; manual callers must pass it).
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInitiateWelcomeEmail, sendGospelDeeperEmail } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Sender = (a: { recipientEmail: string; recipientName: string }) => Promise<void>;

// Keyed by the subscriber's CURRENT giftStage. minHours = min age of lastEmailAt
// before this step may fire (spacing from the previous email).
const STEPS: Record<number, { minHours: number; send: Sender }> = {
  1: { minHours: 20, send: sendInitiateWelcomeEmail }, // ~1 day after sign-up
  2: { minHours: 48, send: sendGospelDeeperEmail },    // ~2 days after the welcome
};
const STEP_COUNT = Object.keys(STEPS).length;

async function handle(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const due = await prisma.subscriber.findMany({
    where: {
      giftStage: { gte: 1, lte: STEP_COUNT },
      email: { not: null },
    },
    select: { id: true, email: true, name: true, giftStage: true, lastEmailAt: true },
    orderBy: { lastEmailAt: "asc" },
    take: 200,
  });

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const sub of due) {
    const step = STEPS[sub.giftStage];
    if (!step || !sub.email) {
      skipped++;
      continue;
    }
    const ageHours = sub.lastEmailAt ? (now - sub.lastEmailAt.getTime()) / 3_600_000 : Infinity;
    if (ageHours < step.minHours) {
      skipped++;
      continue;
    }
    try {
      await step.send({ recipientEmail: sub.email, recipientName: sub.name ?? "Initiate" });
      await prisma.subscriber.update({
        where: { id: sub.id },
        data: { giftStage: sub.giftStage + 1, lastEmailAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[gift-sequence] failed for ${sub.id} (stage ${sub.giftStage}):`, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, considered: due.length, sent, skipped, failed });
}

export const GET = handle;
export const POST = handle;
