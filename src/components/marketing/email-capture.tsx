"use client";

import { useState } from "react";

interface EmailCaptureProps {
  /** Eyebrow label above the heading. */
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  /** Where the lead was captured — stored for future segmentation context. */
  source?: string;
  className?: string;
}

/**
 * EmailCapture — lightweight lead-capture form that posts to /api/subscribe
 * (the existing Subscriber store). Used to build the email list on
 * high-intent surfaces (homepage, gated previews).
 */
export function EmailCapture({
  eyebrow = "/// signal_intercept",
  heading = "Get the decoded layer in your inbox each week.",
  subheading = "One transmission per week: the behavioral pattern that surfaced most, a recurring voice you've missed, and what the Oracle flagged — synthesized from the archive, not a recap.",
  source,
  className = "",
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === "loading" || status === "success") return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list. The archive will reach you.");
        setEmail("");
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
    <div
      className={`rounded-xl border border-accent-cyan/20 bg-gradient-to-b from-accent-cyan/5 to-surface px-6 py-8 text-center space-y-4 ${className}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
        {eyebrow}
      </p>
      <p className="font-display text-xl font-bold text-white">{heading}</p>
      <p className="mx-auto max-w-md font-mono text-xs text-text-muted">{subheading}</p>

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          disabled={status === "loading" || status === "success"}
          className="flex-1 rounded-lg border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-cyan/50 focus:outline-none focus:ring-1 focus:ring-accent-cyan/30 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="rounded-lg border border-accent-cyan bg-accent-cyan/10 px-6 py-3 font-mono text-sm font-bold text-accent-cyan transition hover:bg-accent-cyan/20 disabled:opacity-50"
        >
          {status === "loading" ? "…" : status === "success" ? "✓ Subscribed" : "Subscribe"}
        </button>
      </form>

      {message && (
        <p
          className={`font-mono text-xs ${status === "success" ? "text-accent-cyan" : "text-red-400"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
