import { prisma } from "@/lib/db";

export interface GraphNode {
  id: string;
  slug: string;
  name: string;
  personType: string;
  appearances: number;
  archetype: string | null;
  avatarUrl: string | null;
}

export interface GraphEdge {
  sourceId: string;
  targetId: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalEpisodes: number;
}

export async function fetchRelationshipGraph(
  minCoAppearances = 2,
  options?: { eraDateStart?: Date; eraDateEnd?: Date }
): Promise<GraphData> {
  const episodeWhere = {
    status: "published" as const,
    ...(options?.eraDateStart
      ? {
          airDate: {
            not: null,
            gte: options.eraDateStart,
            ...(options.eraDateEnd ? { lte: options.eraDateEnd } : {}),
          },
        }
      : {}),
  };

  const [guestRows, episodeCount, entities] = await Promise.all([
    // Guest appearances filtered by era when provided
    prisma.episodeGuest.findMany({
      where: { episode: episodeWhere },
      select: { episodeId: true, personId: true },
    }),
    prisma.episode.count({ where: episodeWhere }),
    // Psychenomicon archetypes (soft-linked by personSlug)
    prisma.psychenomiconEntity.findMany({
      where: { personSlug: { not: null }, primaryArchetype: { not: null } },
      select: { personSlug: true, primaryArchetype: true },
    }),
  ]);

  // ── compute appearance counts per person ──────────────────────
  const appearanceCount = new Map<string, number>();
  const byEpisode = new Map<string, string[]>();

  for (const row of guestRows) {
    appearanceCount.set(row.personId, (appearanceCount.get(row.personId) ?? 0) + 1);
    const list = byEpisode.get(row.episodeId) ?? [];
    list.push(row.personId);
    byEpisode.set(row.episodeId, list);
  }

  // ── compute co-appearance counts ──────────────────────────────
  const coAppearances = new Map<string, number>();

  for (const guests of byEpisode.values()) {
    if (guests.length < 2) continue;
    for (let i = 0; i < guests.length; i++) {
      for (let j = i + 1; j < guests.length; j++) {
        const a = guests[i] < guests[j] ? guests[i] : guests[j];
        const b = guests[i] < guests[j] ? guests[j] : guests[i];
        const key = `${a}|${b}`;
        coAppearances.set(key, (coAppearances.get(key) ?? 0) + 1);
      }
    }
  }

  // ── filter edges by threshold ─────────────────────────────────
  const edges: GraphEdge[] = [];
  const involvedIds = new Set<string>();

  for (const [key, weight] of coAppearances) {
    if (weight < minCoAppearances) continue;
    const [sourceId, targetId] = key.split("|");
    edges.push({ sourceId, targetId, weight });
    involvedIds.add(sourceId);
    involvedIds.add(targetId);
  }

  if (involvedIds.size === 0) return { nodes: [], edges: [], totalEpisodes: episodeCount };

  // ── fetch person details ──────────────────────────────────────
  const people = await prisma.person.findMany({
    where: { id: { in: [...involvedIds] } },
    select: { id: true, displayName: true, slug: true, avatarUrl: true, personType: true },
  });

  const archetypeBySlug = new Map(
    entities.map((e) => [e.personSlug!, e.primaryArchetype!])
  );

  const nodes: GraphNode[] = people.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.displayName,
    personType: p.personType,
    appearances: appearanceCount.get(p.id) ?? 0,
    archetype: archetypeBySlug.get(p.slug) ?? null,
    avatarUrl: p.avatarUrl,
  }));

  return { nodes, edges, totalEpisodes: episodeCount };
}
