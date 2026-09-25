/** Pure feud helpers: URLs, name matching, timeline order. No database. */
import type { RelationType } from "@/generated/prisma/client";

/** Relationship types that make a pair a feud rather than a friendship. */
export const HOSTILE: RelationType[] = ["enemy", "debate_rival", "critic", "former_friend"];

/** One URL per pair, whichever order the slugs arrive in. */
export function feudSlug(slugA: string, slugB: string): string {
  return [slugA, slugB].sort().join("--vs--");
}

export function parseFeudSlug(value: string): [string, string] | null {
  const parts = value.split("--vs--");
  return parts.length === 2 && parts[0] && parts[1] && parts[0] !== parts[1] ? [parts[0], parts[1]] : null;
}

/**
 * The names a quote can use for someone: display name, alt names, and their
 * first word when it is distinctive enough (5+ letters: "Alexandra", "Samman";
 * never "Alex" or "Sam", which name half the chat).
 */
export function mentionNames(person: { displayName: string; altNames: string[] }): string[] {
  const names = new Set<string>();
  for (const raw of [person.displayName, ...person.altNames]) {
    // Leftovers of earlier merges ("[MERGED] AM") are not names anyone says.
    if (/^\s*\[merged\]/i.test(raw)) continue;
    for (const part of raw.split(/[/()]/)) {
      const name = part.trim();
      if (name.length >= 4) names.add(name);
      const first = name.split(/\s+/)[0];
      if (first && first.length >= 5) names.add(first);
    }
  }
  return [...names].slice(0, 16);
}

export type FeudItem =
  | {
      kind: "event";
      id: string;
      at: Date | null;
      headline: string;
      details: string | null;
      relationType: RelationType;
      isTurn: boolean;
      episode: { slug: string; title: string } | null;
    }
  | {
      kind: "quote";
      id: string;
      at: Date | null;
      text: string;
      speaker: { slug: string; displayName: string };
      timestampSeconds: number | null;
      episode: { slug: string; title: string };
    };

/** Dated items first in story order; undated ones keep their order at the end. */
export function orderFeudItems(items: FeudItem[]): FeudItem[] {
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const ta = a.item.at?.getTime() ?? Number.POSITIVE_INFINITY;
      const tb = b.item.at?.getTime() ?? Number.POSITIVE_INFINITY;
      return ta - tb || a.i - b.i;
    })
    .map(({ item }) => item);
}
