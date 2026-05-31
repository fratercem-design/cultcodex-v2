"use client";

import { useState } from "react";

interface EmailSignInFormProps {
  callbackUrl?: string;
}

type FormState = "idle" | "loading" | "sent" | "error";

export function EmailSignInForm({ callbackUrl }: EmailSignInFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackUrl }),
      });

      if (res.ok) {
        setState("sent");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "Something went wrong. Try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Check your connection.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="space-y-3 rounded-lg border border-accent-gold/30 bg-accent-gold/5 p-5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
          /// transmission_sent
        </p>
        <p className="font-display text-sm font-semibold text-text-primary">
          Check your inbox
        </p>
        <p className="font-mono text-[11px] text-text-muted">
          We sent a sign-in link to <span className="text-accent-gold">{email}</span>.
          It expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => { setState("idle"); setEmail(""); }}
          className="font-mono text-[10px] text-text-muted/60 hover:text-text-muted transition-colors underline underline-offset-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="magic-email" className="block font-mono text-[10px] uppercase tracking-wider text-text-muted mb-1.5">
          Email address
        </label>
        <input
          id="magic-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded border border-border bg-void px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/40 focus:border-accent-gold/60 focus:outline-none focus:ring-1 focus:ring-accent-gold/20 transition-colors disabled:opacity-50"
          disabled={state === "loading"}
        />
      </div>

      {state === "error" && (
        <p className="font-mono text-[10px] text-red-400/80">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={state === "loading" || !email}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-elevated px-4 py-3 font-mono text-sm text-text-primary transition-colors hover:border-accent-gold/50 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "loading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-gold border-t-transparent" />
            Sending link…
          </>
        ) : (
          "Send sign-in link"
        )}
      </button>
    </form>
  );
}
