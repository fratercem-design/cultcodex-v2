"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ChannelStatus {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
}

interface AllLiveStatus {
  cultOfPsyche: ChannelStatus;
  alexandraMayers: ChannelStatus;
  nightmareFrequencies: ChannelStatus;
}

const EMPTY: AllLiveStatus = {
  cultOfPsyche: { isLive: false, videoId: null, title: null },
  alexandraMayers: { isLive: false, videoId: null, title: null },
  nightmareFrequencies: { isLive: false, videoId: null, title: null },
};

interface BannerEntry {
  key: string;
  label: string;
  title: string | null;
  href: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  dotColor: string;
}

export function LiveBanner() {
  const [status, setStatus] = useState<AllLiveStatus>(EMPTY);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        const data = await res.json() as AllLiveStatus;
        setStatus(data);
      } catch {
        // banner just won't show on error
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  const entries: BannerEntry[] = [];

  const cultLive = status.cultOfPsyche.isLive || status.nightmareFrequencies.isLive;
  const cultTitle = status.cultOfPsyche.isLive
    ? status.cultOfPsyche.title
    : status.nightmareFrequencies.title;

  if (cultLive) {
    entries.push({
      key: "cultOfPsyche",
      label: "CULT OF PSYCHE",
      title: cultTitle,
      href: "/cult-live",
      accentBg: "bg-red-950/70",
      accentBorder: "border-red-500/30",
      accentText: "text-red-300",
      dotColor: "bg-red-400",
    });
  }

  if (status.alexandraMayers.isLive) {
    entries.push({
      key: "alexandraMayers",
      label: "ALEXANDRA MAYERS",
      title: status.alexandraMayers.title,
      href: "/irl-newstime",
      accentBg: "bg-violet-950/70",
      accentBorder: "border-violet-500/30",
      accentText: "text-violet-300",
      dotColor: "bg-violet-400",
    });
  }

  const visible = entries.filter((e) => !dismissed.has(e.key));
  if (visible.length === 0) return null;

  return (
    <div className="relative z-[60]">
      {visible.map((entry) => (
        <div
          key={entry.key}
          className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${entry.accentBg} ${entry.accentBorder} backdrop-blur-sm`}
        >
          <Link
            href={entry.href}
            className="flex flex-1 items-center justify-center gap-3 min-w-0"
          >
            {/* Pulsing dot */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${entry.dotColor} opacity-75`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${entry.dotColor}`} />
            </span>

            <span className={`font-mono text-xs font-bold tracking-[0.18em] uppercase ${entry.accentText}`}>
              {entry.label} — LIVE NOW
            </span>

            {entry.title && (
              <span className="hidden sm:inline font-mono text-xs text-white/50 truncate max-w-sm">
                {entry.title}
              </span>
            )}

            <span className={`font-mono text-xs ${entry.accentText} opacity-70`}>→</span>
          </Link>

          {/* Dismiss */}
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setDismissed((prev) => new Set([...prev, entry.key]))}
            className="flex-shrink-0 rounded p-1 text-white/30 hover:text-white/70 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
