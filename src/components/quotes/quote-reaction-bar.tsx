"use client";

import { useState, useCallback } from "react";

export interface QuoteReactionInitial {
  fire: number;
  eye: number;
  moon: number;
  skull: number;
  wildcard: number;
  userReactions: string[];
}

interface Props {
  quoteId: string;
  initial: QuoteReactionInitial;
  isAuthenticated: boolean;
  /** Compact (default) hides labels and only shows non-zero counts. */
  variant?: "compact" | "full";
}

const REACTIONS = [
  { type: "fire",     emoji: "🔥", label: "Heat" },
  { type: "eye",      emoji: "👁️", label: "Eye-opening" },
  { type: "moon",     emoji: "🌙", label: "Mystical" },
  { type: "skull",    emoji: "💀", label: "Dead" },
  { type: "wildcard", emoji: "🃏", label: "Wild" },
] as const;

type ReactionKey = (typeof REACTIONS)[number]["type"];

export function QuoteReactionBar({
  quoteId,
  initial,
  isAuthenticated,
  variant = "compact",
}: Props) {
  const [counts, setCounts] = useState<QuoteReactionInitial>(initial);
  const [pending, setPending] = useState<string | null>(null);

  const handle = useCallback(
    async (type: ReactionKey) => {
      if (!isAuthenticated) {
        window.location.href = "/auth/signin";
        return;
      }
      if (pending) return;
      setPending(type);

      const wasActive = counts.userReactions.includes(type);
      // optimistic update
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type] as number) + (wasActive ? -1 : 1),
        userReactions: wasActive
          ? prev.userReactions.filter((r) => r !== type)
          : [...prev.userReactions, type],
      }));

      try {
        const res = await fetch(`/api/quotes/${quoteId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (res.ok) {
          const data = (await res.json()) as QuoteReactionInitial;
          setCounts(data);
        } else {
          throw new Error("toggle failed");
        }
      } catch {
        // rollback
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type] as number) + (wasActive ? 1 : -1),
          userReactions: wasActive
            ? [...prev.userReactions, type]
            : prev.userReactions.filter((r) => r !== type),
        }));
      } finally {
        setPending(null);
      }
    },
    [counts, pending, quoteId, isAuthenticated]
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type];
        const isActive = counts.userReactions.includes(type);
        const showCount = count > 0;
        const showInCompact = variant === "full" || isActive || showCount;
        if (variant === "compact" && !showInCompact && !isAuthenticated) {
          // In compact mode for anonymous users, only show non-zero reactions
          return null;
        }

        return (
          <button
            key={type}
            type="button"
            onClick={() => handle(type)}
            disabled={pending !== null}
            title={isAuthenticated ? label : `Sign in to react · ${label}`}
            className={`group inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] transition-all ${
              isActive
                ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold-text"
                : "border-border bg-surface/60 text-text-muted hover:border-accent-gold/30 hover:text-text-primary"
            } ${pending === type ? "opacity-50" : ""}`}
          >
            <span className="text-[11px] leading-none">{emoji}</span>
            {showCount && <span className="tabular-nums">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
