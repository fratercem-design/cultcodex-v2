import { prisma } from "@/lib/db";
import { embedOne, vectorLiteral } from "@/lib/embeddings";

export interface ConceptQuery {
  concept: string;
  /** Minimum cosine similarity to count this concept as matched (0–1). Default 0.6 */
  threshold?: number;
}

export interface SemanticResult {
  segmentId: string;
  episodeId: string;
  episodeSlug: string;
  episodeTitle: string;
  episodeNumber: number | null;
  airDate: Date | null;
  thumbnailUrl: string | null;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
  /** Sum of per-concept cosine similarities — higher = better overall match */
  score: number;
  /** Per-concept similarity scores, keyed by concept string */
  conceptScores: Record<string, number>;
}

function clamp01(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 0), 1);
}

function clampInt(n: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), min), max);
}

function isoOrNull(d: Date | undefined): string | null {
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Multi-concept intersection semantic search.
 *
 * Strategy:
 * 1. CTE finds top-200 candidate segments by primary concept (HNSW index path).
 * 2. Re-score those 200 candidates against every concept.
 * 3. Filter: every concept must exceed its threshold.
 * 4. Rank by sum of similarities, return top `limit`.
 *
 * This avoids a full table scan — only the primary concept touches the HNSW index;
 * remaining concepts run as brute-force distance on the 200-row candidate set.
 */
export async function semanticSearch(
  concepts: ConceptQuery[],
  options: {
    limit?: number;
    eraDateStart?: Date;
    eraDateEnd?: Date;
    /** Exclude segments from this episode (for cross-reference panels) */
    excludeEpisodeId?: string;
  } = {}
): Promise<SemanticResult[]> {
  if (concepts.length === 0) return [];

  const defaultThreshold = 0.6;
  const limit = clampInt(Number(options.limit ?? 20), 1, 50, 20);
  const thresholds = concepts.map((c) => clamp01(Number(c.threshold ?? defaultThreshold), defaultThreshold));

  // Embed all concepts in parallel
  const vectors = await Promise.all(concepts.map((c) => embedOne(c.concept)));

  // Primary concept (index-accelerated candidate scan)
  const primaryVec = vectorLiteral(vectors[0]);

  // Build additional CTE filter clauses
  const extraFilters: string[] = [];

  const eraStart = isoOrNull(options.eraDateStart);
  const eraEnd = isoOrNull(options.eraDateEnd);
  if (eraStart) extraFilters.push(`e."airDate" >= '${eraStart}'`);
  if (eraEnd) extraFilters.push(`e."airDate" <= '${eraEnd}'`);
  if (options.excludeEpisodeId) {
    // Strip non-alphanumeric/hyphen chars to prevent injection (IDs are cuid/UUID)
    const safeId = options.excludeEpisodeId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (safeId) extraFilters.push(`e.id != '${safeId}'`);
  }

  const eraFilterCte = extraFilters.length > 0 ? `AND ${extraFilters.join(" AND ")}` : "";

  // Build per-concept score expressions and threshold filters
  // Each is: 1 - (embedding <=> '[...]'::vector)  (cosine similarity from cosine distance)
  const conceptScoreExprs = vectors.map(
    (vec, i) => `1 - (s."embedding" <=> '${vectorLiteral(vec)}'::vector) AS score_${i}`
  );
  const thresholdFilters = thresholds.map(
    (t, i) => `1 - (s."embedding" <=> '${vectorLiteral(vectors[i])}'::vector) >= ${t}`
  );
  const totalScoreExpr = vectors.map((_, i) => `score_${i}`).join(" + ");
  const conceptScoreSelect = vectors.map((_, i) => `scored.score_${i}`).join(", ");

  const sql = `
    WITH candidates AS (
      SELECT s.id
      FROM "TranscriptSegment" s
      JOIN "Episode" e ON s."episodeId" = e.id
      WHERE s.embedding IS NOT NULL
        AND e.status = 'published'
        ${eraFilterCte}
      ORDER BY s.embedding <=> '${primaryVec}'::vector
      LIMIT 200
    ),
    scored AS (
      SELECT
        s.id             AS "segmentId",
        s."episodeId",
        s."startSeconds",
        s."endSeconds",
        s."speakerLabel",
        s.text,
        e.slug           AS "episodeSlug",
        e.title          AS "episodeTitle",
        e."episodeNumber",
        e."airDate",
        e."thumbnailUrl",
        ${conceptScoreExprs.join(",\n        ")}
      FROM candidates c
      JOIN "TranscriptSegment" s ON s.id = c.id
      JOIN "Episode" e ON s."episodeId" = e.id
    )
    SELECT
      scored."segmentId",
      scored."episodeId",
      scored."episodeSlug",
      scored."episodeTitle",
      scored."episodeNumber",
      scored."airDate",
      scored."thumbnailUrl",
      scored."startSeconds",
      scored."endSeconds",
      scored."speakerLabel",
      scored.text,
      (${totalScoreExpr}) AS total_score,
      ${conceptScoreSelect}
    FROM scored
    WHERE ${thresholdFilters.join("\n      AND ")}
    ORDER BY total_score DESC
    LIMIT ${limit}
  `;

  type SemanticRow = {
    segmentId: string;
    episodeId: string;
    episodeSlug: string;
    episodeTitle: string;
    episodeNumber: number | null;
    airDate: Date | string | null;
    thumbnailUrl: string | null;
    startSeconds: number;
    endSeconds: number;
    speakerLabel: string | null;
    text: string;
    total_score: number;
    [key: string]: unknown;
  };

  const rows = await prisma.$queryRawUnsafe<SemanticRow[]>(sql);

  return rows.map((row) => {
    const conceptScores: Record<string, number> = {};
    concepts.forEach((c, i) => {
      conceptScores[c.concept] = Number(row[`score_${i}`]);
    });
    return {
      segmentId: row.segmentId,
      episodeId: row.episodeId,
      episodeSlug: row.episodeSlug,
      episodeTitle: row.episodeTitle,
      episodeNumber: row.episodeNumber ? Number(row.episodeNumber) : null,
      airDate: row.airDate ? new Date(row.airDate) : null,
      thumbnailUrl: row.thumbnailUrl ?? null,
      startSeconds: Number(row.startSeconds),
      endSeconds: Number(row.endSeconds),
      speakerLabel: row.speakerLabel ?? null,
      text: row.text,
      score: Number(row.total_score),
      conceptScores,
    };
  });
}
