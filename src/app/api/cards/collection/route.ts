import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserCollection, getUserCollectionStats } from "@/lib/queries/cards";
import type { OwnedInfo } from "@/components/cards/vault/card";

// Per-user, reads the session cookie. Isolated to this tiny endpoint so the
// /cards catalog page itself can be ISR-cached (no per-request DB load).
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { ownership: null, stats: null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const [collection, stats] = await Promise.all([
    getUserCollection(user.id).catch(() => []),
    getUserCollectionStats(user.id).catch(() => null),
  ]);

  // Merge foil + non-foil copies into a slug → ownership map.
  const ownership: Record<string, OwnedInfo> = {};
  for (const oc of collection) {
    const slug = oc.card.slug;
    const existing = ownership[slug];
    if (existing) {
      existing.quantity += oc.quantity;
      existing.isFoil = existing.isFoil || oc.isFoil;
      existing.isNew = existing.isNew || oc.isNew;
    } else {
      ownership[slug] = { quantity: oc.quantity, isFoil: oc.isFoil, isNew: oc.isNew };
    }
  }

  return NextResponse.json(
    {
      ownership,
      stats: stats
        ? {
            ownedCount: stats.ownedCount,
            totalCards: stats.totalCards,
            completionPct: stats.completionPct,
            signalCredits: stats.signalCredits,
            lastDailyClaimAt: stats.lastDailyClaimAt
              ? new Date(stats.lastDailyClaimAt as Date).toISOString()
              : null,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
