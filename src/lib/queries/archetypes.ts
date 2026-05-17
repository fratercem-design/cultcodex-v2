import { prisma } from "@/lib/db";
import { getEraForEpisode } from "@/lib/eras";

export interface ArchetypeSampleEntity {
  slug: string;
  name: string;
  personSlug: string | null;
  avatarUrl: string | null;
}

export interface ArchetypeSummary {
  name: string;
  slug: string;
  entityCount: number;
  sampleEntities: ArchetypeSampleEntity[];
}

export interface ArchetypeEntity {
  id: string;
  slug: string;
  name: string;
  primaryArchetype: string | null;
  status: string;
  personSlug: string | null;
  avatarUrl: string | null;
  chapterCount: number;
  behaviorPatterns: string[];
}

export interface ArchetypeDetail {
  name: string;
  slug: string;
  entities: ArchetypeEntity[];
  coArchetypes: Array<{ name: string; slug: string; count: number }>;
  eraDistribution: Record<string, number>;
}

// Compound primaryArchetype values commonly look like "Mirror/Gravity",
// "Mirror & Gravity", "Mirror — Gravity", or "Mirror, Gravity".
const ARCHETYPE_SEPARATORS = /\s*[/&,|]\s*|\s+—\s+|\s+and\s+/i;

function splitArchetypes(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(ARCHETYPE_SEPARATORS)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function archetypeToSlug(archetype: string): string {
  return archetype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function listArchetypes(): Promise<ArchetypeSummary[]> {
  const entities = await prisma.psychenomiconEntity.findMany({
    where: { primaryArchetype: { not: null } },
    select: {
      slug: true,
      name: true,
      primaryArchetype: true,
      personSlug: true,
    },
  });

  const personSlugs = entities
    .map((e) => e.personSlug)
    .filter((s): s is string => Boolean(s));

  const personAvatars =
    personSlugs.length > 0
      ? await prisma.person.findMany({
          where: { slug: { in: personSlugs } },
          select: { slug: true, avatarUrl: true },
        })
      : [];
  const avatarBySlug = new Map(personAvatars.map((p) => [p.slug, p.avatarUrl]));

  const buckets = new Map<
    string,
    { name: string; entities: ArchetypeSampleEntity[] }
  >();

  for (const e of entities) {
    const tokens = splitArchetypes(e.primaryArchetype);
    for (const token of tokens) {
      const key = token.toLowerCase();
      if (!buckets.has(key)) {
        buckets.set(key, { name: token, entities: [] });
      }
      buckets.get(key)!.entities.push({
        slug: e.slug,
        name: e.name,
        personSlug: e.personSlug,
        avatarUrl: e.personSlug
          ? avatarBySlug.get(e.personSlug) ?? null
          : null,
      });
    }
  }

  return [...buckets.values()]
    .map((b) => ({
      name: b.name,
      slug: archetypeToSlug(b.name),
      entityCount: b.entities.length,
      sampleEntities: b.entities.slice(0, 4),
    }))
    .sort((a, b) => b.entityCount - a.entityCount);
}

export async function getArchetypeDetail(
  slug: string
): Promise<ArchetypeDetail | null> {
  const allEntities = await prisma.psychenomiconEntity.findMany({
    where: { primaryArchetype: { not: null } },
    select: {
      id: true,
      slug: true,
      name: true,
      primaryArchetype: true,
      status: true,
      personSlug: true,
      behaviorPatterns: true,
      appearances: { select: { chapterId: true } },
    },
  });

  let canonicalName = "";
  const matches = allEntities.filter((e) => {
    const tokens = splitArchetypes(e.primaryArchetype);
    for (const token of tokens) {
      if (archetypeToSlug(token) === slug) {
        if (!canonicalName) canonicalName = token;
        return true;
      }
    }
    return false;
  });

  if (matches.length === 0) return null;

  const personSlugs = matches
    .map((e) => e.personSlug)
    .filter((s): s is string => Boolean(s));

  const persons =
    personSlugs.length > 0
      ? await prisma.person.findMany({
          where: { slug: { in: personSlugs } },
          select: {
            slug: true,
            avatarUrl: true,
            guestAppearances: {
              where: {
                episode: { status: "published", airDate: { not: null } },
              },
              select: { episode: { select: { airDate: true } } },
            },
          },
        })
      : [];
  const personData = new Map(persons.map((p) => [p.slug, p]));

  const entities: ArchetypeEntity[] = matches.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    primaryArchetype: e.primaryArchetype,
    status: e.status,
    personSlug: e.personSlug,
    avatarUrl: e.personSlug
      ? personData.get(e.personSlug)?.avatarUrl ?? null
      : null,
    chapterCount: e.appearances.length,
    behaviorPatterns: e.behaviorPatterns,
  }));

  // Cross-archetype affinity — which other archetypes do these entities share?
  const coCounts = new Map<string, number>();
  for (const e of matches) {
    const tokens = splitArchetypes(e.primaryArchetype);
    for (const token of tokens) {
      if (archetypeToSlug(token) === slug) continue;
      coCounts.set(token, (coCounts.get(token) ?? 0) + 1);
    }
  }
  const coArchetypes = [...coCounts.entries()]
    .map(([name, count]) => ({ name, slug: archetypeToSlug(name), count }))
    .sort((a, b) => b.count - a.count);

  // Era distribution — total guest appearances in each era
  const eraDistribution: Record<string, number> = {};
  for (const e of matches) {
    if (!e.personSlug) continue;
    const person = personData.get(e.personSlug);
    if (!person) continue;
    for (const ga of person.guestAppearances) {
      const era = getEraForEpisode(ga.episode.airDate);
      if (era) {
        eraDistribution[era.id] = (eraDistribution[era.id] ?? 0) + 1;
      }
    }
  }

  return {
    name: canonicalName,
    slug,
    entities: entities.sort((a, b) => b.chapterCount - a.chapterCount),
    coArchetypes,
    eraDistribution,
  };
}
