import { prisma } from "@/lib/db";
import { getEraById } from "@/lib/eras";

export interface EraGuest {
  personId: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  appearances: number;
  archetype: string | null;
}

export interface EraStats {
  episodeCount: number;
  uniqueGuests: number;
  topGuests: EraGuest[];
  archetypeDistribution: Array<{ archetype: string; count: number }>;
}

export async function fetchEraStats(eraId: string): Promise<EraStats | null> {
  const era = getEraById(eraId);
  if (!era) return null;

  const dateStart = new Date(era.dateStart);
  const dateEnd = era.dateEnd ? new Date(era.dateEnd) : null;

  const airDateFilter = {
    not: null as null,
    gte: dateStart,
    ...(dateEnd ? { lte: dateEnd } : {}),
  };

  const [episodeCount, guestRows, entities] = await Promise.all([
    prisma.episode.count({
      where: { status: "published", airDate: airDateFilter },
    }),
    prisma.episodeGuest.findMany({
      where: {
        episode: { status: "published", airDate: airDateFilter },
      },
      select: {
        personId: true,
        person: { select: { slug: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.psychenomiconEntity.findMany({
      where: { personSlug: { not: null }, primaryArchetype: { not: null } },
      select: { personSlug: true, primaryArchetype: true },
    }),
  ]);

  const archetypeBySlug = new Map(
    entities.map((e) => [e.personSlug!, e.primaryArchetype!])
  );

  const personMap = new Map<string, EraGuest>();
  for (const row of guestRows) {
    if (!personMap.has(row.personId)) {
      personMap.set(row.personId, {
        personId: row.personId,
        name: row.person.displayName,
        slug: row.person.slug,
        avatarUrl: row.person.avatarUrl,
        appearances: 0,
        archetype: archetypeBySlug.get(row.person.slug) ?? null,
      });
    }
    personMap.get(row.personId)!.appearances++;
  }

  const allGuests = [...personMap.values()].sort(
    (a, b) => b.appearances - a.appearances
  );

  const archetypeCounts = new Map<string, number>();
  for (const guest of allGuests) {
    if (guest.archetype) {
      archetypeCounts.set(
        guest.archetype,
        (archetypeCounts.get(guest.archetype) ?? 0) + 1
      );
    }
  }

  return {
    episodeCount,
    uniqueGuests: allGuests.length,
    topGuests: allGuests.slice(0, 12),
    archetypeDistribution: [...archetypeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([archetype, count]) => ({ archetype, count })),
  };
}
