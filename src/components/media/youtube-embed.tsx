"use client";

import { useState } from "react";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
}

export function YouTubeEmbed({ videoId, title, startSeconds }: YouTubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
  if (startSeconds) params.set("start", String(Math.max(0, Math.floor(startSeconds))));

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-accent-gold/20 bg-void aspect-video">
      {loaded ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params}`}
          title={title || "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface to-void px-6 text-center hover:bg-elevated"
          aria-label={`Play ${title || "YouTube video"}`}
        >
          <span className="text-4xl text-accent-gold-text" aria-hidden="true">▶</span>
          <span className="font-mono text-xs text-text-primary">{title || "Play video"}</span>
          <span className="font-mono text-[10px] text-text-muted">
            Loads from YouTube (youtube-nocookie.com) when you press play.
          </span>
        </button>
      )}
    </div>
  );
}
