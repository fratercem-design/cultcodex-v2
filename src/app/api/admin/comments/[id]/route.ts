import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: "approve" | "delete" };

  if (!action || !["approve", "delete"].includes(action)) {
    return NextResponse.json({ error: "Action must be 'approve' or 'delete'" }, { status: 400 });
  }

  const comment = await prisma.codexComment.findUnique({ where: { id }, select: { id: true } });
  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.codexComment.update({ where: { id }, data: { flagged: false, flaggedReason: null } });
    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "delete") {
    await prisma.codexComment.delete({ where: { id } });
    return NextResponse.json({ success: true, action: "deleted" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
