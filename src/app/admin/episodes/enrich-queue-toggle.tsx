"use client";

import { useTransition } from "react";
import { toggleEnrichmentQueued } from "@/app/admin/actions";

interface Props {
  episodeId: string;
  queued: boolean;
}

export function EnrichQueueToggle({ episodeId, queued }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => toggleEnrichmentQueued(episodeId))
      }
      disabled={isPending}
      title={queued ? "Remove from enrichment queue" : "Queue for enrichment"}
      className={`rounded border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-wider transition-colors disabled:opacity-40 ${
        queued
          ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold-text hover:bg-accent-gold/20"
          : "border-border text-text-muted hover:border-accent-gold/30 hover:text-text-primary"
      }`}
    >
      {queued ? "⚡ queued" : "+ enrich"}
    </button>
  );
}
