import type { Metadata } from "next";
import Link from "next/link";
import { DeepSearchConsole } from "@/components/search/deep-search-console";
import { isDeepSearchEnabled } from "@/lib/deep-search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: "/search/deep" },
  title: "Deep Search — CultCodex",
  description:
    "Multi-concept intersection search across the full Cult of Psyche transcript archive. Find every episode where betrayal, astrology, and a specific person intersect.",
};

interface DeepSearchPageProps {
  searchParams: Promise<{ concept?: string }>;
}

export default async function DeepSearchPage({ searchParams }: DeepSearchPageProps) {
  const enabled = isDeepSearchEnabled();
  const { concept } = await searchParams;
  const fallbackHref = concept?.trim()
    ? `/transcripts?q=${encodeURIComponent(concept.trim().slice(0, 100))}`
    : "/transcripts";

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--term-bg)", color: "var(--term-fg)" }}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}>
            {"// deep_search"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Intersection Search
          </h1>
          <p className="font-mono text-sm text-text-muted leading-relaxed max-w-xl">
            Enter up to five concepts. Only transcript segments where all concepts
            converge will surface — powered by vector embeddings across the full archive.
          </p>
        </div>

        {enabled ? (
          <DeepSearchConsole />
        ) : (
          <div className="rounded-xl border border-violet-900/50 bg-violet-950/30 p-6 space-y-3">
            <p className="text-violet-200 font-medium">Deep Search is temporarily offline while we rebuild its index.</p>
            <p className="text-sm text-text-muted">
              Full-text search still covers every word of every transcript, with timestamps.
            </p>
            <Link
              href={fallbackHref}
              className="inline-block rounded-lg bg-violet-700 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
            >
              {concept?.trim() ? `Search transcripts for “${concept.trim().slice(0, 60)}”` : "Search transcripts"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
