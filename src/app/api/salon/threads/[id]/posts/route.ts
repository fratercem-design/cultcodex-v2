export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import { createSalonPost } from "@/lib/queries/salon";
import { moderateComment } from "@/lib/moderation";
import { rateLimit, clientKey } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to post" }, { status: 401 });
  }
  if (!(await hasSystemTier(user.id))) {
    return NextResponse.json({ error: "The Salon is open to Oracle members." }, { status: 403 });
  }

  const rl = rateLimit(`salon-post:${clientKey(req, user.id)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You're posting too fast. Take a breath." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const { id } = await params;
  const thread = await prisma.salonThread.findUnique({
    where: { id },
    select: { id: true, closed: true },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }
  if (thread.closed) {
    return NextResponse.json({ error: "This thread is closed." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
  }
  if (content.length > 4000) {
    return NextResponse.json({ error: "Post too long (max 4000 characters)" }, { status: 400 });
  }

  const moderation = await moderateComment(content);

  const post = await createSalonPost({
    threadId: thread.id,
    userId: user.id,
    content,
    flagged: moderation.flagged,
    flaggedReason: moderation.reason,
  });

  if (moderation.flagged) {
    return NextResponse.json(
      { message: "Your post is being reviewed before it appears.", flagged: true },
      { status: 202 },
    );
  }

  return NextResponse.json(post, { status: 201 });
}
