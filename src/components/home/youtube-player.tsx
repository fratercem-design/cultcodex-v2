"use client";

import { useRef, useState } from "react";

const PLAYLIST_SIZE = 25;

interface YouTubePlayerProps {
  videoId: string;
  playlistId: string;
  title?: string;
}

export function YouTubePlayer({ videoId, playlistId, title = "Play" }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const [startIndex] = useState(() => Math.floor(Math.random() * PLAYLIST_SIZE));

  const embedUrl = `https://www.youtube.com/embed/${videoId}?list=${playlistId}&index=${startIndex}&autoplay=1&mute=1&enablejsapi=1&rel=0&modestbranding=1`;

  function unmute() {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "https://www.youtube.com");
      win.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "https://www.youtube.com");
    }
    setMuted(false);
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
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
          onClick={unmute}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-accent-gold px-4 py-2.5 font-mono text-sm font-bold text-void shadow-xl hover:bg-accent-gold/90 transition-colors"
        >
          <span>🔇</span>
          <span>UNMUTE</span>
        </button>
      )}
    </div>
  );
}
