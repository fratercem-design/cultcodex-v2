/**
 * CULT RANKINGS — pure ranking logic (no DB, no JSX).
 *
 * A member's "codex score" is derived from their activity across the
 * archive. The score maps to one of four ranks:
 *
 *   Initiate → Adept → Oracle → Archivist
 *
 * Keep this file pure so both server queries and client components can
 * import it. The server gathers RankActivity (see get-user-rank.ts) and
 * passes it here.
 */

export type RankId = "initiate" | "adept" | "oracle" | "archivist";
export type RankColor = "cyan" | "violet" | "gold" | "crimson";

export interface Rank {
  id: RankId;
  title: string;
  glyph: string;
  minScore: number;
  color: RankColor;
  hex: string;
  blurb: string;
}

/** Ascending by minScore. */
export const RANKS: readonly Rank[] = [
  {
    id: "initiate",
    title: "Initiate",
    glyph: "◈",
    minScore: 0,
    color: "cyan",
    hex: "#5DB7D8",
    blurb: "You've crossed the threshold. The archive is open before you.",
  },
  {
    id: "adept",
    title: "Adept",
    glyph: "✦",
    minScore: 60,
    color: "violet",
    hex: "#9B6ED0",
    blurb: "You move through the codex with intent. Patterns begin to surface.",
  },
  {
    id: "oracle",
    title: "Oracle",
    glyph: "◉",
    minScore: 220,
    color: "gold",
    hex: "#C8A96B",
    blurb: "You don't search the archive — you read it. The signal speaks through you.",
  },
  {
    id: "archivist",
    title: "Archivist",
    glyph: "▲",
    minScore: 600,
    color: "crimson",
    hex: "#A94A4A",
    blurb: "Keeper of the codex. You shape the mythology you study.",
  },
] as const;

/** Raw per-user activity counts used to compute the score. */
export interface RankActivity {
  favorites: number;
  savedTopics: number;
  savedQuotes: number;
  savedSearches: number;
  reactions: number;
  quoteReactions: number;
  comments: number;
  salonPosts: number;
  decks: number;
  ownedCards: number;
  signalProposals: number;
  annotations: number;
  accountAgeDays: number;
  isMember: boolean;
}

/** Point value of each activity. Tuned so contribution > collection > reaction. */
export const WEIGHTS = {
  signalProposal: 8, // contributing to the archive is worth the most
  annotation: 6,     // approved community annotations — real contribution
  salonPost: 5,
  deck: 4,
  comment: 3,
  favorite: 2,
  savedTopic: 2,
  savedQuote: 2,
  savedSearch: 2,
  ownedCard: 1,
  reaction: 1,
  quoteReaction: 1,
  perAgeDay: 0.1, // capped below
  memberBonus: 50,
} as const;

/** Account-age contribution is capped so longevity helps but can't dominate. */
const MAX_AGE_POINTS = 120; // ~1000 days

export interface ScoreLine {
  label: string;
  count: number;
  points: number;
}

/** Returns the total score plus an itemized breakdown for the UI. */
export function scoreBreakdown(a: RankActivity): { total: number; lines: ScoreLine[] } {
  const agePoints = Math.min(a.accountAgeDays * WEIGHTS.perAgeDay, MAX_AGE_POINTS);
  const lines: ScoreLine[] = [
    { label: "Signal proposals", count: a.signalProposals, points: a.signalProposals * WEIGHTS.signalProposal },
    { label: "Annotations (approved)", count: a.annotations, points: a.annotations * WEIGHTS.annotation },
    { label: "Salon posts", count: a.salonPosts, points: a.salonPosts * WEIGHTS.salonPost },
    { label: "Decks built", count: a.decks, points: a.decks * WEIGHTS.deck },
    { label: "Comments", count: a.comments, points: a.comments * WEIGHTS.comment },
    { label: "Favorites", count: a.favorites, points: a.favorites * WEIGHTS.favorite },
    { label: "Saved signals", count: a.savedTopics, points: a.savedTopics * WEIGHTS.savedTopic },
    { label: "Saved quotes", count: a.savedQuotes, points: a.savedQuotes * WEIGHTS.savedQuote },
    { label: "Saved searches", count: a.savedSearches, points: a.savedSearches * WEIGHTS.savedSearch },
    { label: "Cards collected", count: a.ownedCards, points: a.ownedCards * WEIGHTS.ownedCard },
    { label: "Episode reactions", count: a.reactions, points: a.reactions * WEIGHTS.reaction },
    { label: "Quote reactions", count: a.quoteReactions, points: a.quoteReactions * WEIGHTS.quoteReaction },
    { label: "Days in the cult", count: Math.round(a.accountAgeDays), points: Math.round(agePoints) },
  ];
  if (a.isMember) {
    lines.push({ label: "Initiate+ member", count: 1, points: WEIGHTS.memberBonus });
  }
  const total = Math.round(lines.reduce((sum, l) => sum + l.points, 0));
  return { total, lines };
}

export function computeScore(a: RankActivity): number {
  return scoreBreakdown(a).total;
}

/** Highest rank whose minScore the score meets. */
export function rankForScore(score: number): Rank {
  let current: Rank = RANKS[0];
  for (const r of RANKS) {
    if (score >= r.minScore) current = r;
  }
  return current;
}

export interface RankProgress {
  current: Rank;
  next: Rank | null;
  score: number;
  /** points remaining to reach `next` (0 if maxed). */
  toNext: number;
  /** 0-100 progress through the current tier toward the next. */
  pct: number;
}

export function rankProgress(score: number): RankProgress {
  const current = rankForScore(score);
  const idx = RANKS.findIndex((r) => r.id === current.id);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  if (!next) {
    return { current, next: null, score, toNext: 0, pct: 100 };
  }
  const span = next.minScore - current.minScore;
  const into = score - current.minScore;
  const pct = Math.max(0, Math.min(100, Math.round((into / span) * 100)));
  return { current, next, score, toNext: Math.max(0, next.minScore - score), pct };
}
