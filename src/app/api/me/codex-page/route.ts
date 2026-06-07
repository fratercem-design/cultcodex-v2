import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasSystemTier } from "@/lib/subscription";
import { NextResponse } from "next/server";

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
const VALID_BANNERS = new Set(["void", "crimson", "emerald", "gold", "violet", "aurora", "abyss", "frost"]);
const MAX_LINKS = 5;

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

  const { bio, codexSlug, codexPagePublic, codexBanner, codexLinks, codexShowCards } = body as {
    bio?: string | null;
    codexSlug?: string | null;
    codexPagePublic?: boolean;
    codexBanner?: string | null;
    codexLinks?: { label: string; url: string }[] | null;
    codexShowCards?: boolean;
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

  if (codexBanner !== undefined && codexBanner !== null) {
    if (!VALID_BANNERS.has(codexBanner)) {
      return NextResponse.json({ error: "Invalid banner theme" }, { status: 400 });
    }
  }

  if (codexLinks !== undefined && codexLinks !== null) {
    if (!Array.isArray(codexLinks) || codexLinks.length > MAX_LINKS) {
      return NextResponse.json({ error: `Up to ${MAX_LINKS} links allowed` }, { status: 400 });
    }
    for (const link of codexLinks) {
      if (!link.label || typeof link.label !== "string" || link.label.length > 40) {
        return NextResponse.json({ error: "Each link needs a label under 40 characters" }, { status: 400 });
      }
      if (!link.url || typeof link.url !== "string" || link.url.length > 200) {
        return NextResponse.json({ error: "Each link needs a valid URL under 200 characters" }, { status: 400 });
      }
      try {
        const parsed = new URL(link.url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
      } catch {
        return NextResponse.json({ error: `Invalid URL: ${link.url}` }, { status: 400 });
      }
    }
  }

  const updated = await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      ...(bio !== undefined ? { bio: bio || null } : {}),
      ...(codexSlug !== undefined ? { codexSlug: codexSlug || null } : {}),
      ...(typeof codexPagePublic === "boolean" ? { codexPagePublic } : {}),
      ...(codexBanner !== undefined ? { codexBanner: codexBanner || null } : {}),
      ...(codexLinks !== undefined ? { codexLinks: codexLinks ?? undefined } : {}),
      ...(typeof codexShowCards === "boolean" ? { codexShowCards } : {}),
    },
    select: {
      bio: true,
      codexSlug: true,
      codexPagePublic: true,
      codexBanner: true,
      codexLinks: true,
      codexShowCards: true,
    },
  });

  return NextResponse.json(updated);
}
