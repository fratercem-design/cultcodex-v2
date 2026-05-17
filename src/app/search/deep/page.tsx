import type { Metadata } from "next";
import { DeepSearchConsole } from "@/components/search/deep-search-console";

export const metadata: Metadata = {
  title: "Deep Search — CultCodex",
  description:
    "Multi-concept intersection search across the full Cult of Psyche transcript archive. Find every episode where betrayal, astrology, and a specific person intersect.",
};

export default function DeepSearchPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--term-bg)", color: "var(--term-fg)" }}>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em]" style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}>
            // deep_search
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-text-primary">
            Intersection Search
          </h1>
          <p className="font-mono text-sm text-text-muted leading-relaxed max-w-xl">
            Enter up to five concepts. Only transcript segments where all concepts
            converge will surface — powered by vector embeddings across the full archive.
          </p>
        </div>

        <DeepSearchConsole />
      </div>
    </main>
  );
}
