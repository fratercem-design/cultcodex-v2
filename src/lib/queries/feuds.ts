import { prisma } from "@/lib/db";
import { frontDoorTextExclusions } from "@/lib/content-hygiene";
import { currentRelationState, relationshipTimeline } from "@/lib/relationships";
import type { RelationType } from "@/generated/prisma/client";
import { HOSTILE, feudSlug, mentionNames, orderFeudItems, type FeudItem } from "@/lib/feuds";

export { feudSlug, parseFeudSlug } from "@/lib/feuds";

export interface FeudSummary {
  slug: string;
  people: { slug: string; displayName: string; avatarUrl: string | null }[];
  events: number;
  hostile: number;
  state: RelationType;
  lastAt: Date | null;
}

/** Pairs with at least one hostile beat, most hostile history first. */
export async function getFeuds(take = 40): Promise<FeudSummary[]> {
  const events = await prisma.relationshipEvent.findMany({
    select: {
      id: true, personAId: true, personBId: true, relationType: true, occurredAt: true, createdAt: true,
      headline: true, details: true, episodeId: true, evidenceId: true, updatedAt: true,
      personA: { select: { slug: true, displayName: true, avatarUrl: true } },
      personB: { select: { slug: true, displayName: true, avatarUrl: true } },
    },
    take: 5000,
  });

  const byPair = new Map<string, typeof events>();
  for (const e of events) {
    if (e.personAId === e.personBId) continue;
    const key = [e.personAId, e.personBId].sort().join(":");
    byPair.set(key, [...(byPair.get(key) ?? []), e]);
  }

  const feuds: FeudSummary[] = [];
  for (const pair of byPair.values()) {
    const hostile = pair.filter((e) => HOSTILE.includes(e.relationType)).length;
    if (hostile === 0) continue;
    const { personA, personB } = pair[0];
    const times = pair.map((e) => (e.occurredAt ?? e.createdAt).getTime());
    feuds.push({
      slug: feudSlug(personA.slug, personB.slug),
      people: [personA, personB].sort((a, b) => a.slug.localeCompare(b.slug)),
      events: pair.length,
      hostile,
      state: currentRelationState(pair),
      lastAt: new Date(Math.max(...times)),
    });
  }
  return feuds.sort((a, b) => b.hostile - a.hostile || b.events - a.events).slice(0, take);
}

export interface Feud {
  slug: string;
  people: { id: string; slug: string; displayName: string; avatarUrl: string | null; shortBio: string | null }[];
  state: RelationType;
  items: FeudItem[];
  counts: { events: number; quotes: number };
}

/**
 * One feud as a cited story: every relationship beat between the two, and
 * every quote in which one of them names the other, in date order. Each quote
 * links to its moment in the stream.
 */
export async function getFeud(slugA: string, slugB: string): Promise<Feud | null> {
  const people = await prisma.person.findMany({
    where: { slug: { in: [slugA, slugB] } },
    select: { id: true, slug: true, displayName: true, altNames: true, avatarUrl: true, shortBio: true },
  });
  if (people.length !== 2) return null;
  const [a, b] = people.sort((x, y) => x.slug.localeCompare(y.slug));

  const events = await prisma.relationshipEvent.findMany({
    where: { OR: [{ personAId: a.id, personBId: b.id }, { personAId: b.id, personBId: a.id }] },
    include: { episode: { select: { slug: true, title: true, airDate: true, status: true } } },
  });

  const quoteAbout = (speaker: typeof a, target: typeof a) => ({
    speakerPersonId: speaker.id,
    OR: mentionNames(target).map((name) => ({ text: { contains: name, mode: "insensitive" as const } })),
  });
  const quotes = await prisma.quote.findMany({
    where: {
      OR: [quoteAbout(a, b), quoteAbout(b, a)],
      episode: { status: "published" },
      AND: frontDoorTextExclusions("text"),
    },
    select: {
      id: true, text: true, timestampSeconds: true, speakerPersonId: true,
      episode: { select: { slug: true, title: true, airDate: true } },
    },
    take: 80,
  });

  const byId = new Map(people.map((p) => [p.id, p]));
  const items: FeudItem[] = [
    ...relationshipTimeline(events).map(({ event, isTurn }) => {
      const source = events.find((e) => e.id === event.id)!;
      const published = source.episode?.status === "published" ? source.episode : null;
      return {
        kind: "event" as const,
        id: event.id,
        at: event.occurredAt ?? published?.airDate ?? null,
        headline: event.headline,
        details: event.details,
        relationType: event.relationType,
        isTurn,
        episode: published ? { slug: published.slug, title: published.title } : null,
      };
    }),
    ...quotes.flatMap((q) => {
      const speaker = q.speakerPersonId ? byId.get(q.speakerPersonId) : undefined;
      if (!speaker || !q.episode) return [];
      return [{
        kind: "quote" as const,
        id: q.id,
        at: q.episode.airDate,
        text: q.text,
        speaker: { slug: speaker.slug, displayName: speaker.displayName },
        timestampSeconds: q.timestampSeconds,
        episode: { slug: q.episode.slug, title: q.episode.title },
      }];
    }),
  ];

  return {
    slug: feudSlug(a.slug, b.slug),
    people: [a, b].map((p) => ({ id: p.id, slug: p.slug, displayName: p.displayName, avatarUrl: p.avatarUrl, shortBio: p.shortBio })),
    state: currentRelationState(events),
    items: orderFeudItems(items),
    counts: { events: events.length, quotes: quotes.length },
  };
}
