/**
 * GET  /api/me/saved-searches → list current user's saved searches
 * POST /api/me/saved-searches → create a saved search
 *
 * Auth: signed-in user. No subscription required (free feature).
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createSavedSearch, listSavedSearches } from "@/lib/queries/saved-searches";
import type { SearchKind } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_KINDS: SearchKind[] = ["simple", "deep", "oracle"];
const MAX_CONCEPTS = 5;
const MAX_LABEL_LEN = 120;
const MAX_QUERY_LEN = 1000;

export async function GET(): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searches = await listSavedSearches(user.id);
  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body must be an object." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  const label = typeof b.label === "string" ? b.label.trim().slice(0, MAX_LABEL_LEN) : "";
  if (!label) return NextResponse.json({ error: "label is required" }, { status: 400 });

  const kind = typeof b.kind === "string" ? (b.kind as SearchKind) : null;
  if (!kind || !ALLOWED_KINDS.includes(kind)) {
    return NextResponse.json({ error: `kind must be one of ${ALLOWED_KINDS.join(", ")}` }, { status: 400 });
  }

  const query = typeof b.query === "string" ? b.query.slice(0, MAX_QUERY_LEN) : "";

  let concepts: string[] = [];
  let thresholds: number[] = [];
  if (Array.isArray(b.concepts)) {
    concepts = b.concepts
      .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
      .map((c) => c.trim().slice(0, 200))
      .slice(0, MAX_CONCEPTS);
  }
  if (Array.isArray(b.thresholds)) {
    thresholds = b.thresholds
      .filter((t): t is number => typeof t === "number" && isFinite(t))
      .map((t) => Math.min(Math.max(t, 0), 1))
      .slice(0, MAX_CONCEPTS);
  }
  // Normalize length: thresholds parallel to concepts
  if (thresholds.length !== concepts.length) {
    thresholds = concepts.map((_, i) => thresholds[i] ?? 0.6);
  }

  const eraId = typeof b.eraId === "string" && b.eraId ? b.eraId.slice(0, 40) : null;
  const personSlug = typeof b.personSlug === "string" && b.personSlug ? b.personSlug.slice(0, 80) : null;
  const archetype = typeof b.archetype === "string" && b.archetype ? b.archetype.slice(0, 80) : null;

  // Minimal payload validation by kind
  if (kind === "simple" && !query) {
    return NextResponse.json({ error: "simple kind requires `query`" }, { status: 400 });
  }
  if (kind === "deep" && concepts.length === 0) {
    return NextResponse.json({ error: "deep kind requires `concepts`" }, { status: 400 });
  }
  if (kind === "oracle" && !query) {
    return NextResponse.json({ error: "oracle kind requires `query` (the question)" }, { status: 400 });
  }

  const created = await createSavedSearch({
    userId: user.id,
    label,
    kind,
    query,
    concepts,
    thresholds,
    eraId,
    personSlug,
    archetype,
  });

  return NextResponse.json({ search: created }, { status: 201 });
}
