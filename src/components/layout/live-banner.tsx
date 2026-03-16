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
      className="relative z-[60] flex items-center justify-center gap-2 bg-gradient-to-r from-surface via-elevated to-surface border-b border-accent-gold/30 px-4 py-2 transition-colors hover:from-elevated hover:via-elevated hover:to-elevated"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="font-mono text-xs font-bold tracking-wider text-accent-gold">
        LIVE NOW
      </span>
      <span className="hidden sm:inline font-mono text-xs text-accent-cyan">
        — {status.title ?? "Watch the stream"} →
      </span>
      <span className="sm:hidden font-mono text-xs text-accent-cyan">→</span>
    </Link>
  );
}
