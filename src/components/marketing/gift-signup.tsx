"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GiftSignupProps {
  source?: string;
  className?: string;
}

/**
 * GiftSignup — lead magnet. Captures name + email in exchange for the free
 * "Gospel of Psyche's Nightmares" PDF, enrolling the visitor as a free Initiate.
 * Posts to /api/initiate, then routes to the confirmation/download page.
 */
export function GiftSignup({ source = "gift:gospel", className = "" }: GiftSignupProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "success") return;
    if (!name.trim() || !email.trim()) {
      setStatus("error");
      setMessage("Enter your name and email to receive the Gospel.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("success");
        router.push("/gift/gospel?welcome=1");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  const busy = status === "loading" || status === "success";

  return (
    <div
      className={`relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-accent-gold/25 bg-gradient-to-b from-accent-violet/10 via-void/60 to-void px-6 py-7 text-center shadow-xl shadow-accent-violet/10 sm:px-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-16 h-40"
        style={{ background: "radial-gradient(ellipse 55% 100% at 50% 0%, rgba(169,74,74,0.20) 0%, transparent 70%)" }}
      />

      <p className="relative font-mono text-[10px] uppercase tracking-[0.45em] text-accent-gold-text/70">
        ✦ &nbsp;A free transmission&nbsp; ✦
      </p>
      <h2 className="relative mt-2 font-display text-2xl font-bold text-white sm:text-3xl" style={{ textShadow: "0 0 40px rgba(74, 45, 110,0.35)" }}>
        The Gospel of Psyche&rsquo;s Nightmares
      </h2>
      <p className="relative mx-auto mt-2 max-w-md font-serif text-sm italic leading-relaxed text-text-muted">
        A dark scripture from the edge of the archive — yours free. Enter as an{" "}
        <span className="text-accent-gold-text">Initiate</span> and the Gospel is delivered to your inbox instantly.
      </p>

      <form onSubmit={handleSubmit} className="relative mx-auto mt-5 flex max-w-md flex-col gap-2.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
          disabled={busy}
          className="rounded-lg border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
            disabled={busy}
            className="flex-1 rounded-lg border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-accent-gold bg-accent-gold/20 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/30 disabled:opacity-50 whitespace-nowrap"
          >
            {status === "loading" ? "…" : status === "success" ? "✓ Entering…" : "Claim the Gospel →"}
          </button>
        </div>
      </form>
      <p className="relative mt-2.5 font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
        Free forever · No card · Unsubscribe anytime
      </p>
      {status === "error" && message && (
        <p className="relative mt-2 font-mono text-xs text-red-400">{message}</p>
      )}
    </div>
  );
}
