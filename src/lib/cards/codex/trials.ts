/**
 * Trials — site actions that grant a Codex card. Client-safe metadata only;
 * the DB counters that verify each one live in codex.ts (`COUNTERS`).
 *
 * Every Trial is checked against stored data rather than a client event, so
 * progress is retroactive (past favourites count) and can't be faked by
 * calling an endpoint.
 */
export type TrialCounter =
  | "favorites" | "comments" | "savedQuotes" | "reactions" | "longestStreak"
  | "readings" | "annotations" | "salonPosts" | "savedTopics" | "savedSearches"
  | "packsOpened" | "seasonCards" | "subscriber" | "oracleTier";

export interface TrialDef {
  id: string;
  counter: TrialCounter;
  target: number;
  /** Where to go to make progress. */
  href: string;
  /** Short progress label: "3 / 10 favourites". */
  unit: string;
}

export const TRIALS: TrialDef[] = [
  { id: "favorite-1",  counter: "favorites",     target: 1,  href: "/episodes",   unit: "favourite" },
  { id: "favorite-10", counter: "favorites",     target: 10, href: "/episodes",   unit: "favourites" },
  { id: "comment-1",   counter: "comments",      target: 1,  href: "/episodes",   unit: "comment" },
  { id: "quotes-5",    counter: "savedQuotes",   target: 5,  href: "/quotes",     unit: "saved quotes" },
  { id: "react-1",     counter: "reactions",     target: 1,  href: "/episodes",   unit: "reaction" },
  { id: "streak-7",    counter: "longestStreak", target: 7,  href: "/cards/packs", unit: "day streak" },
  { id: "streak-30",   counter: "longestStreak", target: 30, href: "/cards/packs", unit: "day streak" },
  { id: "reading-1",   counter: "readings",      target: 1,  href: "/cards/reading", unit: "reading" },
  { id: "annotate-1",  counter: "annotations",   target: 1,  href: "/episodes",   unit: "annotation" },
  { id: "salon-1",     counter: "salonPosts",    target: 1,  href: "/salon",      unit: "salon post" },
  { id: "topics-3",    counter: "savedTopics",   target: 3,  href: "/topics",     unit: "topics followed" },
  { id: "search-1",    counter: "savedSearches", target: 1,  href: "/search",     unit: "saved search" },
  { id: "packs-5",     counter: "packsOpened",   target: 5,  href: "/cards/packs", unit: "packs opened" },
  { id: "collect-25",  counter: "seasonCards",   target: 25, href: "/cards",      unit: "season cards" },
  { id: "subscriber",  counter: "subscriber",    target: 1,  href: "/premium",    unit: "membership" },
  { id: "oracle-tier", counter: "oracleTier",    target: 1,  href: "/premium",    unit: "Oracle tier" },
];

export const TRIAL_BY_ID = new Map(TRIALS.map((t) => [t.id, t]));
