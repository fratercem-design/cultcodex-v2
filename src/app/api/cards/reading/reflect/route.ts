import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Save/edit the "did this manifest?" reflection on a past reading.
// Authz: updateMany scoped to the caller's own readings — a foreign readingId
// updates 0 rows and returns 404.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let body: { readingId?: string; reflection?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }
  if (!body.readingId) return NextResponse.json({ error: "readingId required" }, { status: 400 });

  const reflection =
    typeof body.reflection === "string" && body.reflection.trim().length > 0
      ? body.reflection.slice(0, 2000)
      : null;

  const res = await prisma.reading.updateMany({
    where: { id: body.readingId, userId: user.id },
    data: { reflection },
  });
  if (res.count === 0) return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  return NextResponse.json({ ok: true, reflection });
}
