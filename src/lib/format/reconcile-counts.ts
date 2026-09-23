/**
 * AI-written profile prose freezes the appearance count at generation time
 * ("With 174 documented appearances…") while the stat beside it is live
 * (1,419). The 2026-09 audit caught the two disagreeing on Psyche's own
 * profile. Rewrite any "<n> documented/recorded/archived appearances" phrase
 * to the live count so prose and stats can't contradict each other.
 */
export function reconcileAppearanceCount(text: string, liveCount: number): string {
  if (!Number.isFinite(liveCount) || liveCount <= 0) return text;
  const live = liveCount.toLocaleString("en-US");
  return text.replace(
    /\b\d[\d,]*(\s+(?:documented|recorded|archived|catalogued|cataloged)\s+appearances?)\b/gi,
    (_m, rest: string) => `${live}${liveCount === 1 ? rest.replace(/appearances$/i, "appearance") : rest.replace(/appearance$/i, "appearances")}`,
  );
}
