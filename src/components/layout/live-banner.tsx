"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LiveStatusData {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
}

export function LiveBanner() {
  const [status, setStatus] = useState<LiveStatusData | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        const data = await res.json();
        setStatus(data);
      } catch {
        // Silently fail — banner just won't show
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!status?.isLive) return null;

  return (
    <Link
      href="/live"
      className="relative z-[60] flex items-center justify-center gap-3 bg-amber-950/60 border-b border-amber-500/40 px-4 py-2 transition-colors hover:bg-amber-950/80"
    >
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
      </span>
      <span className="font-mono text-xs font-bold tracking-[0.2em] text-amber-300 uppercase">
        Currently Live
      </span>
      <span className="hidden sm:inline font-mono text-xs text-amber-200/70">
        — {status.title ?? "Watch the stream"}
      </span>
      <span className="font-mono text-xs text-amber-400 ml-1">→</span>
    </Link>
  );
}
