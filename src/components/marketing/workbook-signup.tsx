"use client";

import { useState } from "react";
import Link from "next/link";

interface WorkbookSignupProps {
  /** Where the lead was captured (e.g. a persona's utm_campaign). Stored on the Subscriber row. */
  source?: string;
  className?: string;
}

type Status = "idle" | "loading" | "sent" | "error";

/**
 * WorkbookSignup — the email form for /initiation.
 *
 * Posts to /api/workbook, which emails a signed link to the PDF. The PDF is
 * never handed over on this page: opening the emailed link is what proves the
 * address and confirms it on the list.
 */
export function WorkbookSignup({ source, className = "" }: WorkbookSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "sent") return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Persona bio links carry utm_campaign; keep it so leads can be credited.
        body: JSON.stringify({
          email: email.trim(),
          source: source ?? new URLSearchParams(window.location.search).get("utm_campaign") ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "sent") {
    return (
      <div
        className={`rounded-lg border border-accent-gold/30 bg-surface p-6 sm:p-8 ${className}`}
        role="status"
        aria-live="polite"
      >
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
          {"// "}check your inbox
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-text-primary">
          Your workbook is on its way, darling.
        </h2>
        <p className="mt-3 font-mono text-xs leading-relaxed text-text-muted">
          We sent a download link to <span className="text-text-primary">{email}</span>. It can take
          a minute. Look in spam or promotions if it doesn&rsquo;t show up.
        </p>
        <p className="mt-4 font-mono text-xs leading-relaxed text-text-muted">
          While you wait, Day 1 starts with the{" "}
          <Link href="/archetype-quiz" className="text-accent-gold-text underline underline-offset-2">
            archetype quiz
          </Link>
          .
        </p>
      </div>
    );
  }

  const busy = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg border border-accent-gold/25 bg-surface p-6 sm:p-8 ${className}`}
    >
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
        {"// "}free · 44-page PDF
      </p>
      <h2 className="mt-3 font-display text-2xl font-bold text-text-primary">Get the workbook</h2>
      <p className="mt-3 font-mono text-xs leading-relaxed text-text-muted">
        We&rsquo;ll email you a download link. Print it, or fill it in on a tablet.
      </p>

      <label className="mt-5 block">
        <span className="mb-1.5 block font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          Where to send it
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          required
          disabled={busy}
          className="w-full rounded border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/25 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send me the workbook"}
      </button>

      {message && (
        <p className="mt-3 font-mono text-xs text-red-400" role="alert">
          {message}
        </p>
      )}

      <p className="mt-5 border-t border-border pt-4 font-mono text-[12px] leading-relaxed text-text-muted/80">
        You&rsquo;ll also get occasional CultCodex updates. We don&rsquo;t sell the list, and one click
        in any email removes you. See the{" "}
        <Link href="/privacy" className="text-accent-cyan/80 underline underline-offset-2 hover:text-accent-cyan">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}
