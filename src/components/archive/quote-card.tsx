import Link from "next/link";
import { formatSeconds } from "@/lib/format/duration";
import type { QuoteWithRelations } from "@/lib/queries/quotes";
import {
  QuoteReactionBar,
  type QuoteReactionInitial,
} from "@/components/quotes/quote-reaction-bar";

interface QuoteCardProps {
  quote: QuoteWithRelations;
  /** Optional pre-loaded reaction state. Omit to hide the reaction bar. */
  reactions?: QuoteReactionInitial;
  isAuthenticated?: boolean;
}

export function QuoteCard({
  quote,
  reactions,
  isAuthenticated = false,
}: QuoteCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <blockquote className="border-l-2 border-red-400/50 pl-4">
        <p className="text-sm text-text-primary italic">
          &ldquo;{quote.text}&rdquo;
        </p>
      </blockquote>

      <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-[12px] text-text-muted">
        {quote.speaker && (
          <Link
            href={`/people/${quote.speaker.slug}`}
            className="flex items-center gap-1 text-accent-gold-text hover:text-accent-gold-text/80 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold shrink-0" />
            — {quote.speaker.displayName}
          </Link>
        )}
        {quote.episode && (
          <Link
            href={`/episodes/${quote.episode.slug}`}
            className="hover:text-accent-gold-text transition-colors"
          >
            {quote.episode.title}
          </Link>
        )}
        {quote.timestampSeconds != null && (
          <span className="text-text-muted">
            {formatSeconds(quote.timestampSeconds)}
          </span>
        )}
      </div>

      {reactions && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <QuoteReactionBar
            quoteId={quote.id}
            initial={reactions}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </div>
  );
}
