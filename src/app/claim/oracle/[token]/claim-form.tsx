"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUGGESTIONS = [
  "Neon Priestess",
  "Voice of Saturn",
  "The Seventh Seal",
  "Warden of the Archive",
  "The Illuminated",
  "Daughter of Capricorn",
  "The Unbroken",
  "Keeper of Flame",
];

interface ClaimFormProps {
  token: string;
  recipientName: string;
}

export function ClaimForm({ token, recipientName }: ClaimFormProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setStatus("submitting");

    const res = await fetch("/api/claim/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, memberTitle: title.trim() }),
    });

    if (res.ok) {
      setStatus("done");
      setTimeout(() => router.push("/"), 3000);
    } else {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setErrorMsg(data.error ?? "Something went wrong. The archive is listening.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center space-y-6 animate-pulse-slow">
        <div className="text-5xl text-accent-gold">✦</div>
        <div className="font-mono text-xs uppercase tracking-[0.4em] text-accent-gold-text/80">
          Sealed
        </div>
        <h2 className="font-serif text-3xl text-white">{title}</h2>
        <p className="text-sm text-text-muted font-mono">
          Your name is written into the archive. Entering the Codex…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleClaim} className="w-full max-w-md mx-auto space-y-8">
      {/* Name input */}
      <div className="space-y-3">
        <label
          htmlFor="oracle-title"
          className="block font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold-text/80"
        >
          Your name in the archive
        </label>
        <input
          id="oracle-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={40}
          placeholder="Speak your name…"
          disabled={status === "submitting"}
          autoFocus
          className="w-full bg-transparent border border-accent-gold/30 rounded-lg px-4 py-3 font-serif text-xl text-white placeholder:text-text-muted/60 focus:outline-none focus:border-accent-gold/70 focus:ring-1 focus:ring-accent-gold/30 transition-all"
        />
        <p className="text-[10px] font-mono text-text-muted">
          This will appear on your profile and in the Hall of Founding Oracles.
        </p>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
          Or choose from the whispers…
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTitle(s)}
              className="px-3 py-1.5 rounded-full border border-accent-gold/20 text-xs font-mono text-text-muted hover:border-accent-gold/50 hover:text-accent-gold-text transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="text-xs font-mono text-red-400/80 text-center">{errorMsg}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!title.trim() || status === "submitting"}
        className="w-full py-4 rounded-lg border border-accent-gold/60 bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold-text font-mono text-sm uppercase tracking-[0.3em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Sealing…" : "Seal My Name"}
      </button>

      <p className="text-center text-[10px] font-mono text-text-muted/60">
        You may change this at any time from your profile settings.
      </p>
    </form>
  );
}
