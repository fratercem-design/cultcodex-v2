import { prisma } from "@/lib/db";

export interface PathPerson {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  personType: string;
}

export interface PathEpisode {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  thumbnailUrl: string | null;
}

export interface PathStep {
  /** The person at this node. */
  person: PathPerson;
  /** The episode that bridges from the previous person to this one. Null on the start node. */
  via: PathEpisode | null;
}

export interface ConnectionPathResult {
  steps: PathStep[];
  degree: number;
  /** True if both people exist AND a path was found. */
  found: boolean;
  /** Set when the path search short-circuited because input was invalid. */
  reason?: "same_person" | "missing_endpoint" | "no_path";
}

export interface PickerPerson {
  slug: string;
  displayName: string;
  appearanceCount: number;
}

/**
 * Top N people by published appearance count — used to populate the
 * connection-path datalist. Keeps the picker tractable.
 */
export async function getConnectionPicker(
  limit = 250
): Promise<PickerPerson[]> {
  const rows = await prisma.episodeGuest.groupBy({
    by: ["personId"],
    where: { episode: { status: "published" } },
    _count: true,
    orderBy: { _count: { personId: "desc" } },
    take: limit,
  });

  if (rows.length === 0) return [];

  const people = await prisma.person.findMany({
    where: { id: { in: rows.map((r) => r.personId) } },
    select: { id: true, slug: true, displayName: true },
  });
  const bySlug = new Map(people.map((p) => [p.id, p]));

  return rows
    .map((row) => {
      const p = bySlug.get(row.personId);
      if (!p) return null;
      return {
        slug: p.slug,
        displayName: p.displayName,
        appearanceCount: row._count,
      };
    })
    .filter((p): p is PickerPerson => Boolean(p))
    .sort((a, b) => b.appearanceCount - a.appearanceCount);
}

/**
 * Breadth-first shortest path between two people through their
 * co-appearance graph. Returns the chain of people and the bridging
 * episodes between each consecutive pair.
 */
export async function findConnectionPath(
  fromSlug: string,
  toSlug: string
): Promise<ConnectionPathResult> {
  const empty = (reason: ConnectionPathResult["reason"]): ConnectionPathResult => ({
    steps: [],
    degree: 0,
    found: false,
    reason,
  });

  // Resolve both endpoints to ids
  const endpoints = await prisma.person.findMany({
    where: { slug: { in: [fromSlug, toSlug] } },
    select: { id: true, slug: true },
  });
  const fromId = endpoints.find((p) => p.slug === fromSlug)?.id;
  const toId = endpoints.find((p) => p.slug === toSlug)?.id;
  if (!fromId || !toId) return empty("missing_endpoint");
  if (fromId === toId) return empty("same_person");

  // Build adjacency from EpisodeGuest co-appearances on published episodes.
  // Stores the first-seen episode for each undirected (a,b) pair.
  const guestRows = await prisma.episodeGuest.findMany({
    where: { episode: { status: "published" } },
    select: { episodeId: true, personId: true },
  });

  const byEpisode = new Map<string, string[]>();
  for (const g of guestRows) {
    const list = byEpisode.get(g.episodeId);
    if (list) list.push(g.personId);
    else byEpisode.set(g.episodeId, [g.personId]);
  }

  const adj = new Map<string, Map<string, string>>();
  for (const [episodeId, people] of byEpisode) {
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const a = people[i];
        const b = people[j];
        if (a === b) continue;
        let aMap = adj.get(a);
        if (!aMap) {
          aMap = new Map();
          adj.set(a, aMap);
        }
        let bMap = adj.get(b);
        if (!bMap) {
          bMap = new Map();
          adj.set(b, bMap);
        }
        if (!aMap.has(b)) aMap.set(b, episodeId);
        if (!bMap.has(a)) bMap.set(a, episodeId);
      }
    }
  }

  // BFS
  const visited = new Set<string>([fromId]);
  const parent = new Map<string, { prev: string; viaEpisodeId: string }>();
  const queue: string[] = [fromId];

  let found = false;
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current);
    if (!neighbors) continue;
    for (const [neighbor, viaEpisodeId] of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, { prev: current, viaEpisodeId });
      if (neighbor === toId) {
        found = true;
        break;
      }
      queue.push(neighbor);
    }
    if (found) break;
  }

  if (!found) return empty("no_path");

  // Reconstruct the id chain from target back to start
  const idChain: Array<{ personId: string; viaEpisodeId: string | null }> = [];
  let cursor: string | undefined = toId;
  while (cursor && cursor !== fromId) {
    const p = parent.get(cursor);
    if (!p) break;
    idChain.unshift({ personId: cursor, viaEpisodeId: p.viaEpisodeId });
    cursor = p.prev;
  }
  idChain.unshift({ personId: fromId, viaEpisodeId: null });

  // Hydrate people + episodes
  const personIds = idChain.map((s) => s.personId);
  const episodeIds = idChain
    .map((s) => s.viaEpisodeId)
    .filter((id): id is string => Boolean(id));

  const [people, episodes] = await Promise.all([
    prisma.person.findMany({
      where: { id: { in: personIds } },
      select: {
        id: true,
        slug: true,
        displayName: true,
        avatarUrl: true,
        personType: true,
      },
    }),
    prisma.episode.findMany({
      where: { id: { in: episodeIds } },
      select: {
        id: true,
        slug: true,
        title: true,
        episodeNumber: true,
        airDate: true,
        thumbnailUrl: true,
      },
    }),
  ]);

  const personById = new Map(people.map((p) => [p.id, p]));
  const episodeById = new Map(episodes.map((e) => [e.id, e]));

  const steps: PathStep[] = idChain.map((s) => {
    const person = personById.get(s.personId)!;
    return {
      person,
      via: s.viaEpisodeId ? episodeById.get(s.viaEpisodeId) ?? null : null,
    };
  });

  return { steps, degree: steps.length - 1, found: true };
}
