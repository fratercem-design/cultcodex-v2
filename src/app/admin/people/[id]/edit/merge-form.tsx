"use client";

import { useState, useTransition } from "react";
import { mergePeople } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface Props {
  sourceId: string;
  sourceName: string;
}

export function MergePersonForm({ sourceId, sourceName }: Props) {
  const [targetSlug, setTargetSlug] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMerge = () => {
    if (!targetSlug.trim()) return;
    if (
      !confirm(
        `Merge "${sourceName}" into person with slug "${targetSlug}"? This cannot be undone.`,
      )
    )
      return;

    startTransition(async () => {
      // Look up target by slug first
      const res = await fetch(`/api/admin/people/lookup?slug=${encodeURIComponent(targetSlug)}`);
      if (!res.ok) {
        alert("Target person not found");
        return;
      }
      const { id: targetId } = await res.json();
      await mergePeople(sourceId, targetId);
      router.push("/admin/people");
    });
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block font-mono text-[10px] text-text-muted uppercase mb-1">
          Target person slug
        </label>
        <input
          value={targetSlug}
          onChange={(e) => setTargetSlug(e.target.value)}
          placeholder="e.g. alexandra-mayers"
          className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
        />
      </div>
      <button
        onClick={handleMerge}
        disabled={isPending || !targetSlug.trim()}
        className="rounded border border-red-400/30 bg-red-400/10 px-4 py-2 font-mono text-xs text-red-400 hover:bg-red-400/20 disabled:opacity-50"
      >
        {isPending ? "Merging..." : "Merge"}
      </button>
    </div>
  );
}
