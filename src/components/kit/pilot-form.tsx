"use client";

import { useState } from "react";

const INPUT =
  "w-full rounded-md border border-border bg-void px-3 py-2.5 text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold focus:outline-none";
const LABEL = "font-mono text-xs uppercase tracking-wider text-text-muted";

export function PilotForm() {
  const [fields, setFields] = useState({ name: "", email: "", channelUrl: "", replayUrl: "", note: "", website: "" });
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/kit/pilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        setState("done");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't send that. Try again.");
    } catch {
      setError("Network error. Check your connection and try again.");
    }
    setState("idle");
  }

  if (state === "done") {
    return (
      <p role="status" className="rounded-md border border-accent-cyan/50 bg-accent-cyan-dim p-4 text-text-primary">
        Got it. We&rsquo;ll reply by email within a day or two. If you&rsquo;re one of the 5, we&rsquo;ll ask for your
        replay link if you didn&rsquo;t include it.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className={LABEL}>Name or channel name</span>
          <input required maxLength={80} autoComplete="name" value={fields.name} onChange={set("name")} className={INPUT} />
        </label>
        <label className="block space-y-1">
          <span className={LABEL}>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={fields.email}
            onChange={set("email")}
            placeholder="you@example.com"
            className={INPUT}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className={LABEL}>Channel link</span>
        <input
          type="url"
          required
          inputMode="url"
          value={fields.channelUrl}
          onChange={set("channelUrl")}
          placeholder="https://youtube.com/@yourchannel"
          className={INPUT}
        />
      </label>
      <label className="block space-y-1">
        <span className={LABEL}>Latest live replay (optional)</span>
        <input
          type="url"
          inputMode="url"
          value={fields.replayUrl}
          onChange={set("replayUrl")}
          placeholder="https://youtube.com/live/..."
          className={INPUT}
        />
      </label>
      <label className="block space-y-1">
        <span className={LABEL}>Anything we should know? (optional)</span>
        <textarea maxLength={1000} rows={3} value={fields.note} onChange={set("note")} className={INPUT} />
      </label>
      {/* Honeypot: hidden from people and screen readers; bots fill it in. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={fields.website}
        onChange={set("website")}
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      {error && (
        <p role="alert" className="text-sm text-accent-crimson-text">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-md bg-accent-gold px-5 py-3 font-display font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {state === "loading" ? "Sending…" : "Request my free kit"}
      </button>
    </form>
  );
}
