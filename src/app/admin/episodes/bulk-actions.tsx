"use client";

import { useTransition } from "react";
import { bulkUpdateEpisodeStatus } from "@/app/admin/actions";
import type { ContentStatus } from "@/generated/prisma/client";

interface Props {
  episodeIds: string[];
}

export function EpisodeBulkActions({ episodeIds }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleBulk = (status: ContentStatus) => {
    if (!confirm(`Set ${episodeIds.length} episodes to "${status}"?`)) return;
    startTransition(async () => {
      await bulkUpdateEpisodeStatus(episodeIds, status);
    });
  };

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-[10px] text-text-muted">
        Bulk actions (this page):
      </span>
      {(["published", "draft", "archived"] as ContentStatus[]).map((s) => (
        <button
          key={s}
          onClick={() => handleBulk(s)}
          disabled={isPending}
          className="rounded border border-border px-2 py-1 font-mono text-[10px] text-text-muted hover:border-accent-green/30 hover:text-text-primary transition-colors disabled:opacity-50"
        >
          Set {s}
        </button>
      ))}
    </div>
  );
}
