"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { track } from "@/lib/stream-alchemist/analytics";
import { DEMO_TRANSCRIPT } from "@/lib/stream-alchemist/demo-transcript";
import { toCsv, toMarkdown } from "@/lib/stream-alchemist/export";
import type { AnalysisResult } from "@/lib/stream-alchemist/types";
import { ClipCard, LockedClipCard } from "./clip-card";

type Status = "idle" | "loading" | "done" | "error";

function download(filename: string, content: string, type: string) {
  // BOM so Excel opens the CSV as UTF-8 (curly quotes, emoji in captions).
  const blob = new Blob([type.startsWith("text/csv") ? "﻿" + content : content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function Analyzer({ upsell }: { upsell: React.ReactNode }) {
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [usedDemo, setUsedDemo] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const pasteDemo = () => {
    setTranscript(DEMO_TRANSCRIPT);
    setUsedDemo(true);
    track("sa_demo_used");
  };

  const analyze = async () => {
    setStatus("loading");
    setError("");
    track("sa_analysis_started", { chars: transcript.length, demo: usedDemo && transcript === DEMO_TRANSCRIPT });
    try {
      const res = await fetch("/api/stream-alchemist/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json().catch(() => ({ error: "The server sent back something unreadable." }));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setResult(data as AnalysisResult);
      setStatus("done");
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const exportAs = (format: "csv" | "md") => {
    if (!result) return;
    track("sa_export_clicked", { format, clips: result.clips.length });
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") download(`stream-alchemist-clips-${stamp}.csv`, toCsv(result.clips), "text/csv;charset=utf-8");
    else download(`stream-alchemist-clips-${stamp}.md`, toMarkdown(result.clips), "text/markdown;charset=utf-8");
  };

  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const tooShort = transcript.trim().length < 300;

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-line bg-surface p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="sa-transcript" className="font-display text-lg font-semibold text-ink">
            Your transcript
          </label>
          <button
            type="button"
            onClick={pasteDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-oracle/40 px-3 py-1.5 font-mono text-[12px] uppercase tracking-wider text-oracle transition hover:bg-oracle/10"
          >
            <Sparkles className="size-3.5" aria-hidden /> Paste demo transcript
          </button>
        </div>
        <textarea
          id="sa-transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={12}
          spellCheck={false}
          placeholder={"Paste a transcript. Timestamps like [01:23], 00:01:23, or SRT/VTT captions give you exact clip times.\n\n[00:00] Okay we are live…\n[00:07] Welcome back to the show…"}
          className="w-full resize-y rounded-xl border border-line bg-void p-4 font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-3/70 focus:border-line-strong focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[12px] text-ink-3">
            {words.toLocaleString()} words
            {words > 0 && ` · ~${Math.max(1, Math.round(words / 150))} min of talk`}
          </p>
          <button
            type="button"
            onClick={analyze}
            disabled={tooShort || status === "loading"}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 font-display text-sm font-semibold text-on-brand transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden /> Finding clips…
              </>
            ) : (
              <>
                <Wand2 className="size-4" aria-hidden /> Find my clips
              </>
            )}
          </button>
        </div>
        {status === "error" && (
          <p role="alert" className="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-sm text-error">
            {error}
          </p>
        )}
      </section>

      {result && (
        <section ref={resultsRef} className="scroll-mt-6 space-y-6" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-member">
                ✦ {result.clips.length + result.locked.length} clip candidates found
              </p>
              <h2 className="font-display text-2xl font-bold text-ink">Your clip plan</h2>
              <p className="text-sm text-ink-3">
                {result.mode === "ai" ? "Written by Claude." : "Built-in engine. Every line is quoted from your transcript."}
                {!result.hasTimestamps && " No timestamps found, so use the “Starts with” line to find each clip."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportAs("csv")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 font-mono text-[12px] uppercase tracking-wider text-ink transition hover:bg-elevated"
              >
                <Download className="size-3.5" aria-hidden /> CSV
              </button>
              <button
                type="button"
                onClick={() => exportAs("md")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 font-mono text-[12px] uppercase tracking-wider text-ink transition hover:bg-elevated"
              >
                <FileText className="size-3.5" aria-hidden /> Markdown
              </button>
            </div>
          </div>

          {result.notice && (
            <p className="rounded-lg border border-member/30 bg-member/5 px-3 py-2 text-sm text-member">{result.notice}</p>
          )}

          <div className="space-y-6">
            {result.clips.map((clip) => (
              <ClipCard key={clip.rank} clip={clip} />
            ))}
          </div>

          {result.locked.length > 0 && (
            <div className="space-y-6 pt-4">
              <div className="space-y-1 text-center">
                <h3 className="font-display text-xl font-bold text-ink">
                  {result.locked.length} more clips found in this stream
                </h3>
                <p className="text-sm text-ink-3">The free plan shows the top 3. Creator and Lifetime show all of them.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {result.locked.map((clip) => (
                  <LockedClipCard key={clip.rank} clip={clip} />
                ))}
              </div>
              {upsell}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
