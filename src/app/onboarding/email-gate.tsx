"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * EmailGate — the first step of onboarding for anyone not signed in.
 *
 * Onboarding used to bounce straight to Google. That lost every visitor who
 * was not ready to hand over an account, and told us nothing about them. Now
 * the address comes first: the lead is captured and a Codex account is
 * provisioned immediately, so a person who stops here is still an Initiate we
 * can reach. Signing in afterwards claims that same account.
 */
export function EmailGate({ callbackUrl = "/onboarding" }: { callbackUrl?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "captured" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "captured") return;
    if (!name.trim() || !email.trim()) {
      setStatus("error");
      setMessage("A name and an email address are both required to begin.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), source: "gate:onboarding" }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setStatus("captured");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Could not open the gate. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "captured") {
    return (
      <div
        className="mx-auto mt-10 max-w-lg rounded-lg border border-accent-gold/30 bg-surface p-6 sm:p-8"
        role="status"
        aria-live="polite"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/70">
          {"// "}step 1 of 2 complete
        </p>
        <h2 className="mt-3 font-serif text-2xl font-black text-accent-gold">
          You are an Initiate.
        </h2>
        <p className="mt-4 font-mono text-xs leading-relaxed text-text-muted">
          Your account exists and is keyed to{" "}
          <span className="text-text-primary">{email}</span>. The Gospel is on its way there.
        </p>
        <p className="mt-3 font-mono text-xs leading-relaxed text-text-muted">
          The rest of initiation — choosing a handle, receiving a sigil, drawing a starter card —
          needs you signed in, so that what you pick is actually yours. Sign in with{" "}
          <span className="text-text-primary">that same address</span> and you will land on the
          account already waiting.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="rounded border border-accent-gold bg-accent-gold/15 px-5 py-2.5 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/25"
          >
            Sign in and finish →
          </Link>
          <Link
            href="/start-here"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-cyan/60 hover:text-accent-cyan"
          >
            Later — just let me read
          </Link>
        </div>
      </div>
    );
  }

  const busy = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 max-w-lg rounded-lg border border-accent-gold/25 bg-surface p-6 sm:p-8"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/70">
        {"// "}the first gate
      </p>
      <h2 className="mt-3 font-serif text-2xl font-black text-text-primary">
        Begin with an address.
      </h2>
      <p className="mt-3 font-mono text-xs leading-relaxed text-text-muted">
        Initiation starts here. Give us a name and an email and you are an Initiate immediately —
        account made, Gospel sent. You sign in afterwards to claim it and finish.
      </p>

      <div className="mt-6 space-y-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            What should we call you
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={80}
            required
            disabled={busy}
            className="w-full rounded border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted">
            Your email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={busy}
            className="w-full rounded border border-border bg-void px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30 disabled:opacity-50"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-5 w-full rounded border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/25 disabled:opacity-50"
      >
        {busy ? "Opening the gate…" : "Begin initiation"}
      </button>

      {message && (
        <p className="mt-3 font-mono text-xs text-red-400" role="alert">
          {message}
        </p>
      )}

      <p className="mt-5 border-t border-border pt-4 font-mono text-[11px] leading-relaxed text-text-muted/80">
        This creates a Codex account keyed to your email. No password is set and you are not signed
        in yet. Everything in the archive is readable without doing this at all, and one click in
        any email removes you permanently. What happens at every step from here is written down in{" "}
        <Link
          href="/onboarding/procedure"
          className="text-accent-cyan/80 underline underline-offset-2 hover:text-accent-cyan"
        >
          The First Gate Procedure
        </Link>
        .
      </p>

      <p className="mt-4 text-center font-mono text-[11px] text-text-muted/70">
        Already have an account?{" "}
        <Link
          href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-accent-cyan underline underline-offset-2"
        >
          Sign in instead
        </Link>
      </p>
    </form>
  );
}
