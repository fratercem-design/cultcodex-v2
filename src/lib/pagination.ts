/** Default items per page across the archive. */
export const DEFAULT_PAGE_SIZE = 24;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Parse an untrusted decimal query parameter and constrain it to a safe range.
 * Partial numbers (for example `10px`), decimals, exponents, and integers that
 * cannot be represented safely are treated as invalid rather than truncated.
 */
export function parseBoundedInteger(
  raw: string | null | undefined,
  { fallback, min, max }: { fallback: number; min: number; max: number },
): number {
  if (!raw || !/^\d+$/.test(raw)) return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value)) return fallback;

  return Math.min(Math.max(value, min), max);
}

/**
 * Parse a page number from a search‑param string.
 * Returns at least 1, clamped to totalPages when known.
 */
export function parsePage(raw?: string, totalPages?: number): number {
  return parseBoundedInteger(raw, {
    fallback: 1,
    min: 1,
    max: totalPages && totalPages > 0 ? totalPages : Number.MAX_SAFE_INTEGER,
  });
}

/** Derive skip / take values from page + pageSize. */
export function paginationArgs(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Build a full PaginationMeta object. */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}
