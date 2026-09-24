import { prisma } from "@/lib/db";
import {
  currentRelationState,
  relationshipTimeline,
  type RelationshipTimelineBeat,
} from "@/lib/relationships";
import type { RelationType, ConfidenceLevel } from "@/generated/prisma/client";

export interface DossierBeat {
  id: string;
  headline: string;
  details: string | null;
  relationType: RelationType;
  isTurn: boolean;
  occurredAt: Date | null;
  episode: { slug: string; title: string; episodeNumber: number | null } | null;
  confidence: ConfidenceLevel | null;
}

export interface RelationshipDossierEntry {
  counterpart: { id: string; slug: string; displayName: string; avatarUrl: string | null };
  currentState: RelationType;
  beats: DossierBeat[];
}

const EVENT_INCLUDE = {
  personA: { select: { id: true, slug: true, displayName: true, avatarUrl: true } },
  personB: { select: { id: true, slug: true, displayName: true, avatarUrl: true } },
  episode: { select: { slug: true, title: true, episodeNumber: true } },
  evidence: { select: { confidence: true } },
} as const;

/**
 * The Book of Trolls relationship dossier: every counterpart this person has
 * relationship history with, each as an evolving timeline of cited beats.
 */
export async function getRelationshipDossier(personId: string): Promise<RelationshipDossierEntry[]> {
  const events = await prisma.relationshipEvent
    .findMany({
      where: { OR: [{ personAId: personId }, { personBId: personId }] },
      include: EVENT_INCLUDE,
      orderBy: { createdAt: "asc" },
      take: 500,
    })
    .catch(() => []);

  if (events.length === 0) return [];

  const byCounterpart = new Map<string, typeof events>();
  for (const event of events) {
    const counterpart = event.personAId === personId ? event.personB : event.personA;
    const list = byCounterpart.get(counterpart.id) ?? [];
    list.push(event);
    byCounterpart.set(counterpart.id, list);
  }

  const entries: RelationshipDossierEntry[] = [];
  for (const [, pairEvents] of byCounterpart) {
    const counterpart =
      pairEvents[0].personAId === personId ? pairEvents[0].personB : pairEvents[0].personA;
    const beats: RelationshipTimelineBeat[] = relationshipTimeline(pairEvents);
    entries.push({
      counterpart,
      currentState: currentRelationState(pairEvents),
      beats: beats.map(({ event, isTurn }) => {
        const source = pairEvents.find((e) => e.id === event.id);
        return {
          id: event.id,
          headline: event.headline,
          details: event.details,
          relationType: event.relationType,
          isTurn,
          occurredAt: event.occurredAt,
          episode: source?.episode ?? null,
          confidence: source?.evidence?.confidence ?? null,
        };
      }),
    });
  }

  // Longest histories first — the richest stories lead the dossier.
  return entries.sort((a, b) => b.beats.length - a.beats.length);
}
