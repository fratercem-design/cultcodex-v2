import type { Metadata } from "next";
import { DeepSearchConsole } from "@/components/search/deep-search-console";

export const metadata: Metadata = {
  title: "Deep Search — CultCodex",
  description:
    "Multi-concept intersection search across the full Cult of Psyche transcript archive. Find every episode where betrayal, astrology, and a specific person intersect.",
};

export default function DeepSearchPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
            Deep Search
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Intersection search
          </h1>
          <p className="text-zinc-400 leading-relaxed max-w-xl">
            Enter up to five concepts. Only transcript segments where all concepts
            converge will surface — powered by vector embeddings across the full archive.
          </p>
        </div>

        <DeepSearchConsole />
      </div>
    </main>
  );
}
