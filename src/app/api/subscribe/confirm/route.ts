import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subscriberTokenValid } from "@/lib/subscriber-links";

// Double opt-in: the link in the confirmation email lands here.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("e");
  const token = req.nextUrl.searchParams.get("t");
  const done = new URL("/subscribed", req.url);

  if (!subscriberTokenValid("confirm", email, token)) {
    done.searchParams.set("status", "invalid");
    return NextResponse.redirect(done, 303);
  }

  const { count } = await prisma.subscriber.updateMany({ where: { email: email! }, data: { verified: true } });
  done.searchParams.set("status", count > 0 ? "confirmed" : "invalid");
  return NextResponse.redirect(done, 303);
}
