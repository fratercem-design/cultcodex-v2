import Link from "next/link";
import { formatSeconds } from "@/lib/format/duration";
import type { QuoteWithRelations } from "@/lib/queries/quotes";

interface QuoteCardProps {
  quote: QuoteWithRelations;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <blockquote className="border-l-2 border-accent-gold/50 pl-4">
        <p className="text-sm text-text-primary italic">
          &ldquo;{quote.text}&rdquo;
        </p>
      </blockquote>

      <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-text-muted">
        {quote.speaker && (
          <Link
            href={`/people/${quote.speaker.slug}`}
            className="text-accent-gold hover:text-accent-green transition-colors"
          >
            — {quote.speaker.displayName}
          </Link>
        )}
        {quote.episode && (
          <Link
            href={`/episodes/${quote.episode.slug}`}
            className="hover:text-accent-green transition-colors"
          >
            {quote.episode.title}
          </Link>
        )}
        {quote.timestampSeconds != null && (
          <span className="text-accent-green/60">
            {formatSeconds(quote.timestampSeconds)}
          </span>
        )}
      </div>
    </div>
  );
}
