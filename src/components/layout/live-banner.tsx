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
      className="relative z-[60] flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a0033] via-[#2d0050] to-[#1a0033] border-b border-[#ffd700]/30 px-4 py-2 transition-colors hover:from-[#2d0050] hover:via-[#3d0070] hover:to-[#2d0050]"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="font-mono text-xs font-bold tracking-wider text-[#ffd700]">
        LIVE NOW
      </span>
      <span className="hidden sm:inline font-mono text-xs text-[#00d9ff]">
        — {status.title ?? "Watch the stream"} →
      </span>
      <span className="sm:hidden font-mono text-xs text-[#00d9ff]">→</span>
    </Link>
  );
}
