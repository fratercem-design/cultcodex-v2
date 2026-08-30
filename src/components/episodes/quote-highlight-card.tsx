import { QuoteShareButton } from "@/components/quotes/share-button";
import { PersonSigil } from "@/components/ui/person-sigil";
import {
  QuoteReactionBar,
  type QuoteReactionInitial,
} from "@/components/quotes/quote-reaction-bar";
import { formatSeconds } from "@/lib/format/duration";
import type { PersonType } from "@/generated/prisma/client";

interface QuoteHighlightCardProps {
  id: string;
  text: string;
  speakerName?: string | null;
  speakerAvatarUrl?: string | null;
  speakerSlug?: string | null;
  speakerType?: PersonType | null;
  timestampSeconds?: number | null;
  reactions?: QuoteReactionInitial;
  isAuthenticated?: boolean;
}

export function QuoteHighlightCard({
  id,
  text,
  speakerName,
  speakerAvatarUrl,
  speakerSlug,
  speakerType,
  timestampSeconds,
  reactions,
  isAuthenticated = false,
}: QuoteHighlightCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-elevated p-5 border-l-[3px] border-l-red-400/50">
      {/* Decorative quote mark */}
      <span
        className="pointer-events-none absolute top-3 left-4 font-serif text-5xl leading-none text-red-400/15 select-none"
        aria-hidden="true"
      >
        {"\u201C"}
      </span>

      {/* Quote text */}
      <p className="relative z-10 pl-4 text-base italic leading-relaxed text-text-primary">
        &ldquo;{text}&rdquo;
      </p>

      {/* Attribution + share */}
      <div className="mt-4 flex items-center justify-between pl-4">
        <div className="flex items-center gap-2">
          {speakerName && (
            <>
              {speakerAvatarUrl ? (
                <img
                  src={speakerAvatarUrl}
                  alt=""
                  className="h-6 w-6 rounded-full border border-accent-gold/30"
                />
              ) : speakerSlug ? (
                <PersonSigil
                  slug={speakerSlug}
                  name={speakerName}
                  personType={speakerType ?? "guest"}
                  size={24}
                  decorative
                  className="rounded-full border border-accent-gold/30"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] font-bold text-accent-gold-text">
                  {speakerName[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-mono text-xs font-medium text-accent-gold-text">
                {speakerName}
              </span>
            </>
          )}
          {timestampSeconds != null && (
            <span className="font-mono text-[10px] text-text-muted">
              at {formatSeconds(timestampSeconds)}
            </span>
          )}
        </div>
        <QuoteShareButton quoteId={id} quoteText={text} />
      </div>

      {reactions && (
        <div className="relative z-10 mt-3 pl-4">
          <QuoteReactionBar
            quoteId={id}
            initial={reactions}
            isAuthenticated={isAuthenticated}
          />
        </div>
      )}
    </div>
  );
}
