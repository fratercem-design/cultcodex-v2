import type { Metadata } from "next";
import Link from "next/link";
import { ARCHETYPES } from "@/lib/archetypes";
import { PageHero } from "@/components/ui/page-hero";
import { getCounts, fmtEpisodeCount } from "@/lib/queries/stats";

export const metadata: Metadata = {
  alternates: { canonical: "/archetypes" },
  title: "Archetypes — CULT CODEX",
  description:
    "Eight recurring patterns the Oracle has identified across the archive. Which one are you?",
};

export default async function ArchetypesPage() {
  const counts = await getCounts().catch(() => null);

  return (
    <div className="min-h-screen bg-void">
      <PageHero
        title="Archetypes"
        subtitle={`Eight patterns the Oracle has identified across ${fmtEpisodeCount(counts?.episodes ?? 0)} transmissions`}
        backgroundImage="/articles-bacgkground.jpg"
      />

      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="mx-auto mb-12 max-w-2xl text-center font-serif text-sm italic leading-relaxed text-text-muted">
          These are not personality types. They are the eight recurring configurations of attention
          that the archive has witnessed — the shapes that consciousness takes when it chooses to
          stay and look closely at the same thing for years.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ARCHETYPES.map((archetype) => (
            <Link
              key={archetype.slug}
              href={`/archetypes/${archetype.slug}`}
              className="group relative flex flex-col rounded-xl border border-border bg-surface p-5 transition-all hover:border-border/60 hover:bg-elevated"
              style={{
                "--archetype-color": archetype.color,
              } as React.CSSProperties}
            >
              {/* Subtle color accent on hover */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${archetype.color}12 0%, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              <div className="relative">
                {/* Glyph */}
                <div
                  className="mb-4 text-4xl leading-none transition-transform duration-300 group-hover:scale-110"
                  style={{ color: archetype.color }}
                >
                  {archetype.glyph}
                </div>

                {/* Name */}
                <h2 className="mb-1 font-display text-lg font-bold text-text-primary">
                  {archetype.name}
                </h2>

                {/* Summary */}
                <p className="font-serif text-xs italic leading-relaxed text-text-muted line-clamp-3">
                  {archetype.summary}
                </p>

                {/* Arrow */}
                <div
                  className="mt-4 font-mono text-[12px] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ color: archetype.color }}
                >
                  Explore ↗
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-16 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          {"/// eight_patterns · one_archive · who_are_you"}
        </p>
      </div>
    </div>
  );
}
