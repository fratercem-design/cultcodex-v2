"use client";

import { useState, useTransition } from "react";

interface FavoriteButtonProps {
  slug: string;
  initialFavorited: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  size?: "sm" | "md";
}

export function FavoriteButton({
  slug,
  initialFavorited,
  initialCount,
  isAuthenticated,
  size = "md",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    if (!isAuthenticated) {
      window.location.href = "/auth/signin";
      return;
    }

    // Optimistic update
    setFavorited((prev) => !prev);
    setCount((prev) => (favorited ? prev - 1 : prev + 1));

    startTransition(async () => {
      try {
        const res = await fetch(`/api/episodes/${slug}/favorite`, {
          method: "POST",
        });
        if (res.ok) {
          const data = await res.json();
          setFavorited(data.favorited);
          setCount(data.count);
        } else {
          // Revert on error
          setFavorited((prev) => !prev);
          setCount((prev) => (favorited ? prev + 1 : prev - 1));
        }
      } catch {
        setFavorited((prev) => !prev);
        setCount((prev) => (favorited ? prev + 1 : prev - 1));
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
      className={`group flex items-center gap-1 rounded transition-colors ${
        isSm
          ? "px-1.5 py-0.5"
          : "px-2 py-1"
      } ${
        favorited
          ? "text-red-400 hover:text-red-300"
          : "text-text-muted hover:text-red-400"
      } ${isPending ? "opacity-50" : ""}`}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <span className={isSm ? "text-xs" : "text-sm"}>
        {favorited ? "\u2665" : "\u2661"}
      </span>
      {count > 0 && (
        <span className={`font-mono ${isSm ? "text-[9px]" : "text-[10px]"}`}>
          {count}
        </span>
      )}
    </button>
  );
}
