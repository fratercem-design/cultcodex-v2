import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to report" }, { status: 401 });
  }

  const { id: commentId } = await params;
  const body = await req.json();
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length === 0) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }
  if (reason.length > 500) {
    return NextResponse.json({ error: "Reason too long (max 500 characters)" }, { status: 400 });
  }

  const comment = await prisma.codexComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  await prisma.commentReport.upsert({
    where: { commentId_userId: { commentId, userId: user.id } },
    update: { reason: reason.trim() },
    create: { commentId, userId: user.id, reason: reason.trim() },
  });

  return NextResponse.json({ success: true });
}
