"use client";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  startSeconds?: number;
}

export function YouTubeEmbed({ videoId, title, startSeconds }: YouTubeEmbedProps) {
  const src = `https://www.youtube-nocookie.com/embed/${videoId}${startSeconds ? `?start=${startSeconds}` : ""}`;

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-accent-gold/20 bg-void aspect-video">
      <iframe
        src={src}
        title={title || "YouTube video"}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}
