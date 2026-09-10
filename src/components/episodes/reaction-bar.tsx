"use client";

import { useState, useCallback } from "react";
import { useSSE } from "@/lib/sse/use-sse";
import { ConnectionDot } from "@/components/sse/connection-dot";

interface ReactionBarProps {
  slug: string;
  initialCounts: {
    fire: number;
    eye: number;
    moon: number;
    skull: number;
    wildcard: number;
    userReactions: string[];
  };
  isAuthenticated: boolean;
}

const REACTIONS = [
  { type: "fire", emoji: "\uD83D\uDD25", label: "This was heat" },
  { type: "eye", emoji: "\uD83D\uDC41\uFE0F", label: "Eye-opening" },
  { type: "moon", emoji: "\uD83C\uDF19", label: "Mystical" },
  { type: "skull", emoji: "\uD83D\uDC80", label: "Dead/hilarious" },
  { type: "wildcard", emoji: "\uD83C\uDCCF", label: "Chaotic" },
] as const;

export function ReactionBar({
  slug,
  initialCounts,
  isAuthenticated,
}: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [pending, setPending] = useState<string | null>(null);

  const { status } = useSSE({
    url: `/api/sse/episodes/${slug}`,
    onMessage: (event) => {
      if (event.type === "reaction-update" && event.data) {
        const updated = event.data as typeof counts;
        setCounts((prev) => ({ ...prev, ...updated }));
      }
    },
  });

  const handleReaction = useCallback(
    async (type: string) => {
      if (!isAuthenticated) {
        window.location.href = "/auth/signin";
        return;
      }
      if (pending) return;

      setPending(type);

      const wasActive = counts.userReactions.includes(type);
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] as number) + (wasActive ? -1 : 1),
        userReactions: wasActive
          ? prev.userReactions.filter((r) => r !== type)
          : [...prev.userReactions, type],
      }));

      try {
        const res = await fetch(`/api/episodes/${slug}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type as keyof typeof prev] as number) + (wasActive ? 1 : -1),
          userReactions: wasActive
            ? [...prev.userReactions, type]
            : prev.userReactions.filter((r) => r !== type),
        }));
      } finally {
        setPending(null);
      }
    },
    [slug, counts, pending, isAuthenticated],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type as keyof typeof counts] as number;
        const isActive = counts.userReactions.includes(type);

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={pending !== null}
            title={isAuthenticated ? label : "Sign in to react"}
            aria-label={isAuthenticated ? `${label} reaction` : "Sign in to react"}
            aria-pressed={isActive}
            className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-all ${
              isActive
                ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold-text"
                : "border-border bg-surface text-text-muted hover:border-accent-gold/30 hover:text-text-primary"
            } ${pending === type ? "opacity-50" : ""}`}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
      <ConnectionDot status={status} />
    </div>
  );
}
