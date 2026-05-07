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

interface Props {
  episodes: Episode[];
}

export function GenerateChapterButton({ episodes }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    if (!selectedId) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/psychenomicon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId: selectedId }),
      });
      const data = await res.json() as { ok?: boolean; chapter?: { chapterNumber: number; title: string; slug: string }; error?: string };
      if (data.ok && data.chapter) {
        setResult({ ok: true, message: `CH.${String(data.chapter.chapterNumber).padStart(3, "0")} "${data.chapter.title}" generated.` });
        setSelectedId("");
        router.refresh();
      } else {
        setResult({ ok: false, message: data.error ?? "Generation failed." });
      }
    } catch {
      setResult({ ok: false, message: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        disabled={loading}
        className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-violet focus:outline-none disabled:opacity-50"
      >
        <option value="">Select an episode…</option>
        {episodes.map((ep) => (
          <option key={ep.id} value={ep.id}>
            {ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")} · ` : ""}
            {ep.title}
            {ep._count.segments > 0 ? ` (${ep._count.segments} segs)` : " (raw)"}
          </option>
        ))}
      </select>

      <button
        onClick={handleGenerate}
        disabled={!selectedId || loading}
        className="w-full rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-accent-violet/40 border-t-accent-violet animate-spin" />
            Generating… (30-60s)
          </span>
        ) : (
          "Generate Chapter →"
        )}
      </button>

      {result && (
        <div className={`rounded border px-3 py-2 font-mono text-[10px] ${
          result.ok
            ? "border-accent-violet/30 bg-accent-violet/5 text-accent-violet"
            : "border-red-500/30 bg-red-500/5 text-red-400"
        }`}>
          {result.ok ? "✓ " : "✗ "}{result.message}
        </div>
      )}

      <p className="font-mono text-[9px] text-text-muted leading-relaxed">
        Generation uses Claude to produce all three text layers (canon, interpretation, mythic), entity profiles, and narrative threads. Takes 30–60 seconds.
      </p>
    </div>
  );
}
