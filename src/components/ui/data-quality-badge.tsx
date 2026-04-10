/**
 * DataQualityBadge — shows a computed data completeness grade for an episode.
 * No schema changes required — computed from existing fields at render time.
 *
 * Scoring (0-100):
 *   +20 has summary (summaryLong)
 *   +20 has transcript segments
 *   +15 has guests assigned
 *   +15 has topics assigned
 *   +10 has quotes extracted
 *   +10 has lore links
 *   +5  has air date
 *   +5  has duration
 */

interface DataQualityBadgeProps {
  hasSummary: boolean;
  hasTranscript: boolean;
  guestCount: number;
  topicCount: number;
  quoteCount: number;
  loreCount: number;
  hasAirDate: boolean;
  hasDuration: boolean;
}

function computeScore(props: DataQualityBadgeProps): number {
  let score = 0;
  if (props.hasSummary) score += 20;
  if (props.hasTranscript) score += 20;
  if (props.guestCount > 0) score += 15;
  if (props.topicCount > 0) score += 15;
  if (props.quoteCount > 0) score += 10;
  if (props.loreCount > 0) score += 10;
  if (props.hasAirDate) score += 5;
  if (props.hasDuration) score += 5;
  return score;
}

function gradeFromScore(score: number): { letter: string; color: string; bg: string } {
  if (score >= 90) return { letter: "A", color: "text-accent-gold", bg: "bg-accent-gold/10 border-accent-gold/30" };
  if (score >= 70) return { letter: "B", color: "text-accent-cyan", bg: "bg-accent-cyan/10 border-accent-cyan/30" };
  if (score >= 50) return { letter: "C", color: "text-accent-gold", bg: "bg-accent-gold/10 border-accent-gold/30" };
  if (score >= 30) return { letter: "D", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" };
  return { letter: "F", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" };
}

export function DataQualityBadge(props: DataQualityBadgeProps) {
  const score = computeScore(props);
  const grade = gradeFromScore(score);

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] ${grade.bg}`}
      title={`Data completeness: ${score}% (Grade ${grade.letter})`}
    >
      <span className={`font-bold ${grade.color}`}>{grade.letter}</span>
      <span className="text-text-muted">{score}%</span>
    </div>
  );
}

export { computeScore, gradeFromScore };
