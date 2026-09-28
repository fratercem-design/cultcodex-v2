/**
 * POST /api/workbook
 *
 * The 30-Day Initiation lead magnet. Saves the address unconfirmed and emails
 * a signed link to the PDF; opening that link confirms the address (see
 * /initiation/download). The PDF itself is never returned here, so nobody can
 * collect it, or sign up someone else, without access to the inbox.
 *
 * Body: { email: string; source?: string }
 * Returns { ok: true } whether or not the address was already on the list.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";
import { rateLimit, sharedRateLimit, clientKey } from "@/lib/rate-limit";
import { sendWorkbookEmail } from "@/lib/notifications";
import { subscriberLink, workbookLink } from "@/lib/subscriber-links";
import { WORKBOOK_SOURCE } from "@/lib/workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.email(),
  source: z.string().trim().max(60).optional(),
});

const tooMany = (retryAfterSec: number) =>
  NextResponse.json(
    { error: "Too many requests. Please wait a moment." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );

export async function POST(req: NextRequest): Promise<NextResponse> {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`workbook:${callerKey}`, { limit: 5, windowMs: 60_000 });
  if (!localRl.ok) return tooMany(localRl.retryAfterSec);

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const sharedRl = await sharedRateLimit("workbook", callerKey, { limit: 5, windowMs: 60_000 });
  if (!sharedRl.ok) return tooMany(sharedRl.retryAfterSec);

  const typed = parsed.email.trim();

  // At most two workbook emails per address per hour (one retry for a slow
  // inbox), so the form can't be used to flood a stranger. Answer as if it
  // was sent either way, so the response doesn't reveal who is on the list.
  const perAddress = await sharedRateLimit("workbook-email", typed.toLowerCase(), { limit: 2, windowMs: 60 * 60_000 });
  if (!perAddress.ok) return NextResponse.json({ ok: true });

  try {
    // Older rows keep the address as typed, so match without case to avoid
    // a second row, and mail the stored spelling so the unsubscribe link fits.
    const existing = await prisma.subscriber.findFirst({
      where: { email: { equals: typed, mode: "insensitive" } },
      select: { email: true },
    });
    const email = existing?.email ?? typed;
    if (!existing) {
      await prisma.subscriber.create({
        data: { email, source: parsed.source ? `${WORKBOOK_SOURCE}:${parsed.source}` : WORKBOOK_SOURCE, verified: false },
      });
    }
    await sendWorkbookEmail(email, workbookLink(email), subscriberLink("unsubscribe", email));
  } catch (err) {
    console.error("[workbook] sign-up failed:", err);
    return NextResponse.json({ error: "We couldn't send the email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
