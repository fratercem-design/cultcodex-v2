"use client";

import { useState } from "react";
import Link from "next/link";

interface InitiateSignupProps {
  /** Where the lead was captured — stored on the Subscriber row for segmentation. */
  source?: string;
  className?: string;
}

type Status = "idle" | "loading" | "done" | "error";

/**
 * InitiateSignup — the lead-capture form for /initiate.
 *
 * Posts to /api/initiate, which stores the lead, provisions a CodexUser, and
 * sends the Gospel. On success it stays on the page and states what actually
 * happened, including the fact that an account now exists — the visitor is
 * told before they submit and reminded after.
 */
export function InitiateSignup({ source = "page:initiate", className = "" }: InitiateSignupProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading" || status === "done") return;
    if (!name.trim() || !email.trim()) {
      setStatus("error");
      setMessage("A name and an email address are both required.");
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
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        downloadUrl?: string;
      };
      if (res.ok && data.ok) {
        setDownloadUrl(data.downloadUrl ?? null);
        setStatus("done");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Sign-up failed. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "done") {
    return (
      <div
        className={`rounded-lg border border-accent-gold/30 bg-surface p-6 sm:p-8 ${className}`}
        role="status"
        aria-live="polite"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/70">
          {"// "}the gate is open
        </p>
        <h2 className="mt-3 font-serif text-2xl font-black text-accent-gold">
          Three things just happened.
        </h2>
        <ol className="mt-5 space-y-3 font-mono text-sm text-text-muted">
          <li>
            <span className="text-accent-cyan">01</span> &nbsp;The Gospel is on its way to{" "}
            <span className="text-text-primary">{email || "your inbox"}</span>.
          </li>
          <li>
            <span className="text-accent-cyan">02</span> &nbsp;Your Codex account exists. It is
            keyed to that email address and it is yours.
          </li>
          <li>
            <span className="text-accent-cyan">03</span> &nbsp;Nothing is locked behind it. The
            archive was always open — you can read it signed out.
          </li>
        </ol>

        <div className="mt-6 rounded border border-border bg-void/60 p-4">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            To claim the account, sign in with Google using{" "}
            <span className="text-text-primary">that same address</span>. You will land on the
            account already made for you — nothing is lost and nothing is duplicated. Until then it
            sits there, unclaimed and harmless.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="rounded border border-accent-gold bg-accent-gold/15 px-5 py-2.5 font-mono text-sm font-bold text-accent-gold transition hover:bg-accent-gold/25"
            >
              Download the Gospel
            </a>
          )}
          <Link
            href="/auth/signin?callbackUrl=/onboarding"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-primary transition hover:border-accent-cyan/60 hover:text-accent-cyan"
          >
            Claim the account →
          </Link>
          <Link
            href="/start-here"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-gold/60 hover:text-accent-gold"
          >
            Just start reading
          </Link>
        </div>
      </div>
    );
  }

  const busy = status === "loading";

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-lg border border-accent-gold/25 bg-surface p-6 sm:p-8 ${className}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/70">
        {"// "}first gate
      </p>
      <h2 className="mt-3 font-serif text-2xl font-black text-text-primary">
        Take the Gospel. Keep the account.
      </h2>
      <p className="mt-3 font-mono text-xs leading-relaxed text-text-muted">
        Two fields. You get{" "}
        <span className="text-accent-gold">The Gospel of Psyche&rsquo;s Nightmares</span> as a PDF,
        and a Codex account created in your name at the same time — so that when you decide to sign
        in, everything you have collected is already waiting.
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
            Where to send it
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
        className="mt-5 w-full rounded border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold transition hover:bg-accent-gold/25 disabled:opacity-50"
      >
        {busy ? "Opening the gate…" : "Send the Gospel & make my account"}
      </button>

      {message && (
        <p className="mt-3 font-mono text-xs text-red-400" role="alert">
          {message}
        </p>
      )}

      <p className="mt-5 border-t border-border pt-4 font-mono text-[11px] leading-relaxed text-text-muted/80">
        Submitting creates a Codex account keyed to your email. No password is set and you are not
        signed in — you claim it later with Google, or never, and it simply sits unused. We do not
        sell the list, and one click in any email removes you from it permanently. See the{" "}
        <Link
          href="/terms"
          className="text-accent-cyan/80 underline underline-offset-2 hover:text-accent-cyan"
        >
          terms
        </Link>{" "}
        and the{" "}
        <Link
          href="/onboarding/procedure"
          className="text-accent-cyan/80 underline underline-offset-2 hover:text-accent-cyan"
        >
          onboarding procedure
        </Link>
        , which describes exactly what happens next and is the same document we hold ourselves to.
      </p>
    </form>
  );
}
