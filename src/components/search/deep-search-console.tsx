"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Link from "next/link";
import { ERAS } from "@/lib/eras";
import type { SemanticResult } from "@/lib/queries/semantic";

type SearchState = "idle" | "loading" | "done" | "error";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
      <span
        className="inline-block h-1.5 rounded-full bg-violet-500"
        style={{ width: `${Math.max(4, pct * 0.6)}px` }}
      />
      {pct}%
    </span>
  );
}

const THRESHOLD_PRESETS = [
  { label: "Precise", value: 0.72 },
  { label: "Balanced", value: 0.62 },
  { label: "Broad", value: 0.52 },
];

export function DeepSearchConsole() {
  const [chips, setChips] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [threshold, setThreshold] = useState(0.62);
  const [eraId, setEraId] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [results, setResults] = useState<SemanticResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [gated, setGated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addChip(value: string) {
    const trimmed = value.trim();
    if (!trimmed || chips.includes(trimmed) || chips.length >= 5) return;
    setChips((prev) => [...prev, trimmed]);
    setDraft("");
  }

  function removeChip(chip: string) {
    setChips((prev) => prev.filter((c) => c !== chip));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(draft);
    } else if (e.key === "Backspace" && draft === "" && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  }

  async function runSearch() {
    if (chips.length === 0) return;
    setState("loading");
    setResults([]);
    setErrorMsg("");
    setGated(false);

    try {
      const res = await fetch("/api/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepts: chips.map((concept) => ({ concept, threshold })),
          limit: 20,
          eraId: eraId || undefined,
        }),
      });

      if (res.status === 403) {
        setGated(true);
        setState("error");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? "Search failed.");
        setState("error");
        return;
      }

      const data = await res.json() as { results: SemanticResult[] };
      setResults(data.results ?? []);
      setState("done");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    }
  }

  const isRunnable = chips.length > 0 && state !== "loading";

  return (
    <div className="space-y-8">
      {/* Concept chip input */}
      <div className="space-y-3">
        <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
          Concepts — up to 5
        </label>
        <div
          className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 focus-within:border-violet-700 cursor-text min-h-[48px]"
          onClick={() => inputRef.current?.focus()}
        >
          {chips.map((chip) => (
            <span
              key={chip}
              className="flex items-center gap-1.5 rounded-full bg-violet-900/40 border border-violet-700/50 px-2.5 py-0.5 text-sm text-violet-200"
            >
              {chip}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeChip(chip); }}
                className="text-violet-400 hover:text-violet-100 leading-none"
                aria-label={`Remove "${chip}"`}
              >
                ×
              </button>
            </span>
          ))}
          {chips.length < 5 && (
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => draft.trim() && addChip(draft)}
              placeholder={chips.length === 0 ? "betrayal, astrology, Wanda…" : "add concept…"}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
            />
          )}
        </div>
        <p className="text-xs text-zinc-600">Press Enter or comma to add each concept. Only episodes matching ALL concepts will surface.</p>
      </div>

      {/* Threshold + Era filters */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Match sensitivity
          </label>
          <div className="flex gap-2">
            {THRESHOLD_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setThreshold(p.value)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  threshold === p.value
                    ? "bg-violet-800 text-violet-100 border border-violet-600"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Filter by era
          </label>
          <select
            value={eraId}
            onChange={(e) => setEraId(e.target.value)}
            className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-violet-700 focus:outline-none"
          >
            <option value="">All eras</option>
            {ERAS.map((era) => (
              <option key={era.id} value={era.id}>
                {era.sigil} {era.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Run button */}
      <button
        type="button"
        onClick={runSearch}
        disabled={!isRunnable}
        className="w-full rounded-xl bg-violet-800 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {state === "loading" ? "Searching…" : "Search the archive"}
      </button>

      {/* Loading pulse */}
      {state === "loading" && (
        <div className="flex justify-center py-8">
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="h-6 w-1 rounded-full bg-violet-600 animate-pulse"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Subscription gate */}
      {gated && (
        <div className="rounded-xl border border-violet-900/50 bg-violet-950/30 p-6 text-center space-y-3">
          <p className="text-violet-200 font-medium">Deep Search is a subscriber feature.</p>
          <p className="text-sm text-zinc-500">Subscribe to unlock multi-concept intersection search across the full transcript archive.</p>
          <Link
            href="/subscribe"
            className="inline-block rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
          >
            Subscribe
          </Link>
        </div>
      )}

      {/* Error */}
      {state === "error" && !gated && (
        <p className="text-sm text-red-400">{errorMsg || "Something went wrong."}</p>
      )}

      {/* Results */}
      {state === "done" && (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            {results.length === 0 ? "No matches found — try broader concepts or lower sensitivity." : `${results.length} segment${results.length !== 1 ? "s" : ""} matched all concepts`}
          </p>

          {results.map((r) => (
            <article
              key={r.segmentId}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/episodes/${r.episodeSlug}`}
                  className="text-sm font-medium text-violet-300 hover:text-violet-200 transition-colors leading-snug"
                >
                  {r.episodeTitle}
                  {r.episodeNumber && (
                    <span className="ml-2 text-xs text-zinc-600">#{r.episodeNumber}</span>
                  )}
                </Link>
                <Link
                  href={`/episodes/${r.episodeSlug}?t=${r.startSeconds}`}
                  className="shrink-0 text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
                >
                  {formatTime(r.startSeconds)}–{formatTime(r.endSeconds)}
                </Link>
              </div>

              {r.speakerLabel && (
                <p className="text-xs text-zinc-600 uppercase tracking-wide">{r.speakerLabel}</p>
              )}

              <blockquote className="text-sm text-zinc-300 leading-relaxed border-l-2 border-violet-800/60 pl-3">
                {r.text}
              </blockquote>

              {/* Per-concept scores */}
              <div className="flex flex-wrap gap-3 pt-1">
                {Object.entries(r.conceptScores).map(([concept, score]) => (
                  <div key={concept} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <span className="text-zinc-600">{concept}</span>
                    <ScoreBar score={score} />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
