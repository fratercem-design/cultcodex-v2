import { QuoteShareButton } from "@/components/quotes/share-button";
import { formatSeconds } from "@/lib/format/duration";

interface QuoteHighlightCardProps {
  id: string;
  text: string;
  speakerName?: string | null;
  speakerAvatarUrl?: string | null;
  timestampSeconds?: number | null;
}

export function QuoteHighlightCard({
  id,
  text,
  speakerName,
  speakerAvatarUrl,
  timestampSeconds,
}: QuoteHighlightCardProps) {
  return (
    <div className="relative rounded-lg border border-border bg-elevated p-5 border-l-[3px] border-l-accent-gold/50">
      {/* Decorative quote mark */}
      <span
        className="pointer-events-none absolute top-3 left-4 font-serif text-5xl leading-none text-accent-gold/15 select-none"
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
                  className="h-6 w-6 rounded-full"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] font-bold text-accent-gold">
                  {speakerName[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-mono text-xs font-medium text-accent-gold">
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
    </div>
  );
}
