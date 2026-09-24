/**
 * Oracle Affinity — a self-discovery profile derived from a user's reading
 * history. Recomputed after each draw; surfaces once enough readings exist to
 * show a real pattern (dominant element / planet / archetype, most-drawn suit,
 * shadow pattern, recurring cards). This is what turns readings into a long-term
 * mirror rather than one-off draws.
 */
import { prisma } from "@/lib/db";

export const AFFINITY_THRESHOLD = 10; // readings before affinity is meaningful

function mode(values: (string | null | undefined)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

export interface AffinityData {
  dominantElement: string | null;
  dominantPlanet: string | null;
  dominantArchetype: string | null;
  mostDrawnSuit: string | null;
  shadowPattern: string | null;
  recurringCards: { title: string; count: number }[];
  readingsCount: number;
}

/** Recompute and persist a user's Oracle Affinity from their full draw history. */
export async function recomputeAffinity(userId: string): Promise<AffinityData | null> {
  const rcs = await prisma.readingCard.findMany({
    where: { reading: { userId } },
    select: { cardId: true, element: true, archetype: true, titleSnapshot: true, orientation: true },
  });
  const readingsCount = await prisma.reading.count({ where: { userId } });
  if (rcs.length === 0) return null;

  // Snapshot lacks planet/suit/shadow — join to Card for the current attributes.
  const cardIds = [...new Set(rcs.map((r) => r.cardId))];
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds } },
    select: { id: true, planet: true, cardType: true, shadowAspect: true },
  });
  const cmap = new Map(cards.map((c) => [c.id, c]));

  const titleCounts = new Map<string, number>();
  for (const r of rcs) if (r.titleSnapshot) titleCounts.set(r.titleSnapshot, (titleCounts.get(r.titleSnapshot) ?? 0) + 1);
  const recurringCards = [...titleCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, count }));

  const data: AffinityData = {
    dominantElement: mode(rcs.map((r) => r.element)),
    dominantArchetype: mode(rcs.map((r) => r.archetype)),
    dominantPlanet: mode(rcs.map((r) => cmap.get(r.cardId)?.planet)),
    mostDrawnSuit: mode(rcs.map((r) => cmap.get(r.cardId)?.cardType)),
    shadowPattern: mode(rcs.filter((r) => r.orientation === "reversed").map((r) => cmap.get(r.cardId)?.shadowAspect)),
    recurringCards,
    readingsCount,
  };

  await prisma.oracleAffinity.upsert({
    where: { userId },
    update: { ...data, recurringCards },
    create: { userId, ...data, recurringCards },
  });
  return data;
}

export async function getAffinity(userId: string) {
  return prisma.oracleAffinity.findUnique({ where: { userId } });
}
