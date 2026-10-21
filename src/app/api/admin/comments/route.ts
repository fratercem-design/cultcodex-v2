import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminDeniedResponse } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return adminDeniedResponse(err);
  }

  const flaggedOnly = req.nextUrl.searchParams.get("flagged") === "true";

  const comments = await prisma.codexComment.findMany({
    where: flaggedOnly ? { flagged: true } : undefined,
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      episode: { select: { title: true, slug: true } },
      reports: { include: { user: { select: { displayName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(comments);
}
