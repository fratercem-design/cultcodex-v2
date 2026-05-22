"use client";

import { useState } from "react";
import Image from "next/image";

interface YouTubePlayerProps {
  videoId: string;
  playlistId: string;
  title?: string;
}

export function YouTubePlayer({ videoId, playlistId, title = "Play" }: YouTubePlayerProps) {
  const [active, setActive] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?list=${playlistId}&autoplay=1&rel=0&modestbranding=1`;

  if (active) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setActive(true)}
      className="group relative w-full overflow-hidden rounded-xl bg-void border border-border hover:border-accent-gold/40 transition-colors"
      style={{ paddingBottom: "56.25%" }}
      aria-label={`Play ${title}`}
    >
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
        className="object-cover opacity-60 group-hover:opacity-75 transition-opacity"
      />
      {/* dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-transparent to-transparent" />
      {/* play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-gold/90 shadow-xl shadow-accent-gold/30 group-hover:bg-accent-gold transition-colors group-hover:scale-110 transform duration-150">
          <svg className="h-7 w-7 text-void ml-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
