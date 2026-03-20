"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface ViewToggleProps {
  basePath: string;
  currentView: string;
}

export function ViewToggle({ basePath, currentView }: ViewToggleProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = useCallback(
    (view: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (view === "card") {
        params.delete("view");
      } else {
        params.set("view", view);
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, searchParams, basePath],
  );

  return (
    <div className="flex rounded border border-border overflow-hidden">
      <button
        onClick={() => setView("card")}
        className={`px-2.5 py-1.5 transition-colors ${
          currentView === "card" || (currentView !== "list" && currentView !== "timeline")
            ? "bg-accent-green/15 text-accent-green"
            : "text-text-muted hover:text-text-primary hover:bg-elevated"
        }`}
        title="Card view"
        aria-label="Card view"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
          <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
        </svg>
      </button>
      <button
        onClick={() => setView("list")}
        className={`px-2.5 py-1.5 transition-colors ${
          currentView === "list"
            ? "bg-accent-green/15 text-accent-green"
            : "text-text-muted hover:text-text-primary hover:bg-elevated"
        }`}
        title="List view"
        aria-label="List view"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        onClick={() => setView("timeline")}
        className={`px-2.5 py-1.5 transition-colors ${
          currentView === "timeline"
            ? "bg-accent-green/15 text-accent-green"
            : "text-text-muted hover:text-text-primary hover:bg-elevated"
        }`}
        title="Timeline view"
        aria-label="Timeline view"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
        </svg>
      </button>
    </div>
  );
}
