"use client";

import { useEffect, useRef, useState } from "react";

// Minimal types for the YouTube IFrame API
declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: { onError?: (e: { data: number }) => void };
        }
      ) => { destroy(): void };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

// Shared promise so multiple embeds on one page only load the script once
let apiReadyPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (typeof window === "undefined") return;
    if (window.YT?.Player) { resolve(); return; }

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return apiReadyPromise;
}

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
}

// Error codes that mean the video is gone / not embeddable
const UNAVAILABLE_ERRORS = new Set([100, 101, 150]);

export function YouTubeEmbed({ videoId, title, startSeconds }: YouTubeEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ destroy(): void } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeAPI().then(() => {
      if (cancelled || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: startSeconds ? { start: startSeconds } : {},
        events: {
          onError(e) {
            if (UNAVAILABLE_ERRORS.has(e.data)) {
              setUnavailable(true);
              // Report telemetry only. Public player callbacks must not mutate
              // the episode's canonical archive status.
              fetch("/api/episodes/report-unavailable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId }),
              }).catch(() => {});
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, startSeconds]);

  if (unavailable) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-accent-gold/20 bg-void aspect-video">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label={title || "YouTube video"} />
    </div>
  );
}
