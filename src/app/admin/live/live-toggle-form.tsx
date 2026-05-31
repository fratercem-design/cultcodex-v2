"use client";

import { useState, useTransition } from "react";
import { toggleLiveStream, toggleAlexandraLive } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface Props {
  channel: "cultOfPsyche" | "alexandraMayers";
  isLive: boolean;
  currentVideoId?: string | null;
  currentTitle?: string | null;
}

export function LiveToggleForm({ channel, isLive, currentVideoId, currentTitle }: Props) {
  const defaultTitle = channel === "cultOfPsyche" ? "Cult of Psyche Live Stream" : "Alexandra Mayers Live";
  const [videoId, setVideoId] = useState(currentVideoId ?? "");
  const [title, setTitle] = useState(currentTitle ?? defaultTitle);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    const action = isLive ? "go offline" : "go live";
    if (!confirm(`Are you sure you want to ${action}?`)) return;

    const formData = new FormData();
    if (!isLive) {
      formData.set("videoId", videoId);
      formData.set("title", title);
    }

    startTransition(async () => {
      if (channel === "cultOfPsyche") {
        await toggleLiveStream(formData);
      } else {
        await toggleAlexandraLive(formData);
      }
      router.refresh();
    });
  };

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      {!isLive && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block font-mono text-[10px] text-text-muted uppercase mb-1">
              YouTube Video ID
            </label>
            <input
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="e.g. dQw4w9WgXcQ"
              className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-text-muted uppercase mb-1">
              Stream Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Stream title"
              className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
            />
          </div>
        </div>
      )}

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`w-full rounded px-6 py-3 font-mono text-sm font-bold transition-colors disabled:opacity-50 ${
          isLive
            ? "bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30"
            : "bg-accent-gold text-void hover:bg-accent-gold/80"
        }`}
      >
        {isPending
          ? "Processing..."
          : isLive
            ? "GO OFFLINE"
            : "GO LIVE"}
      </button>
    </div>
  );
}
