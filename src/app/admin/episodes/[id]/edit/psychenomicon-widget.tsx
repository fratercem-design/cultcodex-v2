"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  episodeId: string;
  hasTranscript: boolean;
  chapter: { chapterNumber: number; title: string; slug: string } | null;
}

export function PsychenomiconWidget({ episodeId, hasTranscript, chapter }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; slug?: string } | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/psychenomicon/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeId }),
      });
      const data = await res.json() as { ok?: boolean; chapter?: { chapterNumber: number; title: string; slug: string }; error?: string };
      if (data.ok && data.chapter) {
        setResult({
          ok: true,
          message: `CH.${String(data.chapter.chapterNumber).padStart(3, "0")} "${data.chapter.title}" generated.`,
          slug: data.chapter.slug,
        });
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
    <div className="rounded-lg border border-accent-violet/20 bg-accent-violet/5 p-5 space-y-3">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text">ψ Psychenomicon</p>

      {chapter ? (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Chapter already generated for this episode.</p>
          <div className="flex items-center gap-3">
            <Link
              href={`/psychenomicon/chapters/${chapter.slug}`}
              target="_blank"
              className="font-mono text-xs text-accent-violet-text hover:underline"
            >
              CH.{String(chapter.chapterNumber).padStart(3, "0")} {chapter.title} →
            </Link>
          </div>
        </div>
      ) : hasTranscript ? (
        <div className="space-y-3">
          <p className="text-xs text-text-muted leading-relaxed">
            No chapter generated yet. This episode has a transcript — it can be chronicled.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full border-2 border-accent-violet/40 border-t-accent-violet animate-spin" />
                Generating… (30–60s)
              </span>
            ) : "Generate Chapter →"}
          </button>
          {result && (
            <div className={`rounded border px-3 py-2 font-mono text-[12px] ${
              result.ok
                ? "border-accent-violet/30 bg-accent-violet/5 text-accent-violet-text"
                : "border-red-500/30 bg-red-500/5 text-red-400"
            }`}>
              {result.ok ? "✓ " : "✗ "}{result.message}
              {result.ok && result.slug && (
                <Link href={`/psychenomicon/chapters/${result.slug}`} target="_blank" className="ml-2 underline">
                  View →
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-text-muted italic">
          No transcript available yet. Ingest or upload a transcript to enable chapter generation.
        </p>
      )}
    </div>
  );
}
