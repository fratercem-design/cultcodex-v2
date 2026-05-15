"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface TranscriptResult {
  episodeId: string;
  slug: string;
  videoId: string;
  status: "ok" | "no_transcript" | "error";
  segments?: number;
  error?: string;
}

interface ChannelSyncResult {
  fetched: number;
  created: number;
  skipped: number;
}

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
  );
}

export function SyncPanel({ withoutTranscript }: { withoutTranscript: number }) {
  const router = useRouter();

  // ── Channel sync state ──
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    ok: boolean;
    totalCreated?: number;
    results?: Record<string, ChannelSyncResult>;
    error?: string;
  } | null>(null);

  // ── Transcript sync state ──
  const [transcriptLimit, setTranscriptLimit] = useState(20);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<{
    ok: boolean;
    summary?: { processed: number; ok: number; no_transcript: number; errors: number; remaining: number };
    results?: TranscriptResult[];
    error?: string;
  } | null>(null);

  async function handleChannelSync() {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-channel-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json() as typeof syncResult;
      setSyncResult(data);
      router.refresh();
    } catch {
      setSyncResult({ ok: false, error: "Network error." });
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleTranscriptSync() {
    setTranscriptLoading(true);
    setTranscriptResult(null);
    try {
      const res = await fetch("/api/admin/sync-transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: transcriptLimit }),
      });
      const data = await res.json() as typeof transcriptResult;
      setTranscriptResult(data);
      router.refresh();
    } catch {
      setTranscriptResult({ ok: false, error: "Network error." });
    } finally {
      setTranscriptLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">

      {/* ── Channel Sync ── */}
      <section className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-6 space-y-5">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">/// sync_episodes</p>
          <h2 className="font-display text-lg font-bold text-text-primary">Import All Episodes</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Sweeps the full uploads history of <strong className="text-text-primary">@CultofPsyche</strong> and{" "}
            <strong className="text-text-primary">@PsychesNightmares</strong> on YouTube — every video, paginating
            through the entire playlist. Safe to re-run; only inserts videos not already in the DB.
          </p>
          <p className="font-mono text-[9px] text-text-muted/60">
            Requires <code>YOUTUBE_API_KEY</code> env var. Takes 1–3 minutes for full history.
          </p>
        </div>

        <button
          onClick={handleChannelSync}
          disabled={syncLoading}
          className="w-full flex items-center justify-center gap-2 rounded border border-accent-cyan/50 bg-accent-cyan/10 hover:bg-accent-cyan/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncLoading ? <><Spinner /> Sweeping channels… (this takes a few minutes)</> : "Sync All Episodes →"}
        </button>

        {syncResult && (
          <div className={`rounded border px-4 py-3 space-y-2 ${syncResult.ok ? "border-accent-cyan/30 bg-accent-cyan/5" : "border-red-500/30 bg-red-500/5"}`}>
            {syncResult.ok ? (
              <>
                <p className="font-mono text-xs font-bold text-accent-cyan">
                  ✓ {syncResult.totalCreated} new episode{syncResult.totalCreated !== 1 ? "s" : ""} created
                </p>
                {syncResult.results && Object.entries(syncResult.results).map(([handle, r]) => (
                  <div key={handle} className="font-mono text-[10px] text-text-muted space-y-0.5">
                    <p className="text-text-primary">{handle}</p>
                    <p>Fetched: {r.fetched} · Created: {r.created} · Skipped: {r.skipped}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="font-mono text-xs text-red-400">✗ {syncResult.error}</p>
            )}
          </div>
        )}
      </section>

      {/* ── Transcript Sync ── */}
      <section className="rounded-lg border border-accent-violet/20 bg-accent-violet/5 p-6 space-y-5">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">/// sync_transcripts</p>
          <h2 className="font-display text-lg font-bold text-text-primary">Fetch Transcripts</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Pulls YouTube auto-captions for episodes that have a video ID but no transcript yet.
            Stores as searchable <code>TranscriptSegment</code> rows — used by the Psychenomicon
            chapter generator and full-text search.
          </p>
          <p className="font-mono text-[9px] text-text-muted/60">
            {withoutTranscript.toLocaleString()} episodes still need transcripts. No API key required.
            Run multiple batches to cover them all (~1s per video).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="font-mono text-[10px] text-text-muted whitespace-nowrap">Batch size</label>
          <select
            value={transcriptLimit}
            onChange={(e) => setTranscriptLimit(Number(e.target.value))}
            disabled={transcriptLoading}
            className="rounded border border-border bg-void px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-violet focus:outline-none disabled:opacity-50"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} episodes</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleTranscriptSync}
          disabled={transcriptLoading || withoutTranscript === 0}
          className="w-full flex items-center justify-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {transcriptLoading
            ? <><Spinner /> Fetching {transcriptLimit} transcripts…</>
            : withoutTranscript === 0
            ? "All transcripts fetched ✓"
            : `Fetch Next ${transcriptLimit} Transcripts →`}
        </button>

        {transcriptResult && (
          <div className={`rounded border px-4 py-3 space-y-2 ${transcriptResult.ok ? "border-accent-violet/30 bg-accent-violet/5" : "border-red-500/30 bg-red-500/5"}`}>
            {transcriptResult.ok && transcriptResult.summary ? (
              <>
                <div className="flex flex-wrap gap-4 font-mono text-[10px]">
                  <span className="text-accent-violet">✓ {transcriptResult.summary.ok} fetched</span>
                  {transcriptResult.summary.no_transcript > 0 && (
                    <span className="text-text-muted">— {transcriptResult.summary.no_transcript} no captions</span>
                  )}
                  {transcriptResult.summary.errors > 0 && (
                    <span className="text-red-400">✗ {transcriptResult.summary.errors} errors</span>
                  )}
                  {transcriptResult.summary.remaining > 0 && (
                    <span className="text-accent-gold">{transcriptResult.summary.remaining.toLocaleString()} remaining</span>
                  )}
                </div>
                {transcriptResult.results && (
                  <div className="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                    {transcriptResult.results.map((r) => (
                      <div key={r.episodeId} className="flex items-center gap-2 font-mono text-[9px]">
                        <span className={r.status === "ok" ? "text-accent-violet" : r.status === "no_transcript" ? "text-text-muted" : "text-red-400"}>
                          {r.status === "ok" ? "✓" : r.status === "no_transcript" ? "—" : "✗"}
                        </span>
                        <span className="text-text-muted truncate flex-1">{r.slug}</span>
                        {r.segments && <span className="text-text-muted/50">{r.segments}s</span>}
                        {r.error && <span className="text-red-400/70 truncate">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="font-mono text-xs text-red-400">✗ {transcriptResult?.error}</p>
            )}
          </div>
        )}
      </section>

      {/* ── How to run everything ── */}
      <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-5 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">/// full_pipeline</p>
        <ol className="space-y-2 font-mono text-xs text-text-muted list-decimal list-inside">
          <li>Click <strong className="text-text-primary">Sync All Episodes</strong> — imports every YouTube video as an Episode row.</li>
          <li>Click <strong className="text-text-primary">Fetch Next 100 Transcripts</strong> repeatedly until "remaining" hits 0. Each batch takes ~100 seconds.</li>
          <li>Go to <strong className="text-text-primary">Psychenomicon → Generate</strong> and batch-generate chapters from episodes with transcripts.</li>
        </ol>
      </div>

    </div>
  );
}
