"use client";

import { useState } from "react";

interface TranscriptNotifyProps {
  episodeSlug: string;
}

export function TranscriptNotify({ episodeSlug }: TranscriptNotifyProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading" || status === "success") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/episodes/${episodeSlug}/notify-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("We'll notify you when the transcript drops.");
        setEmail("");
      } else if (res.status === 409) {
        setStatus("success");
        setMessage("You're already on the list for this episode.");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
        {"/// notify_when_ready"}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading" || status === "success"}
          className="flex-1 rounded-lg border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="rounded-lg border border-accent-gold bg-accent-gold/15 px-4 py-2 font-mono text-xs font-bold text-accent-gold transition hover:bg-accent-gold/25 disabled:opacity-50 whitespace-nowrap"
        >
          {status === "loading" ? "…" : status === "success" ? "✓ Noted" : "Notify me"}
        </button>
      </form>
      {message && (
        <p className={`font-mono text-[11px] ${status === "success" ? "text-accent-gold" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
