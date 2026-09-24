/**
 * SignalGrid — Renders a responsive grid of topic "signal chips" that
 * link into /topics/[slug]. Used on /collections/[slug] pages to show
 * "the signals this collection tracks."
 *
 * Data shape is intentionally narrow (title/slug/episodeCount) so the
 * collection page can map straight from its Prisma query without extra
 * reshaping.
 */
import Link from "next/link";
import { accentFor } from "./collection-accents";
import type { CollectionAccent } from "@/lib/collections/themed-collections";

export interface SignalChip {
  title: string;
  slug: string;
  episodeCount: number;
}

interface SignalGridProps {
  signals: SignalChip[];
  accent: CollectionAccent;
  /** Optional fallback shown when there are no signals. */
  emptyLabel?: string;
}

export function SignalGrid({
  signals,
  accent,
  emptyLabel = "No signals tracked yet.",
}: SignalGridProps) {
  const a = accentFor(accent);

  if (signals.length === 0) {
    return (
      <p className="font-mono text-xs text-text-muted italic">{emptyLabel}</p>
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {signals.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/topics/${s.slug}`}
            className={`group flex items-center justify-between gap-3 rounded-md border ${a.border} bg-surface px-3 py-2 transition-colors ${a.hoverBorder} ${a.hoverBg}`}
          >
            <span
              className={`font-sans text-xs font-medium text-text-primary group-hover:${a.title.replace("text-", "text-")} truncate`}
            >
              {s.title}
            </span>
            <span
              className={`font-mono text-[12px] uppercase tracking-wider ${a.eyebrow} flex-shrink-0`}
            >
              {s.episodeCount} ep{s.episodeCount === 1 ? "" : "s"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
