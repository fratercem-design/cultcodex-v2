/** Default items per page across the archive. */
export const DEFAULT_PAGE_SIZE = 24;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/**
 * Parse a page number from a search‑param string.
 * Returns at least 1, clamped to totalPages when known.
 */
export function parsePage(raw?: string, totalPages?: number): number {
  const n = Math.max(1, parseInt(raw ?? "1", 10) || 1);
  return totalPages ? Math.min(n, totalPages) : n;
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
