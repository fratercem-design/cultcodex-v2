"use client";

import { useState, useTransition } from "react";

interface SaveSignalButtonProps {
  /** Topic slug — used as the API path key. */
  slug: string;
  initialSaved: boolean;
  /** Total users who have saved this signal (optional; hidden when 0). */
  initialCount?: number;
  isAuthenticated: boolean;
  size?: "sm" | "md";
}

/**
 * SaveSignalButton — the save/pin affordance for a /topics entry.
 *
 * Signed-out users bounce to /auth/signin with a return URL.
 * Signed-in users POST to /api/codex/topics/[slug]/save, which toggles
 * the row in SavedTopic. Uses an optimistic update with a revert-on-error
 * fallback, mirroring the existing FavoriteButton pattern.
 */
export function SaveSignalButton({
  slug,
  initialSaved,
  initialCount = 0,
  isAuthenticated,
  size = "md",
}: SaveSignalButtonProps) {
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

    // Optimistic
    setSaved((prev) => !prev);
    setCount((prev) => (saved ? prev - 1 : prev + 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/codex/topics/${slug}/save`, {
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
          ? "text-accent-cyan hover:text-accent-cyan/80"
          : "text-text-muted hover:text-accent-cyan"
      } ${isPending ? "opacity-50" : ""}`}
      title={saved ? "Remove from your codex" : "Save to your codex"}
      aria-label={saved ? "Remove signal from your codex" : "Save signal to your codex"}
    >
      <span className={isSm ? "text-xs" : "text-sm"} aria-hidden="true">
        {saved ? "\u25C6" : "\u25C7"}
      </span>
      {count > 0 && (
        <span className={`font-mono ${isSm ? "text-[12px]" : "text-[12px]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
