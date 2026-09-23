"use client";

import { useRef, useState } from "react";

const PLAYLIST_SIZE = 25;

interface YouTubePlayerProps {
  videoId: string;
  playlistId: string;
  title?: string;
}

/**
 * Click-to-load YouTube embed.
 *
 * Nothing is requested from Google until the visitor presses play. The old
 * version mounted an autoplaying `youtube.com/embed` iframe on first paint,
 * which contacted Google before the consent banner had been answered and
 * without YouTube appearing in the privacy policy's processor list
 * (2026-08 audit). Playback uses `youtube-nocookie.com`, YouTube's documented
 * privacy-enhanced mode.
 */
export function YouTubePlayer({ videoId, playlistId, title = "Play" }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [startIndex] = useState(() => Math.floor(Math.random() * PLAYLIST_SIZE));

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?list=${playlistId}&index=${startIndex}&autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1`;

  function unmute() {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(
        JSON.stringify({ event: "command", func: "unMute", args: [] }),
        "https://www.youtube-nocookie.com"
      );
      win.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [100] }),
        "https://www.youtube-nocookie.com"
      );
    }
    setMuted(false);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
      {started ? (
        <>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
          {muted && (
            <button
              type="button"
              onClick={unmute}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-accent-gold px-4 py-2.5 font-mono text-sm font-bold text-void shadow-xl hover:bg-accent-gold/90 transition-colors"
            >
              <span aria-hidden="true">🔇</span>
              <span>UNMUTE</span>
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 border border-border bg-elevated transition-colors hover:bg-surface"
        >
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-gold/60 bg-accent-gold/10 text-2xl text-accent-gold"
          >
            ▶
          </span>
          <span className="font-mono text-sm font-bold text-text-primary">{title}</span>
          <span className="max-w-xs px-4 text-center font-mono text-[12px] leading-relaxed text-text-muted">
            Loads from YouTube (youtube-nocookie.com) when you press play.
          </span>
        </button>
      )}
    </div>
  );
}
