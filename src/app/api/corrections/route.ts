import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod/v4";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { CORRECTION_LIMITS, CORRECTION_TYPES } from "@/lib/corrections";

// Corrections go to the maintainers' inbox, already published on /corrections.
// CORRECTIONS_TO overrides it without a deploy.
const DEFAULT_TO = "psychetarotchannel@gmail.com";

const correctionSchema = z.object({
  pageUrl: z.string().trim().min(1).max(CORRECTION_LIMITS.pageUrl),
  type: z.enum(CORRECTION_TYPES.map((t) => t.value) as [string, ...string[]]),
  details: z.string().trim().min(CORRECTION_LIMITS.minDetails).max(CORRECTION_LIMITS.details),
  correct: z.string().trim().max(CORRECTION_LIMITS.correct).optional().default(""),
  context: z.string().trim().max(CORRECTION_LIMITS.context).optional().default(""),
  email: z.union([z.email(), z.literal("")]).optional().default(""),
  // Honeypot: hidden from people, filled in by bots.
  website: z.string().optional().default(""),
});

// In-memory limit only. The shared limiter fails closed when the database is
// unreachable, and an outage is exactly when readers report broken pages.
export async function POST(req: NextRequest) {
  const callerKey = clientKey(req);
  const localRl = rateLimit(`corrections:${callerKey}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!localRl.ok) {
    return NextResponse.json(
      { error: "Too many reports in a short time. Try again in a few minutes." },
      { status: 429, headers: { "Retry-After": String(localRl.retryAfterSec) } },
    );
  }

  const parsed = correctionSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the form: add the page and at least a sentence about what's wrong." },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const reference = `C-${randomBytes(3).toString("hex").toUpperCase()}`;

  // Pretend success to bots so they don't retry with a cleverer payload.
  if (data.website) return NextResponse.json({ ok: true, reference });

  if (!process.env.RESEND_API_KEY) {
    console.error("[corrections] RESEND_API_KEY is not set; correction not delivered");
    return NextResponse.json(
      { error: "The form can't send right now. Please email psychetarotchannel@gmail.com instead." },
      { status: 503 },
    );
  }

  const typeLabel = CORRECTION_TYPES.find((t) => t.value === data.type)?.label ?? data.type;
  const text = [
    `Reference: ${reference}`,
    `Type: ${typeLabel}`,
    `Page: ${data.pageUrl}`,
    `Reporter email: ${data.email || "(not given)"}`,
    "",
    "What's wrong:",
    data.details,
    "",
    "Correct information:",
    data.correct || "(not given)",
    "",
    "Supporting context:",
    data.context || "(not given)",
  ].join("\n");

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: "CultCodex Corrections <notifications@cultcodex.me>",
      to: process.env.CORRECTIONS_TO || DEFAULT_TO,
      ...(data.email ? { replyTo: data.email } : {}),
      subject: `[Correction ${reference}] ${typeLabel}: ${data.pageUrl}`.slice(0, 200),
      text,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("[corrections] send failed", err);
    return NextResponse.json(
      { error: "The report didn't send. Please try again, or email psychetarotchannel@gmail.com." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, reference });
}
