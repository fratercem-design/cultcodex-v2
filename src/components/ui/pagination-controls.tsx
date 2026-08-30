"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { PaginationMeta } from "@/lib/pagination";

interface PaginationControlsProps {
  meta: PaginationMeta;
  basePath: string;
}

export function PaginationControls({
  meta,
  basePath,
}: PaginationControlsProps) {
  const searchParams = useSearchParams();
  const { page, totalPages, totalCount, pageSize } = meta;

  if (totalPages <= 1) return null;

  /** Build href preserving all existing query params. */
  function href(targetPage: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  // Build the page numbers to display (show up to 5 around current)
  const pageNumbers = buildPageRange(page, totalPages);

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <nav
      className="mt-8 flex flex-col items-center gap-3"
      aria-label="Pagination"
    >
      <p className="font-mono text-[10px] text-text-muted">
        Showing {start}–{end} of {totalCount}
      </p>

      <div className="flex items-center gap-1">
        {/* Previous */}
        {page > 1 ? (
          <Link
            href={href(page - 1)}
            className="rounded border border-border px-3 py-1 font-mono text-[11px] text-text-muted hover:text-accent-gold-text hover:border-accent-gold/30 transition-colors"
          >
            ← Prev
          </Link>
        ) : (
          <span className="rounded border border-border/50 px-3 py-1 font-mono text-[11px] text-text-muted/60 cursor-not-allowed">
            ← Prev
          </span>
        )}

        {/* Page numbers */}
        {pageNumbers.map((n, i) =>
          n === null ? (
            <span
              key={`gap-${i}`}
              className="px-1 font-mono text-[11px] text-text-muted/60"
            >
              …
            </span>
          ) : (
            <Link
              key={n}
              href={href(n)}
              className={`rounded border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                n === page
                  ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold-text"
                  : "border-border text-text-muted hover:text-accent-gold-text hover:border-accent-gold/30"
              }`}
            >
              {n}
            </Link>
          ),
        )}

        {/* Next */}
        {page < totalPages ? (
          <Link
            href={href(page + 1)}
            className="rounded border border-border px-3 py-1 font-mono text-[11px] text-text-muted hover:text-accent-gold-text hover:border-accent-gold/30 transition-colors"
          >
            Next →
          </Link>
        ) : (
          <span className="rounded border border-border/50 px-3 py-1 font-mono text-[11px] text-text-muted/60 cursor-not-allowed">
            Next →
          </span>
        )}
      </div>
    </nav>
  );
}

// ── Page range builder ──────────────────────────────────────────────
// Always show first, last, and up to 3 pages around current.
// Gaps are represented as `null`.

function buildPageRange(
  current: number,
  total: number,
): (number | null)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  pages.add(1);
  pages.add(total);
  for (let d = -1; d <= 1; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push(null); // gap
    }
    result.push(sorted[i]);
  }

  return result;
}
