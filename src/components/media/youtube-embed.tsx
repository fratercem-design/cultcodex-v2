"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          host?: string;
          playerVars?: Record<string, unknown>;
          events?: { onError?: (e: { data: number }) => void };
        }
      ) => { destroy(): void };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
}

const UNAVAILABLE_ERRORS = new Set([100, 101, 150]);
let apiReadyPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiReadyPromise;
}

export function YouTubeEmbed({ videoId, title, startSeconds }: YouTubeEmbedProps) {
  const [consented, setConsented] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!consented) return;
    let cancelled = false;
    let player: { destroy(): void } | null = null;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          ...(startSeconds ? { start: Math.max(0, Math.floor(startSeconds)) } : {}),
        },
        events: {
          onError(event) {
            if (!UNAVAILABLE_ERRORS.has(event.data)) return;
            setUnavailable(true);
            fetch("/api/episodes/report-unavailable", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoId }),
            }).catch(() => {});
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [consented, startSeconds, videoId]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-accent-gold/20 bg-void aspect-video">
      {unavailable ? (
        <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-xs text-text-muted">
          This source video is currently unavailable.
        </p>
      ) : consented ? (
        <div ref={containerRef} className="absolute inset-0 h-full w-full" aria-label={title || "YouTube video"} />
      ) : (
        <button
          type="button"
          onClick={() => setConsented(true)}
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface to-void px-6 text-center hover:bg-elevated"
          aria-label={`Play ${title || "YouTube video"}`}
        >
          <span className="text-4xl text-accent-gold-text" aria-hidden="true">▶</span>
          <span className="font-mono text-xs text-text-primary">{title || "Play video"}</span>
          <span className="font-mono text-[12px] text-text-muted">
            Loads from YouTube when you press play.
          </span>
        </button>
      )}
    </div>
  );
}
