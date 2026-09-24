"use client";

import { useState, useTransition } from "react";

interface SaveQuoteButtonProps {
  /** Quote id — used as the API path key. */
  quoteId: string;
  initialSaved: boolean;
  initialCount?: number;
  isAuthenticated: boolean;
  size?: "sm" | "md";
}

/**
 * SaveQuoteButton — the save affordance for a /quotes entry.
 *
 * Signed-out users bounce to /auth/signin with a return URL.
 * Signed-in users POST to /api/codex/quotes/[id]/save, which toggles
 * the row in SavedQuote. Uses an optimistic update with revert-on-error.
 */
export function SaveQuoteButton({
  quoteId,
  initialSaved,
  initialCount = 0,
  isAuthenticated,
  size = "md",
}: SaveQuoteButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) {
      const here = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/codex"
      );
      window.location.href = `/auth/signin?callbackUrl=${here}`;
      return;
    }

    setSaved((prev) => !prev);
    setCount((prev) => (saved ? prev - 1 : prev + 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/codex/quotes/${quoteId}/save`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setSaved(data.saved);
          setCount(data.count);
        } else {
          setSaved((prev) => !prev);
          setCount((prev) => (saved ? prev + 1 : prev - 1));
        }
      } catch {
        setSaved((prev) => !prev);
        setCount((prev) => (saved ? prev + 1 : prev - 1));
      }
    });
  }

  const isSm = size === "sm";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      disabled={isPending}
      className={`group inline-flex items-center gap-1 rounded transition-colors ${
        isSm ? "px-1.5 py-0.5" : "px-2 py-1"
      } ${
        saved
          ? "text-accent-gold-text hover:text-accent-gold-text/80"
          : "text-text-muted hover:text-accent-gold-text"
      } ${isPending ? "opacity-50" : ""}`}
      title={saved ? "Remove from your codex" : "Save to your codex"}
      aria-label={saved ? "Remove quote from your codex" : "Save quote to your codex"}
    >
      <span className={isSm ? "text-xs" : "text-sm"} aria-hidden="true">
        {saved ? "\u2605" : "\u2606"}
      </span>
      {count > 0 && (
        <span className={`font-mono ${isSm ? "text-[12px]" : "text-[12px]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
