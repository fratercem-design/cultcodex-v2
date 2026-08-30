"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type SortOption = {
  label: string;
  value: string;
};

export type FilterOption = {
  label: string;
  value: string;
};

interface SortFilterBarProps {
  /** Base path for navigation, e.g. "/episodes" */
  basePath: string;
  /** Available sort options */
  sortOptions: SortOption[];
  /** Currently active sort value */
  currentSort: string;
  /** Optional filter group (e.g. status, type, canon) */
  filterLabel?: string;
  filterOptions?: FilterOption[];
  currentFilter?: string;
}

export function SortFilterBar({
  basePath,
  sortOptions,
  currentSort,
  filterLabel,
  filterOptions,
  currentFilter,
}: SortFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, searchParams, basePath],
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Sort
        </span>
        <div className="flex rounded border border-border overflow-hidden">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams("sort", opt.value)}
              className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                currentSort === opt.value
                  ? "bg-accent-gold/15 text-accent-gold-text"
                  : "text-text-muted hover:text-text-primary hover:bg-elevated"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter controls (optional) */}
      {filterLabel && filterOptions && (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {filterLabel}
          </span>
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => updateParams("filter", "all")}
              className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                !currentFilter || currentFilter === "all"
                  ? "bg-accent-gold/15 text-accent-gold-text"
                  : "text-text-muted hover:text-text-primary hover:bg-elevated"
              }`}
            >
              All
            </button>
            {filterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParams("filter", opt.value)}
                className={`px-3 py-1 font-mono text-[11px] transition-colors ${
                  currentFilter === opt.value
                    ? "bg-accent-gold/15 text-accent-gold-text"
                    : "text-text-muted hover:text-text-primary hover:bg-elevated"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
