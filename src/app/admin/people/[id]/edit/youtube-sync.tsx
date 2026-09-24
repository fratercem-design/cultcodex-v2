"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface Props {
  personId: string;
  initialChannelUrl: string | null;
  initialAvatarUrl: string | null;
}

export function YouTubeSync({ personId, initialChannelUrl, initialAvatarUrl }: Props) {
  const [channelUrl, setChannelUrl] = useState(initialChannelUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState(initialAvatarUrl ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSync() {
    const url = channelUrl.trim();
    if (!url) {
      setStatus("error");
      setMessage("Paste a YouTube channel URL or @handle first.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/people/${personId}/sync-youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelUrl: url }),
      });

      const data = await res.json() as {
        ok?: boolean;
        error?: string;
        channelTitle?: string;
        avatarUrl?: string;
        youtubeChannelUrl?: string;
      };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Sync failed.");
        return;
      }

      setAvatarPreview(data.avatarUrl ?? "");
      setChannelUrl(data.youtubeChannelUrl ?? url);
      setStatus("ok");
      setMessage(`Synced from "${data.channelTitle}"`);
    } catch {
      setStatus("error");
      setMessage("Network error — try again.");
    }
  }

  return (
    <div className="rounded-lg border border-red-900/40 bg-red-950/10 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm">▶</span>
        <p className="font-mono text-xs font-bold text-red-400 uppercase tracking-widest">YouTube Channel</p>
      </div>

      {/* URL input + sync button */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="url"
          value={channelUrl}
          onChange={(e) => { setChannelUrl(e.target.value); setStatus("idle"); }}
          placeholder="https://www.youtube.com/@handle  or  @handle"
          className="flex-1 rounded border border-border bg-void px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-red-500/50 focus:outline-none"
          // Also surfaces value to the enclosing <form> so the server action saves it
          name="youtubeChannelUrl"
        />
        <button
          type="button"
          onClick={handleSync}
          disabled={status === "loading"}
          className="rounded border border-red-800/60 bg-red-900/20 px-3 py-1.5 font-mono text-[12px] font-bold text-red-400 uppercase tracking-widest hover:bg-red-900/40 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          {status === "loading" ? "Syncing…" : "Sync Avatar"}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <p className={`font-mono text-[12px] ${status === "error" ? "text-red-400" : "text-green-400"}`}>
          {status === "ok" ? "✓ " : "✗ "}{message}
        </p>
      )}

      {/* Avatar preview */}
      {avatarPreview && (
        <div className="flex items-center gap-3">
          <Image
            src={avatarPreview}
            alt="Channel avatar"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover border border-red-800/40"
            unoptimized
          />
          <div>
            <p className="font-mono text-[12px] text-text-muted">Avatar preview</p>
            <p className="font-mono text-[12px] text-text-muted truncate max-w-xs">{avatarPreview}</p>
          </div>
        </div>
      )}

      <p className="font-mono text-[12px] text-text-muted">
        Sync pulls the channel profile picture from the YouTube Data API and saves it as this person&apos;s avatar.
        The channel URL is also stored and shown as a link on the public voice page.
      </p>
    </div>
  );
}
