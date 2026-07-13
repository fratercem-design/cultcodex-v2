export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getUserReadings } from "@/lib/cards/reading";
import { getAffinity, AFFINITY_THRESHOLD } from "@/lib/cards/affinity";
import { GrimoireApp, type GrimoireReading, type Affinity } from "./grimoire-app";

export const metadata: Metadata = {
  title: "The Grimoire — Your Readings — CultCodex",
  description: "Every reading you've drawn, saved forever with its meaning as it was drawn. Revisit the signal and mark what manifested.",
  alternates: { canonical: "/cards/grimoire" },
};

export default async function GrimoirePage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return <GrimoireApp signedIn={false} readings={[]} affinity={null} threshold={AFFINITY_THRESHOLD} />;

  const [rows, aff] = await Promise.all([
    getUserReadings(user.id).catch(() => []),
    getAffinity(user.id).catch(() => null),
  ]);
  const affinity: Affinity | null = aff
    ? {
        dominantElement: aff.dominantElement,
        dominantPlanet: aff.dominantPlanet,
        dominantArchetype: aff.dominantArchetype,
        mostDrawnSuit: aff.mostDrawnSuit,
        shadowPattern: aff.shadowPattern,
        readingsCount: aff.readingsCount,
        recurringCards: Array.isArray(aff.recurringCards)
          ? (aff.recurringCards as unknown as { title: string; count: number }[])
          : [],
      }
    : null;
  const readings: GrimoireReading[] = rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    question: r.question,
    spreadName: r.spread?.name ?? null,
    reflection: r.reflection,
    cards: r.cards.map((c) => ({
      position: c.position,
      positionName: c.positionName,
      orientation: c.orientation,
      titleSnapshot: c.titleSnapshot,
      uprightMeaning: c.uprightMeaning,
      reversedMeaning: c.reversedMeaning,
      oraclePrompt: c.oraclePrompt,
      element: c.element,
      archetype: c.archetype,
    })),
  }));

  return <GrimoireApp signedIn readings={readings} affinity={affinity} threshold={AFFINITY_THRESHOLD} />;
}
