"use client";

import { useState } from "react";

export type SaveSearchKind = "simple" | "deep" | "oracle";

export interface SaveSearchPayload {
  kind: SaveSearchKind;
  query?: string;
  concepts?: string[];
  thresholds?: number[];
  eraId?: string | null;
  personSlug?: string | null;
  archetype?: string | null;
}

interface Props {
  /** Build the payload at click time so it reflects the current query state. */
  buildPayload: () => SaveSearchPayload | null;
  /** Suggested label seed for the input. Generated from current query if omitted. */
  defaultLabel?: string;
  /** Visual variant — defaults to a compact ghost button. */
  variant?: "ghost" | "filled";
}

type Status = "idle" | "saving" | "saved" | "error" | "auth";

export function SaveSearchButton({ buildPayload, defaultLabel = "", variant = "ghost" }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function openDialog() {
    setLabel(defaultLabel || suggestLabel(buildPayload()));
    setStatus("idle");
    setErrorMsg("");
    setOpen(true);
  }

  async function save() {
    const payload = buildPayload();
    if (!payload) {
      setStatus("error");
      setErrorMsg("Nothing to save — enter a query first.");
      return;
    }
    const trimmed = label.trim();
    if (!trimmed) {
      setStatus("error");
      setErrorMsg("Give this search a name.");
      return;
    }

    setStatus("saving");
    try {
      const res = await fetch("/api/me/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, label: trimmed }),
      });
      if (res.status === 401) {
        setStatus("auth");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg((data as { error?: string }).error ?? "Save failed.");
        return;
      }
      setStatus("saved");
      setTimeout(() => setOpen(false), 900);
    } catch {
      setStatus("error");
      setErrorMsg("Network error.");
    }
  }

  const btnClass =
    variant === "filled"
      ? "rounded-lg bg-violet-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
      : "rounded-lg border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary hover:border-accent-violet/40";

  return (
    <>
      <button type="button" onClick={openDialog} className={btnClass}>
        ✚ Save search
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: "var(--term-panel)", borderColor: "var(--term-line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Save this search</h2>
              <p className="mt-1 text-xs text-text-muted">
                Re-run it any time from <span className="text-violet-300">My Codex</span>.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="block text-xs uppercase tracking-widest text-text-muted">Label</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
                placeholder="e.g. Betrayal × Wanda"
                autoFocus
                maxLength={120}
                className="w-full rounded-lg border px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent-violet/60 focus:outline-none"
                style={{ backgroundColor: "var(--term-bg)", borderColor: "var(--term-line-2)" }}
              />
            </label>

            {status === "auth" && (
              <p className="text-xs text-amber-400">
                You need to be signed in. <a href="/auth/signin" className="underline">Sign in →</a>
              </p>
            )}
            {status === "error" && <p className="text-xs text-red-400">{errorMsg}</p>}
            {status === "saved" && <p className="text-xs text-emerald-400">Saved ✓</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={status === "saving" || status === "saved"}
                className="rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40"
              >
                {status === "saving" ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function suggestLabel(payload: SaveSearchPayload | null): string {
  if (!payload) return "";
  if (payload.kind === "deep" && payload.concepts && payload.concepts.length > 0) {
    return payload.concepts.join(" × ");
  }
  if (payload.query) {
    return payload.query.slice(0, 80);
  }
  return "";
}
