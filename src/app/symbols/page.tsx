import Link from "next/link";
import type { Metadata } from "next";
import { SYMBOLS } from "@/lib/symbols/data";
import type { SymbolEntry } from "@/lib/symbols/data";
import { SymbolGlyph } from "@/components/symbols/symbol-glyph";

export const dynamic = "force-static";

export const metadata: Metadata = {
  alternates: { canonical: "/symbols" },
  title: "Symbol Encyclopedia — CultCodex",
  description:
    "Comprehensive history, occult meaning, and modern interpretation of the most significant esoteric symbols — from the Ouroboros to the Chaos Star.",
  openGraph: {
    title: "Symbol Encyclopedia — CultCodex",
    description:
      "History, occult meaning, and modern interpretation of the most significant esoteric symbols.",
  },
};

const CATEGORIES: SymbolEntry["category"][] = [
  "cosmic",
  "divine",
  "occult",
  "alchemical",
  "geometric",
  "mythological",
];

const CATEGORY_COLORS: Record<SymbolEntry["category"], string> = {
  cosmic: "border-accent-violet/40 text-accent-violet-text bg-accent-violet/10",
  divine: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10",
  occult: "border-red-500/40 text-red-400 bg-red-500/10",
  alchemical: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10",
  geometric: "border-blue-400/40 text-blue-400 bg-blue-500/10",
  mythological: "border-orange-400/40 text-orange-400 bg-orange-500/10",
};

export default function SymbolsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  {"// We use searchParams for static-safe filtering hint but since force-static"}
  {"// we render all — filtering is handled client-free via hash or just show all"}
  void searchParams;

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-accent-gold/5 to-void py-12 px-4">
        <div className="mx-auto max-w-5xl space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-gold-text/80">
            {"/// symbol_encyclopedia"}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-accent-gold/30" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            SYMBOL ENCYCLOPEDIA
          </h1>
          <div className="h-0.5 w-16 bg-accent-gold rounded-full" />
          <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
            History, occult meaning, and modern interpretation of the most significant esoteric symbols — from the ancient Egyptian wedjat to the modern Chaos Star. Each entry draws on genuine historical sources.
          </p>
        </div>
      </section>

      {/* Category chips */}
      <section className="border-b border-border px-4 py-5 bg-surface/40">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted mr-2">
              filter:
            </span>
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center rounded border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest cursor-default transition-colors ${CATEGORY_COLORS[cat]}`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Symbol grid */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SYMBOLS.map((symbol) => (
            <SymbolCard key={symbol.slug} symbol={symbol} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SymbolCard({ symbol }: { symbol: SymbolEntry }) {
  return (
    <Link
      href={`/symbols/${symbol.slug}`}
      className="group rounded-xl border border-border bg-surface p-5 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all duration-200 flex flex-col gap-3"
    >
      {/* Glyph */}
      <div className="text-accent-gold-text/80 group-hover:text-accent-gold-text transition-colors duration-200">
        <SymbolGlyph slug={symbol.slug} glyph={symbol.glyph} size={48} />
      </div>

      {/* Name + tagline */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="font-display text-sm font-bold text-text-primary group-hover:text-accent-gold-text transition-colors">
          {symbol.name}
        </p>
        <p className="font-mono text-[10px] text-text-muted leading-relaxed line-clamp-2">
          {symbol.tagline}
        </p>
      </div>

      {/* Category badge */}
      <div>
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${CATEGORY_COLORS[symbol.category]}`}
        >
          {symbol.category}
        </span>
      </div>
    </Link>
  );
}
