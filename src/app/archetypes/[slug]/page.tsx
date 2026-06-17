import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArchetype, ARCHETYPES } from "@/lib/archetypes";
import { ShareArchetypeCard } from "@/components/archetypes/share-archetype-card";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return ARCHETYPES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const archetype = getArchetype(slug);
  if (!archetype) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cultcodex.me";
  const ogImage = `${siteUrl}/api/archetype/${archetype.slug}/og`;

  return {
    title: `${archetype.name} — Archetypes — CULT CODEX`,
    description: archetype.summary,
    openGraph: {
      title: archetype.name,
      description: archetype.summary,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: archetype.name,
      description: archetype.summary,
      images: [ogImage],
    },
  };
}

export default async function ArchetypePage({ params }: Props) {
  const { slug } = await params;
  const archetype = getArchetype(slug);
  if (!archetype) notFound();

  const currentIndex = ARCHETYPES.findIndex((a) => a.slug === slug);
  const prev = ARCHETYPES[currentIndex - 1];
  const next = ARCHETYPES[currentIndex + 1];

  return (
    <div className="min-h-screen bg-void">
      {/* Ambient color glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[500px]"
        aria-hidden="true"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 10%, ${archetype.color}18 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-4 pt-16 pb-20">
        {/* Back */}
        <Link
          href="/archetypes"
          className="mb-10 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.35em] text-text-muted/50 transition-colors hover:text-text-muted"
        >
          ← All archetypes
        </Link>

        {/* Header */}
        <header className="mb-10 text-center">
          <div
            className="mb-5 text-7xl leading-none"
            style={{ color: archetype.color }}
          >
            {archetype.glyph}
          </div>

          <p
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.4em]"
            style={{ color: archetype.color, opacity: 0.7 }}
          >
            Archetype
          </p>

          <h1 className="font-display text-4xl font-bold italic text-text-primary">
            {archetype.name}
          </h1>

          <div
            className="mx-auto mt-5 w-16 h-px"
            style={{ backgroundColor: archetype.color, opacity: 0.4 }}
          />
        </header>

        {/* Summary */}
        <p className="mb-8 text-center font-serif text-lg italic leading-relaxed text-text-primary">
          {archetype.summary}
        </p>

        {/* Extended description */}
        <div
          className="mb-10 rounded-xl border p-6"
          style={{ borderColor: `${archetype.color}25`, backgroundColor: `${archetype.color}08` }}
        >
          <p className="font-serif text-sm leading-relaxed text-text-muted">
            {archetype.extended}
          </p>
        </div>

        {/* Shareable card */}
        <div className="mb-12 space-y-3">
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.35em] text-text-muted/60">
            {"/// share_your_archetype"}
          </p>
          <ShareArchetypeCard
            slug={archetype.slug}
            color={archetype.color}
            name={archetype.name}
          />
        </div>

        {/* Navigation between archetypes */}
        <nav className="flex items-center justify-between border-t border-border pt-8">
          {prev ? (
            <Link
              href={`/archetypes/${prev.slug}`}
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/50 transition-colors hover:text-text-muted"
            >
              <span className="text-base" style={{ color: prev.color }}>
                {prev.glyph}
              </span>
              <span>← {prev.name}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/archetypes/${next.slug}`}
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-text-muted/50 transition-colors hover:text-text-muted"
            >
              <span>{next.name} →</span>
              <span className="text-base" style={{ color: next.color }}>
                {next.glyph}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </div>
  );
}
