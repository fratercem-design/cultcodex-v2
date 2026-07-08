/**
 * POST /api/initiate
 *
 * Free "Initiate" sign-up in exchange for name + email. Adds the lead to the
 * Subscriber list and returns the download URL for the gift PDF. Sends the
 * Initiate welcome email best-effort (never blocks the gift on email delivery).
 *
 * Body: { name: string; email: string; source?: string }
 * Returns: { ok: true, downloadUrl: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { sendGospelDeliveryEmail } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GIFT_URL = "/gospel-of-psyches-nightmares.pdf";

const schema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  email: z.email(),
  source: z.string().trim().max(60).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rl = rateLimit(`initiate:${clientKey(req)}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "A name and a valid email are required." }, { status: 400 });
  }

  const { name, email } = parsed;
  const source = parsed.source ?? "gift:gospel";

  try {
    await prisma.subscriber.upsert({
      where: { email },
      // giftStage 1 = delivery email sent below; the cron drip continues from here.
      create: { email, name, source, verified: true, giftStage: 1, lastEmailAt: new Date() },
      // Keep the earliest source/stage; only backfill a missing name.
      update: { name },
    });
  } catch (err) {
    console.error("[initiate] subscriber upsert failed:", err);
    return NextResponse.json({ error: "Sign-up failed. Please try again." }, { status: 500 });
  }

  // Best-effort delivery email (sequence step 0) — never block the gift on it.
  try {
    await sendGospelDeliveryEmail({ recipientEmail: email, recipientName: name });
  } catch (err) {
    console.error("[initiate] delivery email failed (non-blocking):", err);
  }

  return NextResponse.json({ ok: true, downloadUrl: GIFT_URL });
}
