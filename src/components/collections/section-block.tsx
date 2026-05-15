/**
 * SectionBlock — A content stack module inside a themed-collection page.
 *
 * Pattern: vertical colored bar (4px wide) next to a mono-eyebrow label
 * and an optional caption, then arbitrary children below. Gives every
 * section on a /collections/[slug] page the same visual rhythm.
 *
 * Usage:
 *   <SectionBlock eyebrow="/// signal_chips" accent="gold">…</SectionBlock>
 */
import { accentFor } from "./collection-accents";
import type { CollectionAccent } from "@/lib/collections/themed-collections";

interface SectionBlockProps {
  eyebrow: string;
  caption?: string;
  accent: CollectionAccent;
  children: React.ReactNode;
  id?: string;
}

export function SectionBlock({
  eyebrow,
  caption,
  accent,
  children,
  id,
}: SectionBlockProps) {
  const a = accentFor(accent);

  return (
    <section id={id} className="flex gap-4">
      <div
        className={`w-1 flex-shrink-0 rounded-full ${a.sectionBar} opacity-60`}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0 space-y-4">
        <div className="space-y-1">
          <p
            className={`font-mono text-[10px] uppercase tracking-[0.3em] ${a.eyebrow}`}
          >
            {eyebrow}
          </p>
          {caption && (
            <p className="text-xs text-text-muted leading-relaxed">{caption}</p>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
