"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Episode {
  id: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  slug: string;
  _count: { segments: number };
}

interface BatchResult {
  episodeId: string;
  status: "ok" | "skipped" | "error";
  chapter?: { chapterNumber: number; slug: string; title: string };
  error?: string;
}

interface Props {
  episodes: Episode[];
}

function epLabel(ep: Episode) {
  return `${ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")} · ` : ""}${ep.title}`;
}

export function GenerateChapterButton({ episodes }: Props) {
  const [mode, setMode] = useState<"single" | "batch">("single");

  // Single mode state
  const [selectedId, setSelectedId] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Batch mode state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);

  const router = useRouter();

  async function handleSingle() {
    if (!selectedId) return;
    setSingleLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch("/api/admin/psychenomicon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: selectedId }),
      });
      const responseText = await res.text();
      let data: { ok?: boolean; chapter?: { chapterNumber: number; title: string; slug: string }; error?: string };
      try {
        data = JSON.parse(responseText);
      } catch {
        setSingleResult({ ok: false, message: `HTTP ${res.status}: ${responseText.slice(0, 200) || "empty response"}` });
        return;
      }
      if (data.ok && data.chapter) {
        setSingleResult({ ok: true, message: `CH.${String(data.chapter.chapterNumber).padStart(3, "0")} "${data.chapter.title}" generated.` });
        setSelectedId("");
        router.refresh();
      } else {
        setSingleResult({ ok: false, message: data.error ?? "Generation failed." });
      }
    } catch (err) {
      setSingleResult({ ok: false, message: `Network error: ${err instanceof Error ? err.message : String(err)}` });
    } finally {
      setSingleLoading(false);
    }
  }

  async function handleBatch() {
    if (selected.size === 0) return;
    setBatchLoading(true);
    setBatchResults(null);

    // Pass in chronological order (oldest first so chapter numbers are correct)
    const orderedIds = episodes
      .filter((ep) => selected.has(ep.id))
      .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
      .map((ep) => ep.id);

    try {
      const res = await fetch("/api/admin/psychenomicon/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeIds: orderedIds }),
      });
      const data = await res.json() as { ok?: boolean; results?: BatchResult[]; error?: string };
      if (data.ok && data.results) {
        setBatchResults(data.results);
        setSelected(new Set());
        router.refresh();
      } else {
        setBatchResults([{ episodeId: "batch", status: "error", error: data.error ?? "Batch failed." }]);
      }
    } catch {
      setBatchResults([{ episodeId: "batch", status: "error", error: "Network error." }]);
    } finally {
      setBatchLoading(false);
    }
  }

  function toggleAll() {
    if (selected.size === episodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(episodes.map((ep) => ep.id)));
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 rounded border border-border bg-void p-0.5">
        {(["single", "batch"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded px-3 py-1.5 font-mono text-[10px] transition-colors ${
              mode === m
                ? "bg-accent-violet/20 text-accent-violet border border-accent-violet/30"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {m === "single" ? "Single" : `Batch (${episodes.length})`}
          </button>
        ))}
      </div>

      {mode === "single" ? (
        <div className="space-y-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={singleLoading}
            className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-violet focus:outline-none disabled:opacity-50"
          >
            <option value="">Select an episode…</option>
            {episodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                {epLabel(ep)}{ep._count.segments > 0 ? ` (${ep._count.segments} segs)` : " (raw)"}
              </option>
            ))}
          </select>

          <button
            onClick={handleSingle}
            disabled={!selectedId || singleLoading}
            className="w-full rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {singleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-accent-violet/40 border-t-accent-violet animate-spin" />
                Generating… (30–60s)
              </span>
            ) : (
              "Generate Chapter →"
            )}
          </button>

          {singleResult && (
            <div className={`rounded border px-3 py-2 font-mono text-[10px] ${
              singleResult.ok
                ? "border-accent-violet/30 bg-accent-violet/5 text-accent-violet"
                : "border-red-500/30 bg-red-500/5 text-red-400"
            }`}>
              {singleResult.ok ? "✓ " : "✗ "}{singleResult.message}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Episode checklist */}
          <div className="max-h-64 overflow-y-auto space-y-1 rounded border border-border bg-void p-2">
            <button
              onClick={toggleAll}
              className="w-full text-left px-2 py-1 font-mono text-[9px] text-text-muted hover:text-accent-violet transition-colors"
            >
              {selected.size === episodes.length ? "Deselect all" : `Select all (${episodes.length})`}
            </button>
            {episodes.map((ep) => (
              <label
                key={ep.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer hover:bg-accent-violet/5 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selected.has(ep.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(ep.id);
                    else next.delete(ep.id);
                    setSelected(next);
                  }}
                  disabled={batchLoading}
                  className="accent-violet-500"
                />
                <span className="font-mono text-[10px] text-text-muted truncate">
                  {epLabel(ep)}
                  <span className="text-text-muted/40 ml-1">
                    {ep._count.segments > 0 ? `${ep._count.segments}s` : "raw"}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleBatch}
            disabled={selected.size === 0 || batchLoading}
            className="w-full rounded border border-accent-gold/50 bg-accent-gold/10 px-4 py-2.5 font-mono text-xs font-bold text-accent-gold hover:bg-accent-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {batchLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-accent-gold/40 border-t-accent-gold animate-spin" />
                Generating {selected.size} chapter{selected.size !== 1 ? "s" : ""}… (may take several minutes)
              </span>
            ) : (
              `Generate ${selected.size || "…"} Chapter${selected.size !== 1 ? "s" : ""} →`
            )}
          </button>

          {batchResults && (
            <div className="space-y-1.5">
              {batchResults.map((r, i) => {
                const ep = episodes.find((e) => e.id === r.episodeId);
                const label = ep ? epLabel(ep) : r.episodeId;
                return (
                  <div
                    key={i}
                    className={`rounded border px-3 py-2 font-mono text-[9px] flex items-start gap-2 ${
                      r.status === "ok"
                        ? "border-accent-violet/30 bg-accent-violet/5 text-accent-violet"
                        : r.status === "skipped"
                        ? "border-border text-text-muted"
                        : "border-red-500/30 bg-red-500/5 text-red-400"
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {r.status === "ok" ? "✓" : r.status === "skipped" ? "—" : "✗"}
                    </span>
                    <div className="min-w-0">
                      <span className="truncate block">{label}</span>
                      {r.status === "ok" && r.chapter && (
                        <span className="text-text-muted">
                          → CH.{String(r.chapter.chapterNumber).padStart(3, "0")} &ldquo;{r.chapter.title}&rdquo;
                        </span>
                      )}
                      {r.error && <span className="block">{r.error}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="font-mono text-[9px] text-text-muted leading-relaxed">
        Each chapter uses Claude to write three text layers (canon / interpretation / mythic), entity profiles, narrative threads, and archetype timeline events. Single: 30–60s. Batch processes sequentially to maintain chapter continuity.
      </p>
    </div>
  );
}
