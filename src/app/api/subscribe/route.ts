import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { sendSubscribeConfirmation } from "@/lib/notifications";
import { subscriberLink } from "@/lib/subscriber-links";

const CONFIRM_RESEND_MS = 60 * 60 * 1000;

const subscribeSchema = z.object({
  email: z.email().optional(),
  pushSubscription: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`subscribe:${callerKey}`, { limit: 5, windowMs: 60_000 });
  if (!localRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } });
  }
  const sharedRl = await sharedRateLimit("subscribe", callerKey, { limit: 5, windowMs: 60_000 });
  if (!sharedRl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(sharedRl.retryAfterSec) } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const data = subscribeSchema.parse(body);

    if (!data.email && !data.pushSubscription) {
      return NextResponse.json(
        { error: "Email or push subscription required" },
        { status: 400 }
      );
    }

    const push = data.pushSubscription as Prisma.InputJsonValue | undefined;
    let confirmationSent = false;

    if (data.email) {
      const existing = await prisma.subscriber.findUnique({ where: { email: data.email } });
      if (!existing) {
        // Double opt-in: saved unconfirmed and mailed nothing but the
        // confirmation link, so a stranger's address can't be signed up.
        await prisma.subscriber.create({
          data: { email: data.email, pushSubscription: push, verified: false },
        });
      } else if (push) {
        // Never overwrite an existing row's push endpoint on the strength of
        // knowing its email. The browser's own subscription gets its own row.
        await prisma.subscriber.create({ data: { pushSubscription: push, verified: true } });
      }
      // At most one confirmation per address per hour, so the form can't be
      // used to flood a stranger's inbox. Unconfirmed rows are giftStage 0,
      // which the gift drip ignores, so lastEmailAt is free to use here.
      const recentlyMailed =
        existing?.lastEmailAt && Date.now() - existing.lastEmailAt.getTime() < CONFIRM_RESEND_MS;
      if ((!existing || !existing.verified) && !recentlyMailed) {
        await sendSubscribeConfirmation(data.email, subscriberLink("confirm", data.email));
        await prisma.subscriber.update({ where: { email: data.email }, data: { lastEmailAt: new Date() } });
        confirmationSent = true;
      }
    } else if (push) {
      // Push-only: the browser permission prompt is the consent.
      await prisma.subscriber.create({ data: { pushSubscription: push, verified: true } });
    }

    return NextResponse.json({ ok: true, confirmationSent });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
