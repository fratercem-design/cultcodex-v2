"use client";

interface LivePlayerProps {
  videoId: string;
}

export function LivePlayer({ videoId }: LivePlayerProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      {/* Video */}
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#ffd700]/20">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Chat */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-2">
          <p className="font-mono text-xs font-bold text-[#ffd700]">
            LIVE CHAT
          </p>
        </div>
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <iframe
            src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "cultcodex.me"}&dark_theme=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}
