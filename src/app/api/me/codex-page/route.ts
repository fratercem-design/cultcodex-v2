import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSystemTier } from "@/lib/subscription";
import { NextResponse } from "next/server";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSystem = await hasSystemTier(user.id);
  if (!isSystem) {
    return NextResponse.json({ error: "Full System tier required" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bio, codexSlug, codexPagePublic } = body as {
    bio?: string | null;
    codexSlug?: string | null;
    codexPagePublic?: boolean;
  };

  if (bio !== undefined && bio !== null) {
    if (typeof bio !== "string" || bio.length > 500) {
      return NextResponse.json({ error: "Bio must be under 500 characters" }, { status: 400 });
    }
  }

  if (codexSlug !== undefined && codexSlug !== null) {
    if (typeof codexSlug !== "string" || !SLUG_RE.test(codexSlug)) {
      return NextResponse.json(
        { error: "Slug must be 3-40 lowercase letters, numbers, or hyphens" },
        { status: 400 }
      );
    }
    const existing = await prisma.codexUser.findUnique({ where: { codexSlug } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "That slug is already taken" }, { status: 409 });
    }
  }

  const updated = await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(codexSlug !== undefined ? { codexSlug: codexSlug || null } : {}),
      ...(typeof codexPagePublic === "boolean" ? { codexPagePublic } : {}),
    },
    select: { bio: true, codexSlug: true, codexPagePublic: true },
  });

  return NextResponse.json(updated);
}
