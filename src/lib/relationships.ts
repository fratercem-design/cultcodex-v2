import type { RelationshipEvent, RelationType } from "@/generated/prisma/client";

/**
 * Trollopedia relationship engine helpers.
 *
 * Relationships are an event log, not a state table: the current state of a
 * pair is the latest event's relationType. Pairs are normalized so that
 * personAId < personBId — always write through normalizePair() to avoid
 * mirrored duplicates.
 */

export function normalizePair(personXId: string, personYId: string): { personAId: string; personBId: string } {
  return personXId < personYId
    ? { personAId: personXId, personBId: personYId }
    : { personAId: personYId, personBId: personXId };
}

/** Sort events into story order: occurredAt when known, createdAt as fallback. */
function eventTime(e: RelationshipEvent): number {
  return (e.occurredAt ?? e.createdAt).getTime();
}

/**
 * Derive the current relationship state for a pair from its event log.
 * Returns "unknown" for an empty log.
 */
export function currentRelationState(events: RelationshipEvent[]): RelationType {
  if (events.length === 0) return "unknown";
  const latest = events.reduce((a, b) => (eventTime(b) >= eventTime(a) ? b : a));
  return latest.relationType;
}

export interface RelationshipTimelineBeat {
  event: RelationshipEvent;
  /** State before this beat, "unknown" for the first. */
  previousState: RelationType;
  /** True when this beat changed the relationType (a story turn, not a repeat citation). */
  isTurn: boolean;
}

/**
 * Build the display timeline for a pair: chronological beats, each flagged
 * as a turn when the relation state changed.
 */
export function relationshipTimeline(events: RelationshipEvent[]): RelationshipTimelineBeat[] {
  const ordered = [...events].sort((a, b) => eventTime(a) - eventTime(b));
  let previousState: RelationType = "unknown";
  return ordered.map((event) => {
    const beat: RelationshipTimelineBeat = {
      event,
      previousState,
      isTurn: event.relationType !== previousState,
    };
    previousState = event.relationType;
    return beat;
  });
}

/** Human-readable labels for relationship states. */
export const RELATION_LABELS: Record<RelationType, string> = {
  friend: "Friend",
  former_friend: "Former Friend",
  ally: "Ally",
  frequent_collaborator: "Frequent Collaborator",
  debate_rival: "Debate Rival",
  enemy: "Enemy",
  occasional_guest: "Occasional Guest",
  moderator: "Moderator",
  supporter: "Supporter",
  critic: "Critic",
  student: "Student",
  mentor: "Mentor",
  community_member: "Community Member",
  unknown: "Unknown",
};
