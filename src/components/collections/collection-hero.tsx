/**
 * CollectionHero — The editorial header of a themed-collection page.
 *
 * Renders the icon, "Signal Pack N" eyebrow, mythic title + subtitle
 * question, and 1–3 paragraphs of framing copy. Color accent is driven
 * by `accentFor(accent)`, so every page pulls its own palette without
 * branching.
 *
 * NOTE: Pure presentational — accepts an already-resolved icon node.
 * Keep DB calls in the page; keep JSX here.
 */
import { accentFor } from "./collection-accents";
import type { CollectionAccent } from "@/lib/collections/themed-collections";

interface CollectionHeroProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string[];
  accent: CollectionAccent;
}

export function CollectionHero({
  icon,
  eyebrow,
  title,
  subtitle,
  description,
  accent,
}: CollectionHeroProps) {
  const a = accentFor(accent);

  return (
    <header className="space-y-5">
      <div className={`${a.icon}`}>{icon}</div>
      <div className="space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-text-muted">
          {eyebrow}
        </p>
        <h1
          className={`font-display text-3xl sm:text-4xl font-bold tracking-tight ${a.title}`}
        >
          {title}
        </h1>
        <p
          className={`font-mono text-sm italic ${a.eyebrow} leading-snug max-w-2xl`}
        >
          &ldquo;{subtitle}&rdquo;
        </p>
      </div>
      <div className="space-y-3 max-w-3xl">
        {description.map((para, i) => (
          <p
            key={i}
            className="text-sm text-text-muted leading-relaxed"
          >
            {para}
          </p>
        ))}
      </div>
    </header>
  );
}
