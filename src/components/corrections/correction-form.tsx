"use client";

import { FormEvent, useEffect, useState } from "react";
import { CORRECTION_LIMITS, CORRECTION_TYPES, type CorrectionType } from "@/lib/corrections";

type SubmitState = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "w-full rounded-lg border border-border bg-void px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none";
const labelClass = "block font-mono text-[12px] uppercase tracking-wider text-text-muted";

export function CorrectionForm({
  initialType,
  entityTitle,
}: {
  initialType: CorrectionType;
  entityTitle: string | null;
}) {
  const [pageUrl, setPageUrl] = useState("");
  const [type, setType] = useState<CorrectionType>(initialType);
  const [details, setDetails] = useState("");
  const [correct, setCorrect] = useState("");
  const [context, setContext] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  // "Suggest a correction" links don't carry the page URL, but the browser
  // does: prefill it from the referring page when it's on this site.
  useEffect(() => {
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.origin === window.location.origin && ref.pathname !== "/corrections") {
        setPageUrl(ref.href);
      }
    } catch {
      // Unparseable referrer: leave the field for the reporter.
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    try {
      const response = await fetch("/api/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl, type, details, correct, context, email, website }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; reference?: string };
      if (!response.ok) throw new Error(body.error || "The report didn't send. Please try again.");
      setState("success");
      setMessage(
        `Thanks, your report was sent (reference ${body.reference}).` +
          (email ? " We'll reply to your email if we need more detail." : ""),
      );
      setDetails("");
      setCorrect("");
      setContext("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  if (state === "success") {
    return (
      <div role="status" className="rounded-lg border border-accent-gold/40 bg-accent-gold/5 p-5 text-sm text-text-primary">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="mt-3 font-mono text-[12px] text-accent-gold-text hover:underline"
        >
          Report something else →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {entityTitle && (
        <p className="rounded-lg border border-border/50 bg-surface/30 px-4 py-3 font-mono text-xs text-text-muted">
          Reporting: &ldquo;{entityTitle}&rdquo;
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="c-page" className={labelClass}>Page with the error</label>
        <input
          id="c-page"
          required
          maxLength={CORRECTION_LIMITS.pageUrl}
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
          placeholder="https://cultcodex.me/episodes/…"
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="c-type" className={labelClass}>What kind of problem</label>
        <select
          id="c-type"
          value={type}
          onChange={(e) => setType(e.target.value as CorrectionType)}
          className={fieldClass}
        >
          {CORRECTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="c-details" className={labelClass}>What&apos;s wrong</label>
        <textarea
          id="c-details"
          required
          minLength={CORRECTION_LIMITS.minDetails}
          maxLength={CORRECTION_LIMITS.details}
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="c-correct" className={labelClass}>
          The correct information <span className="normal-case tracking-normal">(if you know it)</span>
        </label>
        <textarea
          id="c-correct"
          maxLength={CORRECTION_LIMITS.correct}
          rows={3}
          value={correct}
          onChange={(e) => setCorrect(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="c-context" className={labelClass}>
          Supporting context <span className="normal-case tracking-normal">(optional, e.g. a timestamp)</span>
        </label>
        <textarea
          id="c-context"
          maxLength={CORRECTION_LIMITS.context}
          rows={2}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="c-email" className={labelClass}>
          Your email <span className="normal-case tracking-normal">(optional, only if you want a reply)</span>
        </label>
        <input
          id="c-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={fieldClass}
        />
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input
          id="c-website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "submitting"}
          className="inline-flex min-h-11 items-center rounded-lg border border-accent-gold bg-accent-gold/15 px-6 font-mono text-sm font-bold text-accent-gold-text transition-colors hover:bg-accent-gold/25 disabled:opacity-50"
        >
          {state === "submitting" ? "Sending…" : "Send correction"}
        </button>
        <p aria-live="polite" className="font-mono text-[12px] text-red-400">
          {state === "error" ? message : ""}
        </p>
      </div>
    </form>
  );
}
