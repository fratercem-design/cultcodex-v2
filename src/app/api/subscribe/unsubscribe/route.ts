import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subscriberTokenValid } from "@/lib/subscriber-links";

// Removes the address from the list entirely. GET for the link in the email;
// POST for mail clients' one-click unsubscribe (RFC 8058, List-Unsubscribe-Post).
async function unsubscribe(req: NextRequest): Promise<{ ok: boolean }> {
  const email = req.nextUrl.searchParams.get("e");
  const token = req.nextUrl.searchParams.get("t");
  if (!subscriberTokenValid("unsubscribe", email, token)) return { ok: false };
  await prisma.subscriber.deleteMany({ where: { email: email! } });
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const { ok } = await unsubscribe(req);
  const done = new URL("/subscribed", req.url);
  done.searchParams.set("status", ok ? "unsubscribed" : "invalid");
  return NextResponse.redirect(done, 303);
}

export async function POST(req: NextRequest) {
  const { ok } = await unsubscribe(req);
  return NextResponse.json({ ok }, { status: ok ? 200 : 400 });
}
