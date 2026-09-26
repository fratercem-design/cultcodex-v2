"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function CommunityEmailSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "The signal could not be recorded.");
      }

      setEmail("");
      setState("success");
      setMessage("Check your inbox and click the link to confirm.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-accent-cyan/25 bg-gradient-to-b from-accent-cyan/5 to-surface p-6 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl text-accent-cyan" aria-hidden>✉</span>
          <h2 className="font-display text-lg font-bold text-text-primary">Receive the Signal</h2>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          Get archive updates and new transmissions by email. No paid membership required.
        </p>
      </div>

      <label htmlFor="community-email" className="sr-only">Email address</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="community-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-lg border border-border bg-void px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "submitting"}
          className="rounded-lg border border-accent-cyan/50 bg-accent-cyan/10 px-5 py-2.5 font-mono text-xs font-bold text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:opacity-50"
        >
          {state === "submitting" ? "Joining…" : "Join the email list →"}
        </button>
      </div>

      <div aria-live="polite" className="min-h-4">
        {message && (
          <p className={`font-mono text-[12px] ${state === "error" ? "text-red-400" : "text-accent-cyan"}`}>
            {message}
          </p>
        )}
      </div>
      <p className="font-mono text-[12px] leading-relaxed text-text-muted">
        Unsubscribe any time. See the <Link href="/privacy" className="underline hover:text-text-primary">privacy policy</Link>.
      </p>
    </form>
  );
}
