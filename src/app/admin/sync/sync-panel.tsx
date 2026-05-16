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
  reason?: string;
}

interface ChannelSyncResult {
  fetched: number;
  created: number;
  skipped: number;
}

interface EnrichEpisodeResult {
  slug: string;
  title: string;
  ok: boolean;
  error?: string;
}

interface EnrichPeopleResult {
  slug: string;
  name: string;
  ok: boolean;
  error?: string;
}

function Spinner() {
  return (
    <span className="inline-block h-3 w-3 rounded-full border-2 border-current/30 border-t-current animate-spin" />
  );
}

export function SyncPanel({
  withoutTranscript,
  unenrichedEpisodes,
  unenrichedPeople,
  enrichSecret,
}: {
  withoutTranscript: number;
  unenrichedEpisodes: number;
  unenrichedPeople: number;
  enrichSecret: string;
}) {
  const router = useRouter();

  // ── Channel sync ──
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    ok: boolean;
    totalCreated?: number;
    results?: Record<string, ChannelSyncResult>;
    error?: string;
  } | null>(null);

  // ── Transcript sync ──
  const [transcriptLimit, setTranscriptLimit] = useState(20);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptResult, setTranscriptResult] = useState<{
    ok: boolean;
    summary?: { processed: number; ok: number; no_transcript: number; errors: number; remaining: number };
    results?: TranscriptResult[];
    error?: string;
  } | null>(null);

  // ── Episode enrichment ──
  const [enrichEpBatch, setEnrichEpBatch] = useState(3);
  const [enrichEpLoading, setEnrichEpLoading] = useState(false);
  const [enrichEpResult, setEnrichEpResult] = useState<{
    ok: boolean;
    processed?: number;
    remaining?: number;
    done?: boolean;
    results?: EnrichEpisodeResult[];
    error?: string;
  } | null>(null);

  // ── People enrichment ──
  const [enrichPeopleBatch, setEnrichPeopleBatch] = useState(5);
  const [enrichPeopleLoading, setEnrichPeopleLoading] = useState(false);
  const [enrichPeopleResult, setEnrichPeopleResult] = useState<{
    ok: boolean;
    processed?: number;
    remaining?: number;
    done?: boolean;
    results?: EnrichPeopleResult[];
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

  async function handleTranscriptSync(retry = false) {
    setTranscriptLoading(true);
    setTranscriptResult(null);
    try {
      const res = await fetch("/api/admin/sync-transcripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: transcriptLimit, retry }),
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

  async function handleEnrichEpisodes() {
    setEnrichEpLoading(true);
    setEnrichEpResult(null);
    try {
      const res = await fetch("/api/admin/enrich-episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-enrich-secret": enrichSecret,
        },
        body: JSON.stringify({ batch: enrichEpBatch, withTranscriptOnly: true }),
      });
      const data = await res.json() as typeof enrichEpResult;
      setEnrichEpResult({ ok: res.ok, ...data });
      router.refresh();
    } catch {
      setEnrichEpResult({ ok: false, error: "Network error." });
    } finally {
      setEnrichEpLoading(false);
    }
  }

  async function handleEnrichPeople() {
    setEnrichPeopleLoading(true);
    setEnrichPeopleResult(null);
    try {
      const res = await fetch("/api/admin/enrich-people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-enrich-secret": enrichSecret,
        },
        body: JSON.stringify({ batch: enrichPeopleBatch }),
      });
      const data = await res.json() as typeof enrichPeopleResult;
      setEnrichPeopleResult({ ok: res.ok, ...data });
      router.refresh();
    } catch {
      setEnrichPeopleResult({ ok: false, error: "Network error." });
    } finally {
      setEnrichPeopleLoading(false);
    }
  }

  return (
    <div className="space-y-8">

      {/* ── Row 1: Import + Transcripts ── */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Channel Sync */}
        <section className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-6 space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan">/// sync_episodes</p>
            <h2 className="font-display text-lg font-bold text-text-primary">Import All Episodes</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Sweeps the full uploads history of <strong className="text-text-primary">@CultofPsyche</strong> and{" "}
              <strong className="text-text-primary">@PsychesNightmares</strong> on YouTube.
              Safe to re-run; only inserts videos not already in the DB.
            </p>
            <p className="font-mono text-[9px] text-text-muted/60">
              Requires <code>YOUTUBE_API_KEY</code>. Takes 1–3 minutes.
            </p>
          </div>
          <button
            onClick={handleChannelSync}
            disabled={syncLoading}
            className="w-full flex items-center justify-center gap-2 rounded border border-accent-cyan/50 bg-accent-cyan/10 hover:bg-accent-cyan/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-cyan transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncLoading ? <><Spinner /> Sweeping channels…</> : "Sync All Episodes →"}
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

        {/* Transcript Sync */}
        <section className="rounded-lg border border-accent-violet/20 bg-accent-violet/5 p-6 space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">/// sync_transcripts</p>
            <h2 className="font-display text-lg font-bold text-text-primary">Fetch Transcripts</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Pulls YouTube auto-captions for episodes with a video ID but no transcript yet.
              Stored as searchable <code>TranscriptSegment</code> rows.
            </p>
            <p className="font-mono text-[9px] text-text-muted/60">
              {withoutTranscript.toLocaleString()} episodes still need transcripts. No API key required.
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
            onClick={() => handleTranscriptSync(false)}
            disabled={transcriptLoading || withoutTranscript === 0}
            className="w-full flex items-center justify-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transcriptLoading
              ? <><Spinner /> Fetching {transcriptLimit} transcripts…</>
              : withoutTranscript === 0
              ? "All transcripts fetched ✓"
              : `Fetch Next ${transcriptLimit} Transcripts →`}
          </button>
          <button
            onClick={() => handleTranscriptSync(true)}
            disabled={transcriptLoading}
            className="w-full flex items-center justify-center gap-2 rounded border border-accent-gold/40 bg-accent-gold/5 hover:bg-accent-gold/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-accent-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Re-try episodes previously marked as having no captions, using Whisper ASR generation."
          >
            ↻ Retry no-caption episodes (forces ASR)
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
                          {r.reason && r.status !== "ok" && <span className="text-yellow-500/60 truncate">{r.reason}</span>}
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
      </div>

      {/* ── Row 2: AI Enrichment ── */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* Episode Enrichment */}
        <section className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-6 space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold">/// enrich_episodes</p>
            <h2 className="font-display text-lg font-bold text-text-primary">Enrich Episodes</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Runs Claude Haiku on each episode transcript to extract summaries, guests, quotes,
              lore, and topics. Only processes episodes with transcripts that haven&apos;t been enriched yet.
            </p>
            <p className="font-mono text-[9px] text-text-muted/60">
              {unenrichedEpisodes.toLocaleString()} episodes need enrichment. Requires <code>ENRICH_SECRET</code> + <code>ANTHROPIC_API_KEY</code>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-mono text-[10px] text-text-muted whitespace-nowrap">Batch size</label>
            <select
              value={enrichEpBatch}
              onChange={(e) => setEnrichEpBatch(Number(e.target.value))}
              disabled={enrichEpLoading}
              className="rounded border border-border bg-void px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-gold focus:outline-none disabled:opacity-50"
            >
              {[1, 3, 5, 10].map((n) => (
                <option key={n} value={n}>{n} episode{n !== 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleEnrichEpisodes}
            disabled={enrichEpLoading || unenrichedEpisodes === 0}
            className="w-full flex items-center justify-center gap-2 rounded border border-accent-gold/50 bg-accent-gold/10 hover:bg-accent-gold/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrichEpLoading
              ? <><Spinner /> Enriching {enrichEpBatch} episode{enrichEpBatch !== 1 ? "s" : ""}…</>
              : unenrichedEpisodes === 0
              ? "All episodes enriched ✓"
              : `Enrich Next ${enrichEpBatch} Episode${enrichEpBatch !== 1 ? "s" : ""} →`}
          </button>
          {enrichEpResult && (
            <div className={`rounded border px-4 py-3 space-y-2 ${enrichEpResult.ok ? "border-accent-gold/30 bg-accent-gold/5" : "border-red-500/30 bg-red-500/5"}`}>
              {enrichEpResult.ok ? (
                <>
                  <div className="flex flex-wrap gap-4 font-mono text-[10px]">
                    <span className="text-accent-gold">✓ {enrichEpResult.processed} enriched</span>
                    {(enrichEpResult.remaining ?? 0) > 0 && (
                      <span className="text-text-muted">{enrichEpResult.remaining?.toLocaleString()} remaining</span>
                    )}
                    {enrichEpResult.done && <span className="text-accent-gold">— all done</span>}
                  </div>
                  {enrichEpResult.results && (
                    <div className="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                      {enrichEpResult.results.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-[9px]">
                          <span className={r.ok ? "text-accent-gold" : "text-red-400"}>{r.ok ? "✓" : "✗"}</span>
                          <span className="text-text-muted truncate flex-1">{r.title}</span>
                          {r.error && <span className="text-red-400/70 truncate">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="font-mono text-xs text-red-400">✗ {enrichEpResult.error}</p>
              )}
            </div>
          )}
        </section>

        {/* People Enrichment */}
        <section className="rounded-lg border border-accent-crimson/20 bg-accent-crimson/5 p-6 space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-crimson">/// enrich_people</p>
            <h2 className="font-display text-lg font-bold text-text-primary">Enrich People</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Generates <code>loreSummary</code> — a psychological/behavioral archive profile —
              for each person who has appearances but no profile yet. Feeds directly into Oracle answers.
            </p>
            <p className="font-mono text-[9px] text-text-muted/60">
              {unenrichedPeople.toLocaleString()} people need profiles. Requires <code>ENRICH_SECRET</code> + <code>ANTHROPIC_API_KEY</code>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-mono text-[10px] text-text-muted whitespace-nowrap">Batch size</label>
            <select
              value={enrichPeopleBatch}
              onChange={(e) => setEnrichPeopleBatch(Number(e.target.value))}
              disabled={enrichPeopleLoading}
              className="rounded border border-border bg-void px-2 py-1 font-mono text-xs text-text-primary focus:border-accent-crimson focus:outline-none disabled:opacity-50"
            >
              {[3, 5, 10].map((n) => (
                <option key={n} value={n}>{n} people</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleEnrichPeople}
            disabled={enrichPeopleLoading || unenrichedPeople === 0}
            className="w-full flex items-center justify-center gap-2 rounded border border-accent-crimson/50 bg-accent-crimson/10 hover:bg-accent-crimson/20 px-4 py-2.5 font-mono text-xs font-bold text-accent-crimson transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrichPeopleLoading
              ? <><Spinner /> Profiling {enrichPeopleBatch} people…</>
              : unenrichedPeople === 0
              ? "All profiles generated ✓"
              : `Generate Next ${enrichPeopleBatch} Profile${enrichPeopleBatch !== 1 ? "s" : ""} →`}
          </button>
          {enrichPeopleResult && (
            <div className={`rounded border px-4 py-3 space-y-2 ${enrichPeopleResult.ok ? "border-accent-crimson/30 bg-accent-crimson/5" : "border-red-500/30 bg-red-500/5"}`}>
              {enrichPeopleResult.ok ? (
                <>
                  <div className="flex flex-wrap gap-4 font-mono text-[10px]">
                    <span className="text-accent-crimson">✓ {enrichPeopleResult.processed} profiled</span>
                    {(enrichPeopleResult.remaining ?? 0) > 0 && (
                      <span className="text-text-muted">{enrichPeopleResult.remaining?.toLocaleString()} remaining</span>
                    )}
                    {enrichPeopleResult.done && <span className="text-accent-crimson">— all done</span>}
                  </div>
                  {enrichPeopleResult.results && (
                    <div className="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                      {enrichPeopleResult.results.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 font-mono text-[9px]">
                          <span className={r.ok ? "text-accent-crimson" : "text-red-400"}>{r.ok ? "✓" : "✗"}</span>
                          <span className="text-text-muted truncate flex-1">{r.name}</span>
                          {r.error && <span className="text-red-400/70 truncate">{r.error}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="font-mono text-xs text-red-400">✗ {enrichPeopleResult.error}</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* ── Pipeline guide ── */}
      <div className="rounded-lg border border-border bg-surface p-5 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">/// full_pipeline</p>
        <ol className="space-y-2 font-mono text-xs text-text-muted list-decimal list-inside">
          <li>Click <strong className="text-text-primary">Sync All Episodes</strong> — imports every YouTube video.</li>
          <li>Click <strong className="text-text-primary">Fetch Next 100 Transcripts</strong> repeatedly until "remaining" hits 0.</li>
          <li>Click <strong className="text-text-primary">Enrich Next 5 Episodes</strong> repeatedly — extracts guests, quotes, lore, topics.</li>
          <li>Click <strong className="text-text-primary">Generate Next 10 Profiles</strong> repeatedly — builds Oracle-ready character profiles.</li>
          <li>Go to <strong className="text-text-primary">Psychenomicon → Generate</strong> for deep-dive chapter generation.</li>
        </ol>
      </div>

    </div>
  );
}
